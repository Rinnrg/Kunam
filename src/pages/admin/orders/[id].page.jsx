import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { AdminLayout } from '@src/components/admin/layout/admin-layout';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

const statusConfig = {
  pending: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  processing: { label: 'Processing', bg: '#dbeafe', color: '#1e40af' },
  shipped: { label: 'Shipped', bg: '#e0e7ff', color: '#3730a3' },
  delivered: { label: 'Delivered', bg: '#dcfce7', color: '#166534' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#991b1b' },
};

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession();
  const [showAlert] = useStore(useShallow((state) => [state.showAlert]));

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const data = await res.json();
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        showAlert({ type: 'error', title: 'Pesanan Tidak Ditemukan', message: data.message || 'Order tidak ditemukan' });
        router.push('/admin/orders');
      }
    } catch (err) {
      console.error(err);
      showAlert({ type: 'error', title: 'Terjadi Kesalahan', message: 'Gagal memuat order' });
      router.push('/admin/orders');
    } finally {
      setIsLoading(false);
    }
  }, [id, router, showAlert]);

  useEffect(() => {
    if (session?.user && id) fetchOrder();
  }, [session, id, fetchOrder]);

  const formatDate = (d) => new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const subtotal = (order?.order_items || []).reduce((sum, it) => sum + (it.price * it.quantity), 0);

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      </AdminLayout>
    );
  }

  if (!order) return null;

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Pesanan #{order.orderNumber || order.id}</h2>
              <div style={{ color: '#6b7280', fontSize: '0.95rem' }}>{formatDate(order.createdAt)}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Status badge */}
              {(() => {
                const info = statusConfig[order.status] || statusConfig.pending;
                return (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.35rem 0.75rem', fontSize: '0.9rem', fontWeight: 600, borderRadius: 9999, backgroundColor: info.bg, color: info.color }}>
                    {info.label}
                  </div>
                );
              })()}

              {/* Payment status */}
              <div style={{ padding: '0.35rem 0.75rem', borderRadius: 9999, background: order.paymentStatus === 'settlement' || order.paymentStatus === 'paid' ? '#dcfce7' : '#fef9c3', color: order.paymentStatus === 'settlement' || order.paymentStatus === 'paid' ? '#166534' : '#854d0e', fontWeight: 600 }}>
                {order.paymentStatus === 'settlement' || order.paymentStatus === 'paid' ? 'Paid' : order.paymentStatus === 'expire' ? 'Expired' : order.paymentStatus === 'cancel' ? 'Cancelled' : 'Pending'}
              </div>

              <Link href="/admin/orders" style={{ padding: '0.5rem 0.75rem', borderRadius: 6, background: '#f9fafb', color: '#111827', border: '1px solid #e5e7eb', textDecoration: 'none' }}>Kembali</Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
            <div>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.04)', marginBottom: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Produk</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {order.order_items?.map((item) => (
                    <div key={item.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ width: 80, height: 80, position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#f3f4f6' }}>
                        {item.produk?.gambar && (
                          <Image src={Array.isArray(item.produk.gambar) ? item.produk.gambar[0] : item.produk.gambar} alt={item.produk?.nama || 'Product'} fill sizes="80px" style={{ objectFit: 'cover' }} />
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{item.produk?.nama || 'Produk'}</div>
                        <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>{item.ukuran ? `Size: ${item.ukuran}` : ''} {item.warna ? `| Color: ${item.warna}` : ''}</div>
                        <div style={{ marginTop: 6, fontWeight: 700 }}>Rp {(item.price * item.quantity).toLocaleString('id-ID')}</div>
                      </div>
                      <div style={{ fontWeight: 600 }}>x{item.quantity}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                <h3 style={{ marginTop: 0 }}>Timeline</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.5rem 0.75rem', borderRadius: 9999, background: order.status === 'pending' ? '#fef9c3' : order.status === 'processing' ? '#dbeafe' : order.status === 'shipped' ? '#e0e7ff' : order.status === 'delivered' ? '#dcfce7' : '#fee2e2' }}>{order.status}</div>
                  <div style={{ color: '#6b7280' }}>{order.updatedAt ? new Date(order.updatedAt).toLocaleString('id-ID') : ''}</div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.04)', marginBottom: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Ringkasan Pembayaran</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                  <div>Subtotal ({order.order_items?.length || 0} item)</div>
                  <div>Rp {subtotal.toLocaleString('id-ID')}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                  <div>Ongkos Kirim</div>
                  <div>Rp 0</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                  <div>Diskon</div>
                  <div>-Rp 0</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', marginTop: '0.75rem', fontWeight: 700 }}>
                  <div>Total</div>
                  <div>Rp {order.totalAmount.toLocaleString('id-ID')}</div>
                </div>

                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Payment Type</div>
                  <div style={{ fontWeight: 600 }}>{order.paymentType || '-'}</div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 8 }}>Payment Status</div>
                  <div style={{ fontWeight: 600 }}>{order.paymentStatus || '-'}</div>
                </div>
              </div>

              <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                <h3 style={{ marginTop: 0 }}>Informasi Pelanggan</h3>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Nama</div>
                  <div style={{ fontWeight: 600 }}>{order.customerName || order.users?.name || '-'}</div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Email</div>
                  <div style={{ fontWeight: 600 }}>{order.customerEmail || order.users?.email || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Phone</div>
                  <div style={{ fontWeight: 600 }}>{order.customerPhone || order.users?.phone || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

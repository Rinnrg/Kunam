import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import CustomHead from '@src/components/dom/CustomHead';
import Breadcrumb from '@src/components/dom/Breadcrumb';
import LoadingSpinner from '@src/components/dom/LoadingSpinner';
import ReviewDialog from '@src/components/dom/ReviewDialog';
import styles from './pesanan.module.scss';

const STATUS_LABELS = {
  pending: 'Menunggu Pembayaran',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Pesanan Dibuat', icon: '📝' },
  { key: 'processing', label: 'Diproses', icon: '📦' },
  { key: 'shipped', label: 'Dikirim', icon: '🚚' },
  { key: 'delivered', label: 'Diterima', icon: '✅' },
];

function OrderDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = router.query;
  const [showAlert, setIsAuthModalOpen] = useStore(
    useShallow((state) => [state.showAlert, state.setIsAuthModalOpen])
  );

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewDialog, setReviewDialog] = useState({
    isOpen: false,
    produkId: null,
    produkName: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsAuthModalOpen(true);
      router.push('/');
    }
  }, [status, router, setIsAuthModalOpen]);

  const fetchOrderDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/user/orders/${id}`);
      const data = await res.json();
      
      if (res.ok && data.order) {
        setOrder(data.order);
      } else {
        showAlert({
          type: 'error',
          title: 'Pesanan Tidak Ditemukan',
          message: 'Pesanan yang Anda cari tidak ditemukan.',
        });
        router.push('/pesanan');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      showAlert({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: 'Gagal memuat detail pesanan. Silakan coba lagi.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, router, showAlert]);

  useEffect(() => {
    if (session?.user && id) {
      fetchOrderDetail();
    }
  }, [session, id, fetchOrderDetail]);

  const handleCancelOrder = useCallback(() => {
    showAlert({
      type: 'confirm',
      title: 'Batalkan Pesanan',
      message: 'Apakah Anda yakin ingin membatalkan pesanan ini?',
      confirmText: 'Batalkan',
      showCancel: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/user/orders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' }),
          });

          if (res.ok) {
            setOrder((prev) => ({ ...prev, status: 'cancelled' }));
            showAlert({
              type: 'success',
              title: 'Pesanan Dibatalkan',
              message: 'Pesanan berhasil dibatalkan.',
            });
          } else {
            throw new Error('Failed to cancel order');
          }
        } catch (error) {
          console.error('Error cancelling order:', error);
          showAlert({
            type: 'error',
            title: 'Terjadi Kesalahan',
            message: 'Gagal membatalkan pesanan. Silakan coba lagi.',
          });
        }
      },
    });
  }, [id, showAlert]);

  const handleBuyAgain = useCallback(async () => {
    if (!order) return;

    try {
      const addToCartPromises = order.order_items.map((item) =>
        fetch('/api/user/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produkId: item.produkId,
            quantity: item.quantity,
            ukuran: item.ukuran,
            warna: item.warna,
          }),
        })
      );

      await Promise.all(addToCartPromises);

      showAlert({
        type: 'success',
        title: 'Ditambahkan ke Keranjang',
        message: 'Semua produk berhasil ditambahkan ke keranjang.',
      });

      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showAlert({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: 'Gagal menambahkan produk ke keranjang.',
      });
    }
  }, [order, router, showAlert]);

  const handleOpenReviewDialog = useCallback(() => {
    if (order?.order_items?.[0]) {
      const firstItem = order.order_items[0];
      setReviewDialog({
        isOpen: true,
        produkId: firstItem.produkId,
        produkName: firstItem.produk?.nama || 'Produk',
      });
    }
  }, [order]);

  const handleCloseReviewDialog = useCallback(() => {
    setReviewDialog({
      isOpen: false,
      produkId: null,
      produkName: '',
    });
  }, []);

  const handleReviewSuccess = useCallback(() => {
    showAlert({
      type: 'success',
      title: 'Ulasan Terkirim',
      message: 'Terima kasih atas ulasan Anda!',
    });
    // Refresh order to update review flags
    fetchOrderDetail();
  }, [showAlert, fetchOrderDetail]);

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const formatShortDate = (dateString) => {
    const options = { day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const getTimelineStatus = (orderStatus, step) => {
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(orderStatus);
    const stepIndex = statusOrder.indexOf(step);

    if (orderStatus === 'cancelled') return '';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return '';
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!session?.user || !order) {
    return null;
  }

  const subtotal = order.order_items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

  return (
    <>
      <CustomHead 
        title={`Pesanan ${order.orderNumber} - Kunam`} 
        description="Detail pesanan Anda" 
      />
      <main className={styles.container}>
        <Breadcrumb items={[
          { label: 'Pesanan', href: '/pesanan' },
          { label: order.orderNumber, href: null }
        ]} />

        <div className={styles.orderDetail}>
          {/* Order Info Card */}
          <div className={styles.detailCard}>
            <div className={styles.detailHeader}>
              <div>
                <h2 className={styles.detailTitle}>{order.orderNumber}</h2>
                <p style={{ fontSize: '0.85rem', color: '#666' }}>{formatDate(order.createdAt)}</p>
              </div>
              <span className={`${styles.orderStatus} ${styles[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>

            {/* Timeline */}
            {order.status !== 'cancelled' && (
              <div className={styles.timeline}>
                <h4 className={styles.timelineTitle}>Status Pesanan</h4>
                <div className={styles.timelineSteps}>
                  {TIMELINE_STEPS.map((step) => {
                    const stepStatus = getTimelineStatus(order.status, step.key);
                    return (
                      <div key={step.key} className={styles.timelineStep}>
                        <div className={`${styles.stepIcon} ${stepStatus ? styles[stepStatus] : ''}`}>
                          {stepStatus === 'completed' ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <span style={{ fontSize: '12px' }}>{step.icon}</span>
                          )}
                        </div>
                        <div className={styles.stepInfo}>
                          <span className={styles.stepLabel}>{step.label}</span>
                          {stepStatus === 'active' && (
                            <span className={styles.stepDate}>{formatShortDate(order.updatedAt)}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Products Card */}
          <div className={styles.detailCard}>
            <div className={styles.detailHeader}>
              <h3 className={styles.detailTitle}>Produk Pesanan</h3>
            </div>
            <div className={styles.detailBody}>
              <div className={styles.orderItems}>
                {order.order_items?.map((item) => (
                  <div key={item.id} className={styles.orderItem}>
                    <div className={styles.itemImage}>
                      {item.produk?.gambar && (
                        <Image
                          src={Array.isArray(item.produk.gambar) ? item.produk.gambar[0] : item.produk.gambar}
                          alt={item.produk.nama || 'Product'}
                          fill
                          sizes="80px"
                          style={{ objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    <div className={styles.itemInfo}>
                      <Link href={`/produk/${item.produkId}`} className={styles.itemName}>
                        {item.produk?.nama || 'Produk'}
                      </Link>
                      {item.produk?.kategori && (
                        <p className={styles.itemVariant}>{item.produk.kategori}</p>
                      )}
                      {(item.ukuran || item.warna) && (
                        <p className={styles.itemVariant}>
                          {item.ukuran && `Size: ${item.ukuran}`}
                          {item.ukuran && item.warna && ' | '}
                          {item.warna && `Color: ${item.warna}`}
                        </p>
                      )}
                      <p className={styles.itemQuantity}>{item.quantity}x @ Rp {item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className={styles.itemPrice}>
                      Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Summary Card */}
          <div className={styles.detailCard}>
            <div className={styles.detailHeader}>
              <h3 className={styles.detailTitle}>Ringkasan Pembayaran</h3>
            </div>
            <div className={styles.detailBody}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Subtotal ({order.order_items?.length} item)</span>
                <span className={styles.detailValue}>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Ongkos Kirim</span>
                <span className={styles.detailValue}>Rp 0</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Diskon</span>
                <span className={styles.detailValue}>-Rp 0</span>
              </div>
              <div className={styles.detailTotal}>
                <span className={styles.detailLabel}>Total Pembayaran</span>
                <span className={styles.detailValue}>Rp {order.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {order.status === 'pending' && (
              <>
                <button type="button" className={styles.btnPrimary}>
                  Bayar Sekarang
                </button>
                <button
                  type="button"
                  className={styles.btnDanger}
                  onClick={handleCancelOrder}
                >
                  Batalkan Pesanan
                </button>
              </>
            )}
            {order.status === 'shipped' && (
              <button type="button" className={styles.btnPrimary}>
                Lacak Pesanan
              </button>
            )}
            {(order.status === 'delivered' || order.status === 'cancelled') && (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleBuyAgain}
              >
                Beli Lagi
              </button>
            )}
            {order.status === 'delivered' && (
              <button 
                type="button" 
                className={styles.btnSecondary}
                onClick={handleOpenReviewDialog}
              >
                {order.order_items?.[0]?.userReview ? 'Edit Ulasan' : 'Beri Ulasan'}
              </button>
            )}
            <Link href="/pesanan" className={styles.btnSecondary}>
              Kembali ke Daftar Pesanan
            </Link>
          </div>
        </div>
      </main>

      {/* Review Dialog */}
      <ReviewDialog
        isOpen={reviewDialog.isOpen}
        onClose={handleCloseReviewDialog}
        produkId={reviewDialog.produkId}
        produkName={reviewDialog.produkName}
        orderId={order?.id}
        onSuccess={handleReviewSuccess}
      />
    </>
  );
}

export default OrderDetailPage;

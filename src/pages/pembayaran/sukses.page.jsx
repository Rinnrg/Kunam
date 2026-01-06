/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import CustomHead from '@src/components/dom/CustomHead';
import styles from './sukses.module.scss';

const PAYMENT_TYPE_LABELS = {
  gopay: 'GoPay',
  shopeepay: 'ShopeePay',
  bank_transfer: 'Transfer Bank',
  credit_card: 'Kartu Kredit',
  echannel: 'Mandiri Bill',
  bca_va: 'BCA Virtual Account',
  bni_va: 'BNI Virtual Account',
  bri_va: 'BRI Virtual Account',
  permata_va: 'Permata Virtual Account',
  cstore: 'Indomaret/Alfamart',
  qris: 'QRIS',
};

function SuksesPage() {
  const { status } = useSession();
  const router = useRouter();
  const setIsAuthModalOpen = useStore(
    useShallow((state) => state.setIsAuthModalOpen)
  );

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  const fetchOrderStatus = useCallback(async (orderNumber) => {
    try {
      const res = await fetch(`/api/payment/status?orderNumber=${orderNumber}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat pesanan');
      }

      setOrder(data.order);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsAuthModalOpen(true);
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      const { order: orderNumber } = router.query;
      
      if (orderNumber) {
        fetchOrderStatus(orderNumber);
      } else {
        // Try to get from localStorage
        const lastOrder = localStorage.getItem('lastOrder');
        if (lastOrder) {
          try {
            const parsed = JSON.parse(lastOrder);
            fetchOrderStatus(parsed.orderNumber);
          } catch (e) {
            setError('Pesanan tidak ditemukan');
            setIsLoading(false);
          }
        } else {
          setError('Pesanan tidak ditemukan');
          setIsLoading(false);
        }
      }
    }
  }, [status, router, setIsAuthModalOpen, fetchOrderStatus]);

  // Enable scrolling on this page
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';

    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // SEO
  const seo = {
    title: 'Pembayaran Berhasil - Kunam',
    description: 'Terima kasih! Pembayaran Anda telah berhasil.',
  };

  if (status === 'loading' || isLoading) {
    return (
      <>
        <CustomHead {...seo} />
        <div className={styles.loading}>
          <p>Memuat...</p>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <CustomHead {...seo} />
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Terjadi Kesalahan</h2>
            <p>{error || 'Pesanan tidak ditemukan'}</p>
            <Link href="/pesanan" className={styles.primaryButton}>
              Lihat Semua Pesanan
            </Link>
          </div>
        </div>
      </>
    );
  }

  const isPaid = order.paymentStatus === 'settlement';
  const isPending = order.paymentStatus === 'pending';

  return (
    <>
      <CustomHead {...seo} />
      <div className={styles.container}>
        <div className={styles.receipt}>
          {/* Success Icon */}
          <div className={isPaid ? styles.successIcon : styles.pendingIcon}>
            {isPaid ? '✓' : '⏳'}
          </div>

          {/* Title */}
          <h1 className={styles.title}>
            {isPaid ? 'Pembayaran Berhasil!' : 'Menunggu Pembayaran'}
          </h1>
          <p className={styles.subtitle}>
            {isPaid
              ? 'Terima kasih! Pesanan Anda sedang diproses.'
              : 'Silakan selesaikan pembayaran Anda.'}
          </p>

          {/* Order Number */}
          <div className={styles.orderNumber}>
            <div className={styles.label}>Nomor Pesanan</div>
            <div className={styles.value}>{order.orderNumber}</div>
          </div>

          <div className={styles.divider} />

          {/* Customer Details */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>
              Informasi Pembeli
            </h3>
            <div className={styles.detailRow}>
              <span className={styles.label}>Nama</span>
              <span className={styles.value}>{order.customerName}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Email</span>
              <span className={styles.value}>{order.customerEmail}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Telepon</span>
              <span className={styles.value}>{order.customerPhone}</span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Order Items */}
          <div className={styles.items}>
            <h3 className={styles.sectionTitle}>
              Produk yang Dibeli
            </h3>
            {order.items?.map((item, index) => (
              <div key={`${item.produkId}-${index}`} className={styles.item}>
                <div className={styles.itemImage}>
                  {item.produk?.gambar?.[0] ? (
                    <Image
                      src={item.produk.gambar[0]}
                      alt={item.produk.nama}
                      fill
                      sizes="60px"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#ddd' }} />
                  )}
                </div>
                <div className={styles.itemDetails}>
                  <h4>{item.produk?.nama || 'Produk'}</h4>
                  <p>
                    {item.ukuran && `Ukuran: ${item.ukuran}`}
                    {item.ukuran && item.warna && ' | '}
                    {item.warna && `Warna: ${item.warna}`}
                  </p>
                  <p>Qty: {item.quantity}</p>
                </div>
                <div className={styles.itemPrice}>
                  Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className={styles.totalSection}>
            <span className={styles.totalLabel}>Total Pembayaran</span>
            <span className={styles.totalValue}>
              Rp {order.totalAmount?.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Payment Info */}
          <div className={styles.paymentInfo}>
            <h3 className={styles.sectionTitle}>
              Informasi Pembayaran
            </h3>
            <div className={styles.detailRow}>
              <span className={styles.label}>Metode</span>
              <span className={styles.value}>
                {PAYMENT_TYPE_LABELS[order.paymentType] || order.paymentType || '-'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.label}>Status</span>
              <span className={`${styles.paymentBadge} ${isPending ? styles.pending : ''}`}>
                {isPaid ? '✓ Lunas' : 'Menunggu'}
              </span>
            </div>
            {order.transactionId && (
              <div className={styles.detailRow}>
                <span className={styles.label}>ID Transaksi</span>
                <span className={styles.value}>{order.transactionId}</span>
              </div>
            )}
            {order.paidAt && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Tanggal Bayar</span>
                <span className={styles.value}>{formatDate(order.paidAt)}</span>
              </div>
            )}
          </div>

          <div className={styles.divider} />

          {/* Actions */}
          <div className={styles.actions}>
            <Link href="/pesanan" className={styles.primaryButton}>
              Lihat Pesanan Saya
            </Link>
            <Link href="/produk" className={styles.secondaryButton}>
              Lanjut Belanja
            </Link>
          </div>

          {/* Timestamp */}
          <p className={styles.timestamp}>
            Transaksi pada {formatDate(order.createdAt)}
          </p>
        </div>
      </div>
    </>
  );
}

export default SuksesPage;

/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Script from 'next/script';
import Image from 'next/image';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import CustomHead from '@src/components/dom/CustomHead';
import styles from './sukses.module.scss';

function PendingPage() {
  const { status } = useSession();
  const router = useRouter();
  const [showAlert, setIsAuthModalOpen] = useStore(
    useShallow((state) => [state.showAlert, state.setIsAuthModalOpen])
  );

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [snapReady, setSnapReady] = useState(false);

  const fetchOrderStatus = useCallback(async (orderNumber) => {
    try {
      const res = await fetch(`/api/payment/status?orderNumber=${orderNumber}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat pesanan');
      }

      setOrder(data.order);

      // If payment is successful, redirect to success page
      if (data.order.paymentStatus === 'settlement') {
        router.replace(`/pembayaran/sukses?order=${orderNumber}`);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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

  // Handle continue payment
  const handleContinuePayment = useCallback(() => {
    if (window.snap && order?.snapToken) {
      window.snap.pay(order.snapToken, {
        onSuccess: (result) => {
          console.log('Payment success:', result);
          router.push(`/pembayaran/sukses?order=${order.orderNumber}`);
        },
        onPending: (result) => {
          console.log('Payment pending:', result);
          showAlert({
            type: 'warning',
            title: 'Pembayaran Tertunda',
            message: 'Silakan selesaikan pembayaran Anda.',
          });
        },
        onError: (result) => {
          console.log('Payment error:', result);
          showAlert({
            type: 'error',
            title: 'Pembayaran Gagal',
            message: 'Terjadi kesalahan saat memproses pembayaran.',
          });
        },
        onClose: () => {
          console.log('Snap popup closed');
        },
      });
    }
  }, [order, router, showAlert]);

  // Handle cancel order
  const handleCancelOrder = useCallback(async () => {
    showAlert({
      type: 'confirm',
      title: 'Batalkan Pesanan',
      message: 'Apakah Anda yakin ingin membatalkan pesanan ini?',
      confirmText: 'Ya, Batalkan',
      showCancel: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/orders/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderNumber: order.orderNumber }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Gagal membatalkan pesanan');
          }

          showAlert({
            type: 'success',
            title: 'Pesanan Dibatalkan',
            message: 'Pesanan Anda telah dibatalkan.',
            onConfirm: () => {
              router.push('/pesanan');
            },
          });
        } catch (err) {
          console.error('Error canceling order:', err);
          showAlert({
            type: 'error',
            title: 'Terjadi Kesalahan',
            message: err.message || 'Gagal membatalkan pesanan. Silakan coba lagi.',
          });
        }
      },
    });
  }, [order, router, showAlert]);

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
    title: 'Menunggu Pembayaran - Kunam',
    description: 'Silakan selesaikan pembayaran Anda.',
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

  return (
    <>
      <CustomHead {...seo} />
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-F_0FEDIhSYS_VwxM'}
        onReady={() => setSnapReady(true)}
        strategy="lazyOnload"
      />
      
      <div className={styles.container}>
        <div className={styles.receipt}>

          {/* Order Number */}
          <div className={styles.orderNumber}>
            <div className={styles.label}>Nomor Pesanan</div>
            <div className={styles.value}>{order.orderNumber}</div>
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
              <span className={styles.icon}>💳</span>
              Status Pembayaran
            </h3>
            <div className={styles.detailRow}>
              <span className={styles.label}>Status</span>
              <span className={`${styles.paymentBadge} ${styles.pending}`}>
                ⏳ Menunggu Pembayaran
              </span>
            </div>
          </div>

          <div className={styles.divider} />

          {/* Actions */}
          <div className={styles.actions}>
            {order.snapToken && (
              <button
                type="button"
                className={styles.primaryButton}
                onClick={handleContinuePayment}
                disabled={!snapReady}
              >
                Lanjutkan Pembayaran
              </button>
            )}
            <button
              type="button"
              className={styles.dangerButton}
              onClick={handleCancelOrder}
            >
              Batalkan Pesanan
            </button>
          </div>

          {/* Timestamp */}
          <p className={styles.timestamp}>
            Pesanan dibuat pada {formatDate(order.createdAt)}
          </p>
        </div>
      </div>
    </>
  );
}

export default PendingPage;

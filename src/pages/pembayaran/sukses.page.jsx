/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import CustomHead from '@src/components/dom/CustomHead';
import LoadingSpinner from '@src/components/dom/LoadingSpinner';
import styles from './sukses.module.scss';

// Import Lottie dynamically to avoid SSR issues
const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then(mod => mod.DotLottieReact),
  { ssr: false }
);

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
  const [showAnimation1, setShowAnimation1] = useState(false);
  const [showAnimation2, setShowAnimation2] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const fetchOrderStatus = useCallback(async (orderNumber) => {
    try {
      const res = await fetch(`/api/payment/status?orderNumber=${orderNumber}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat pesanan');
      }

      setOrder(data.order);
      
      // Start animation sequence after data is loaded
      if (data.order.paymentStatus === 'settlement') {
        // Jika pembayaran berhasil, mulai sequence animasi
        setTimeout(() => {
          setIsLoading(false);
          setShowAnimation1(true);
        }, 500);
      } else {
        // Jika pending, langsung tampilkan receipt
        setIsLoading(false);
        setShowReceipt(true);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message);
      setIsLoading(false);
    } finally {
      // Remove finally setIsLoading since we handle it in the try block
    }
  }, []);

  // Animation sequence effect
  useEffect(() => {
    if (!showAnimation1) return undefined;
    
    // Show animation 1 for 3 seconds
    const timer1 = setTimeout(() => {
      setShowAnimation1(false);
      setShowAnimation2(true);
    }, 3000);

    return () => clearTimeout(timer1);
  }, [showAnimation1]);

  useEffect(() => {
    if (!showAnimation2) return undefined;
    
    // Show animation 2 for 5 seconds before showing receipt
    const timer2 = setTimeout(() => {
      setShowAnimation2(false);
      setShowReceipt(true);
    }, 5000);

    return () => clearTimeout(timer2);
  }, [showAnimation2]);

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

  // Enable scrolling on this page and during animations
  useEffect(() => {
    // Force enable scroll
    const enableScroll = () => {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
      document.documentElement.style.overflow = 'auto';
      document.body.style.position = 'relative';
      document.documentElement.style.position = 'relative';
      
      // Remove any scroll lock from other components
      const html = document.documentElement;
      html.classList.remove('scroll-lock', 'no-scroll');
      document.body.classList.remove('scroll-lock', 'no-scroll');
    };

    enableScroll();

    // Re-enable scroll after a short delay (for animation transitions)
    const timer = setTimeout(enableScroll, 100);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
      document.body.style.position = '';
      document.documentElement.style.position = '';
    };
  }, [showAnimation1, showAnimation2, showReceipt]);

  // Additional effect to force scroll when receipt shows
  useEffect(() => {
    if (showReceipt) {
      // Add class to body and html
      document.body.classList.add('receipt-page');
      document.documentElement.classList.add('receipt-page');
      
      // Extra aggressive scroll enable when showing receipt
      const forceScroll = () => {
        document.body.style.overflow = 'auto !important';
        document.body.style.height = 'auto !important';
        document.documentElement.style.overflow = 'auto !important';
        window.scrollTo(0, 0);
      };
      
      forceScroll();
      
      // Multiple checks to ensure scroll works
      const timer1 = setTimeout(forceScroll, 100);
      const timer2 = setTimeout(forceScroll, 300);
      const timer3 = setTimeout(forceScroll, 500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        document.body.classList.remove('receipt-page');
        document.documentElement.classList.remove('receipt-page');
      };
    }
  }, [showReceipt]);

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

  // Handle print receipt
  const handlePrintReceipt = useCallback(() => {
    window.print();
  }, []);

  // SEO
  const seo = {
    title: 'Pembayaran Berhasil - Kunam',
    description: 'Terima kasih! Pembayaran Anda telah berhasil.',
  };

  if (status === 'loading' || isLoading) {
    return (
      <>
        <CustomHead {...seo} />
        <LoadingSpinner fullscreen />
      </>
    );
  }

  // Show Animation 1
  if (showAnimation1) {
    return (
      <>
        <CustomHead {...seo} />
        <div className={styles.animationContainer}>
          <DotLottieReact
            src="https://lottie.host/embed/46195a4e-5424-4d18-85f0-f16e8f88e696/f3QvBSLY4H.lottie"
            loop={false}
            autoplay
            style={{ width: '300px', height: '300px' }}
          />
        </div>
      </>
    );
  }

  // Show Animation 2
  if (showAnimation2) {
    return (
      <>
        <CustomHead {...seo} />
        <div className={`${styles.animationContainer} ${styles.blackBackground}`}>
          <DotLottieReact
            src="https://lottie.host/embed/e1c883f2-fa12-45f5-8379-57109bb3cb01/IdRCZWAxwi.lottie"
            loop
            autoplay
            style={{ width: '300px', height: '300px' }}
          />
          <p className={styles.animationText}>Sedang mencetak bukti pembayaran...</p>
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

  // Don't show receipt until showReceipt is true
  if (!showReceipt) {
    return (
      <>
        <CustomHead {...seo} />
        <LoadingSpinner fullscreen />
      </>
    );
  }

  const isPaid = order.paymentStatus === 'settlement';
  const isPending = order.paymentStatus === 'pending';

  return (
    <>
      <CustomHead {...seo} />
      
      <div className={styles.pageWrapper}>
        <div className={styles.receipt}>
          {/* Success Icon with Lottie Animation */}
          <div className={isPaid ? styles.successIcon : styles.pendingIcon}>
            {isPaid ? (
              <DotLottieReact
                src="https://lottie.host/4c5ce210-69b0-41e1-a3d5-6e0d1c0e6b2a/NUQGGzjl0s.json"
                loop={false}
                autoplay
                style={{ width: '120px', height: '120px' }}
              />
            ) : (
              <DotLottieReact
                src="https://lottie.host/b5dbea15-768b-4e5e-9c4f-8f5e5b5e5b5e/5KT7T7T7T7.json"
                loop
                autoplay
                style={{ width: '120px', height: '120px' }}
              />
            )}
          </div>

          {/* Title */}
          <h1 className={styles.title}>
            {isPaid ? 'Pembayaran Berhasil!' : 'Menunggu Pembayaran'}
          </h1>
          <p className={styles.subtitle}>
            {isPaid
              ? 'Terima kasih!  Pesanan Anda sedang diproses.'
              : 'Silakan selesaikan pembayaran Anda.'}
          </p>

          {/* Order Number */}
          <div className={styles.orderNumber}>
            <div className={styles.label}>ID Pesanan</div>
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

          {/* Timestamp */}
          <p className={styles.timestamp}>
            Transaksi pada {formatDate(order.createdAt)}
          </p>

          {/* Actions - Hidden during print */}
          <div className={`${styles.actions} ${styles.noPrint}`}>
            <button 
              type="button"
              onClick={handlePrintReceipt}
              className={styles.printButton}
            >
              Cetak Bukti Pembayaran
            </button>
            <Link href="/pesanan" className={styles.outlineButton}>
              Lihat Pesanan Saya
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// Disable layout for this page (no header/footer)
SuksesPage.getLayout = (page) => page;

export default SuksesPage;

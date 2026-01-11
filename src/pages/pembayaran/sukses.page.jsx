/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useCallback, useRef } from 'react';
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
  const fetchedOrderRef = useRef(null);

  const fetchOrderStatus = useCallback(async (orderNumber, shouldAnimate = false) => {
    try {
      const res = await fetch(`/api/payment/status?orderNumber=${orderNumber}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat pesanan');
      }

      setOrder(data.order);
      // console.log('[Sukses] fetchOrderStatus', { orderNumber, paymentStatus: data.order.paymentStatus, shouldAnimate });
      
      // Start animation sequence after data is loaded
      if (data.order.paymentStatus === 'settlement') {
        // Only play the animations if we were just redirected from a payment
        if (shouldAnimate) {
          setTimeout(() => {
            setIsLoading(false);
            setShowAnimation1(true);
            // console.log('[Sukses] start animation1');
          }, 500);
        } else {
          // If not coming directly from payment, show receipt immediately
          setIsLoading(false);
          setShowReceipt(true);
          // console.log('[Sukses] show receipt immediately (no animation)');
        }
      } else {
        // Jika pending, langsung tampilkan receipt
        setIsLoading(false);
        setShowReceipt(true);
        // console.log('[Sukses] payment pending -> show receipt');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(err.message);
      setIsLoading(false);
    } finally {
      // Remove finally setIsLoading since we handle it in the try block
    }
  }, []);

  const CROSSFADE_MS = 600; // duration to overlap/fade between animations

  // Animation sequence effect
  useEffect(() => {
    if (!showAnimation1) return undefined;
    let crossTimer;
    // Show animation1, then start crossfade to animation2
    const timer1 = setTimeout(() => {
      // Start showing animation 2 (it will fade in)
      setShowAnimation2(true);
      // console.log('[Sukses] begin crossfade -> animation2 visible');

      // After a short overlap, hide animation 1 so the transition is smooth
      crossTimer = setTimeout(() => {
        setShowAnimation1(false);
        // console.log('[Sukses] hide animation1 after crossfade');
      }, CROSSFADE_MS);
    }, 3000);

    return () => {
      clearTimeout(timer1);
      if (crossTimer) clearTimeout(crossTimer);
    };
  }, [showAnimation1, router, order]);

  // Handle animation2 lifecycle and show receipt after it finishes
  useEffect(() => {
    if (!showAnimation2) return undefined;
    // console.log('[Sukses] animation2 started, will show receipt in 5s');
    // Show animation 2 for 5 seconds before showing receipt
    const timer2 = setTimeout(() => {
      // console.log('[Sukses] animation2 timeout, setting showReceipt true');
      setShowAnimation2(false);
      setShowReceipt(true);

      // Clean up the URL so we don't replay animations on refresh
      if (router.query && router.query.justPaid) {
        const orderNum = order?.orderNumber;
        if (orderNum) {
          router.replace(`/pembayaran/sukses?order=${orderNum}`, undefined, { shallow: true });
          // console.log('[Sukses] removed justPaid param after starting animation1');
        }
      }
    }, 5000);

    return () => clearTimeout(timer2);
  }, [showAnimation2, router, order]);

  // Debug: log state changes for animations
  useEffect(() => {
    console.log('[Sukses] state snapshot', {
      showAnimation1,
      showAnimation2,
      showReceipt,
      orderNumber: order?.orderNumber,
      paymentStatus: order?.paymentStatus,
    });
  }, [showAnimation1, showAnimation2, showReceipt, order?.orderNumber, order?.paymentStatus]);

  // Check authentication and fetch order status on mount
  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsAuthModalOpen(true);
      router.push('/');
      return;
    }

    if (status === 'authenticated') {
      const { order: orderNumber, justPaid } = router.query;
      const localJustPaid = typeof window !== 'undefined' && localStorage.getItem('justPaid') === '1';
      const animateFlag = (justPaid === '1' || justPaid === 'true') || localJustPaid;

      // Clear local flag immediately so refresh won't replay animation
      if (localJustPaid) {
        try { localStorage.removeItem('justPaid'); } catch (e) { /* ignore */ }
      }

      if (orderNumber) {
        if (fetchedOrderRef.current !== orderNumber) {
          fetchedOrderRef.current = orderNumber;
          fetchOrderStatus(orderNumber, animateFlag);
        }
      } else {
        // Try to get from localStorage
        const lastOrder = localStorage.getItem('lastOrder');
        if (lastOrder) {
          try {
            const parsed = JSON.parse(lastOrder);
            if (fetchedOrderRef.current !== parsed.orderNumber) {
              fetchedOrderRef.current = parsed.orderNumber;
              fetchOrderStatus(parsed.orderNumber, animateFlag);
            }
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

  // Remove justPaid query param once animation starts so refresh won't replay animations
  useEffect(() => {
    if (showAnimation1 && router.query && router.query.justPaid) {
      const orderNum = order?.orderNumber || router.query.order;
      if (orderNum) {
        router.replace(`/pembayaran/sukses?order=${orderNum}`, undefined, { shallow: true });
        // console.log('[Sukses] removed justPaid param after starting animation1');
      }
    }
  }, [showAnimation1, router, order]);

  // Ensure page-transition overlay does not block interaction during animation2 or when receipt is visible
  useEffect(() => {
    const overlayEl = document.querySelector('.page-transition-overlay');
    if (!overlayEl) return undefined;

    if (showAnimation2 || showReceipt) {
      overlayEl.style.pointerEvents = 'none';
    } else {
      overlayEl.style.pointerEvents = '';
    }

    return () => {
      overlayEl.style.pointerEvents = '';
    };
  }, [showAnimation2, showReceipt]);

  // Ensure scroll works on desktop even if other code interferes: intercept wheel and keyboard while receipt is visible
  useEffect(() => {
    if (!showReceipt) return undefined;

    const onWheel = (e) => {
      // allow scrolling manually
      try {
        e.preventDefault();
      } catch (err) {
        // ignore if passive listeners force default
      }
      window.scrollBy({ top: e.deltaY, left: 0, behavior: 'auto' });
    };

    const onKey = (e) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        const amount = e.key === 'PageDown' ? window.innerHeight * 0.9 : 100;
        window.scrollBy({ top: amount, left: 0, behavior: 'auto' });
      }
      if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        const amount = e.key === 'PageUp' ? -window.innerHeight * 0.9 : -100;
        window.scrollBy({ top: amount, left: 0, behavior: 'auto' });
      }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('wheel', onWheel, { passive: false });
      window.removeEventListener('keydown', onKey);
    };
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

  // Prepare main content depending on state (do not early-return to keep hooks order stable)
  let content = null;
  const isPaid = order?.paymentStatus === 'settlement';

  if (status === 'loading' || isLoading) {
    content = <LoadingSpinner fullscreen />;
  } else if (showAnimation1 || showAnimation2) {
    content = (
      <div className={`${styles.animationContainer} ${showAnimation2 ? styles.blackBackground : ''}`}>
        <div className={styles.animationWrap}>
          <div className={`${styles.animationLayer} ${showAnimation1 ? styles.show : ''}`}>
            <DotLottieReact
              src="https://lottie.host/46195a4e-5424-4d18-85f0-f16e8f88e696/f3QvBSLY4H.lottie"
              loop={false}
              autoplay
              style={{ width: '300px', height: '300px' }}
            />
          </div>

          <div className={`${styles.animationLayer} ${showAnimation2 ? styles.show : ''}`}>
            <DotLottieReact
              src="https://lottie.host/e1c883f2-fa12-45f5-8379-57109bb3cb01/IdRCZWAxwi.lottie"
              loop
              autoplay
              style={{ width: '300px', height: '300px' }}
            />
          </div>
        </div>

        {showAnimation2 && <p className={styles.animationText}>Sedang mencetak bukti pembayaran...</p>}
      </div>
    );
  } else if (error || !order) {
    content = (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Terjadi Kesalahan</h2>
          <p>{error || 'Pesanan tidak ditemukan'}</p>
          <Link href="/pesanan" className={styles.primaryButton}>
            Lihat Semua Pesanan
          </Link>
        </div>
      </div>
    );
  } else if (!showReceipt) {
    content = <LoadingSpinner fullscreen />;
  } else {
    // Main receipt content
    content = (
      <div className={styles.pageWrapper}>
        <div className={styles.receipt}>
          {/* Success Icon with Lottie Animation */}
          <div className={isPaid ? styles.successIcon : styles.pendingIcon}>
            {isPaid ? (
              // Use a simple check SVG in the final receipt to avoid unexpected images inside the circle
              <svg className={styles.finalCheck} viewBox="0 0 24 24" aria-hidden>
                <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            ) : (
              <DotLottieReact
                src="https://lottie.host/b5dbea15-768b-4e5e-9c4f-8f5e5b5e5b5e/5KT7T7T7T7.json"
                loop
                autoplay
                style={{ width: '120px', height: '120px' }}
              />
            )}

            {/* Fallback check icon (shows if Lottie fails or as extra fallback for pending) */}
            {!isPaid && (
              <svg className={styles.fallbackCheck} viewBox="0 0 24 24" aria-hidden>
                <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
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
                  ) : null}
                </div>

                <div className={styles.itemDetails}>
                  <h4>{item.produk?.nama}</h4>
                  <p className={styles.itemMeta}>{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</p>
                </div>

                <div className={styles.itemPrice}>Rp { (item.price * item.quantity).toLocaleString('id-ID') }</div>
              </div>
            ))}
          </div>

          <div className={styles.divider} />

          {/* Total Section */}
          <div className={styles.totalSection}>
            <span className={styles.totalLabel}>Total Pembayaran</span>
            <span className={styles.totalValue}>Rp {order.totalAmount.toLocaleString('id-ID')}</span>
          </div>

          <div className={styles.divider} />

          {/* Payment & Actions */}
          <div className={styles.paymentInfo}>
            <h3 className={styles.sectionTitle}>Informasi Pembayaran</h3>
            <div className={styles.detailRow}>
              <span className={styles.label}>Metode Pembayaran</span>
              <span className={styles.value}>{PAYMENT_TYPE_LABELS[order.paymentType] || order.paymentType || '-'}</span>
            </div>
            {order.transactionId && (
              <div className={styles.detailRow}>
                <span className={styles.label}>ID Transaksi</span>
                <span className={styles.value}>{order.transactionId}</span>
              </div>
            )}
            {order.transactionTime && (
              <div className={styles.detailRow}>
                <span className={styles.label}>Waktu Transaksi</span>
                <span className={styles.value}>{formatDate(order.transactionTime)}</span>
              </div>
            )}

            <div className={styles.actions}>
              <button className={styles.printButton} onClick={handlePrintReceipt}>Cetak bukti pesanan</button>
              <Link href="/pesanan" className={styles.outlineButton}>Kembali</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <CustomHead {...seo} />
      {content}
    </>
  );
}

// Disable layout for this page (no header/footer)
SuksesPage.getLayout = (page) => page;

export default SuksesPage;

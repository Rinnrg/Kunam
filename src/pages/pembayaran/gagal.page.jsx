/* eslint-disable react/jsx-props-no-spreading */
import { useEffect } from 'react';
import Link from 'next/link';
import CustomHead from '@src/components/dom/CustomHead';
import styles from './sukses.module.scss';

function GagalPage() {
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

  // SEO
  const seo = {
    title: 'Pembayaran Gagal - Kunam',
    description: 'Terjadi kesalahan saat memproses pembayaran.',
  };

  return (
    <>
      <CustomHead {...seo} />
      <div className={styles.container}>
        <div className={styles.receipt}>
          {/* Error Icon */}
          <div className={styles.pendingIcon} style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            ✕
          </div>

          {/* Title */}
          <h1 className={styles.title}>Pembayaran Gagal</h1>
          <p className={styles.subtitle}>
            Terjadi kesalahan saat memproses pembayaran Anda. Silakan coba lagi.
          </p>

          <div className={styles.divider} />

          {/* Actions */}
          <div className={styles.actions}>
            <Link href="/pesanan" className={styles.primaryButton}>
              Lihat Pesanan Saya
            </Link>
            <Link href="/cart" className={styles.secondaryButton}>
              Kembali ke Keranjang
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default GagalPage;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import styles from './GlobalLoader.module.scss';

function GlobalLoader() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = (url) => {
      // Check if it's a different page (not just anchor links)
      if (url !== router.asPath) {
        setLoading(true);
      }
    };

    const handleComplete = () => {
      setLoading(false);
    };

    const handleError = () => {
      setLoading(false);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className={styles.loaderOverlay}>
      <div className={styles.loaderContainer}>
        {/* Logo di tengah */}
        <div className={styles.logoWrapper}>
          <Image
            src="/logo/logo 2 black.svg"
            alt="Loading"
            width={40}
            height={40}
            priority
            className={styles.logo}
          />
        </div>
        
        {/* Spinning circle di sekeliling logo */}
        <div className={styles.spinnerCircle}>
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="35" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default GlobalLoader;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LoadingSpinner from './LoadingSpinner';
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
    <LoadingSpinner fullscreen />
  );
}

export default GlobalLoader;

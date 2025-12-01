import { useRouter } from 'next/router';
import { useEffect } from 'react';

function PrefetchLinks() {
  const router = useRouter();

  useEffect(() => {
    // Prefetch important pages
    const pagesToPrefetch = ['/', '/about', '/projects'];

    pagesToPrefetch.forEach((page) => {
      if (router.pathname !== page) {
        router.prefetch(page);
      }
    });
  }, [router]);

  return null;
}

export default PrefetchLinks;

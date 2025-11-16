import ButtonLink from '@src/components/animationComponents/buttonLink/Index';
import Image from 'next/image';
import Link from 'next/link';
import MenuButton from '@src/components/dom/navbar/components/MenuButton';
import MenuLinks from '@src/components/dom/navbar/components/MenuLinks';
import styles from '@src/components/dom/navbar/styles/index.module.scss';
import { useCallback, useEffect, useState } from 'react';
import useIsMobile from '@src/hooks/useIsMobile';
import { useRouter } from 'next/router';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

function Navbar() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [lenis] = useStore(useShallow((state) => [state.lenis]));
  const [isScrolled, setIsScrolled] = useState(false);

  const scrollToPosition = useCallback(
    (position, duration = 1.5) => {
      if (lenis) {
        lenis.scrollTo(position, {
          duration,
          force: true,
          easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
          onComplete: () => {
            lenis.start();
          },
        });
      }
    },
    [lenis],
  );

  const goToTop = useCallback(() => {
    if (router.pathname === '/') {
      scrollToPosition(0);
    }
  }, [router.pathname, scrollToPosition]);

  useEffect(() => {
    if (!lenis) return undefined;

    const handleScroll = (e) => {
      const scrollPosition = e.scroll || 0;
      setIsScrolled(scrollPosition > 100);
    };

    lenis.on('scroll', handleScroll);

    return () => {
      lenis.off('scroll', handleScroll);
    };
  }, [lenis]);

  return (
    <>
      <MenuLinks />

      <header className={`${styles.root} ${isScrolled ? styles.scrolled : ''}`} role="banner">
        <div className={styles.innerHeader}>
          <Link onClick={goToTop} aria-label="Go home" scroll={false} href="/" className={styles.logoLink}>
            <Image
              src={isScrolled ? '/logo/logo 2 black.svg' : '/logo/logo 1 black.svg'}
              alt="Kunam"
              width={isScrolled ? 60 : isMobile ? 60 : 100}
              height={isScrolled ? 60 : isMobile ? 20 : 33}
              priority
            />
          </Link>

          <div className={styles.rightContainer}>
            {!isMobile && !isScrolled && <ButtonLink href="mailto:vaggelisgiats@gmail.com" label="GET IN TOUCH" />}
            <MenuButton isScrolled={isScrolled} />
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;

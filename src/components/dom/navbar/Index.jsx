import ButtonLink from '@src/components/animationComponents/buttonLink/Index';
import Image from 'next/image';
import Link from 'next/link';
import UserNavbar from '@src/components/dom/navbar/components/UserNavbar';
import SearchDropdown from '@src/components/dom/navbar/components/SearchDropdown';
import styles from '@src/components/dom/navbar/styles/index.module.scss';
import { useCallback, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import useIsMobile from '@src/hooks/useIsMobile';
import { useRouter } from 'next/router';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import menuLinks from '@src/components/dom/navbar/constants/menuLinks';

function Navbar() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const router = useRouter();
  const [lenis] = useStore(useShallow((state) => [state.lenis]));
  const [showFloating, setShowFloating] = useState(false);
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
      const shouldShow = scrollPosition > 150;
      setShowFloating(shouldShow);
      setIsScrolled(scrollPosition > 10);
    };

    lenis.on('scroll', handleScroll);

    return () => {
      lenis.off('scroll', handleScroll);
    };
  }, [lenis]);

  const getLogoWidth = () => (isMobile ? 60 : 100);

  const getLogoHeight = () => (isMobile ? 20 : 33);

  const handleLoginClick = useCallback(() => {
    router.push('/login');
  }, [router]);

  return (
    <>
      {/* Header default yang ikut scroll (bukan sticky) */}
      <header id="default-header" className={`${styles.root} ${isScrolled ? styles.scrolled : ''}`} role="banner">
        <div className={styles.innerHeader}>
          <Link onClick={goToTop} aria-label="Go home" scroll={false} href="/" className={styles.logoLink}>
            <Image src="/logo/logo 1 black.svg" alt="Kunam" width={getLogoWidth()} height={getLogoHeight()} priority />
          </Link>

          {/* Search Bar */}
          {!isMobile && (
            <div className={styles.searchWrapper}>
              <SearchDropdown />
            </div>
          )}

          {/* Navigation Menu */}
          {!isMobile && (
            <nav className={styles.mainNav}>
              {menuLinks.filter((link) => link.title !== 'Contact').map((link) => (
                <div key={link.title} className={styles.navItem}>
                  {link.href ? (
                    <Link href={link.href} className={styles.navLink}>
                      {link.title}
                    </Link>
                  ) : (
                    <span className={styles.navLink}>{link.title}</span>
                  )}
                  {link.submenu && link.submenu.length > 0 && (
                    <div className={styles.dropdown}>
                      {link.submenu.filter((sub) => sub.href).map((sublink) => (
                        <Link
                          key={sublink.title}
                          href={sublink.href}
                          className={styles.dropdownItem}
                          target={sublink.external ? '_blank' : undefined}
                          rel={sublink.external ? 'noopener noreferrer' : undefined}
                        >
                          {sublink.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          )}

          <div className={styles.rightContainer}>
            {!isMobile && (
              session?.user ? (
                <UserNavbar />
              ) : (
                <ButtonLink onClick={handleLoginClick} label="LOGIN" />
              )
            )}
          </div>
        </div>
      </header>

      {/* Header floating yang muncul saat scroll (sticky) */}
      <header
        id="floating-header"
        className={`${styles.floatingHeader} ${showFloating ? styles.show : ''}`}
        role="banner"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10000,
          opacity: 1,
          visibility: 'visible',
          display: 'block',
          pointerEvents: showFloating ? 'all' : 'none',
          transform: showFloating ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.4s ease-out, opacity 0.4s ease-out',
          willChange: 'transform',
        }}
      >
        <div className={styles.innerHeader}>
          <Link onClick={goToTop} aria-label="Go home" scroll={false} href="/" className={styles.logoLink}>
            <Image src="/logo/logo 2 black.svg" alt="Kunam" width={60} height={20} priority />
          </Link>

          {/* Navigation Menu - Floating Header */}
          {!isMobile && (
            <nav className={styles.mainNav}>
              {menuLinks.filter((link) => link.title !== 'Contact').map((link) => (
                <div key={link.title} className={styles.navItem}>
                  {link.href ? (
                    <Link href={link.href} className={styles.navLink}>
                      {link.title}
                    </Link>
                  ) : (
                    <span className={styles.navLink}>{link.title}</span>
                  )}
                  {link.submenu && link.submenu.length > 0 && (
                    <div className={styles.dropdown}>
                      {link.submenu.filter((sub) => sub.href).map((sublink) => (
                        <Link
                          key={sublink.title}
                          href={sublink.href}
                          className={styles.dropdownItem}
                          target={sublink.external ? '_blank' : undefined}
                          rel={sublink.external ? 'noopener noreferrer' : undefined}
                        >
                          {sublink.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          )}

          <div className={styles.rightContainer}>
            {!isMobile && (
              session?.user ? (
                <UserNavbar />
              ) : (
                <ButtonLink onClick={handleLoginClick} label="LOGIN" />
              )
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;

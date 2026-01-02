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

          {/* Search Bar - Desktop */}
          {!isMobile && (
            <div className={styles.searchWrapper}>
              <SearchDropdown />
            </div>
          )}

          {/* Navigation Menu - Desktop */}
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

          {/* Right Container - Desktop & Mobile */}
          <div className={styles.rightContainer}>
            {(() => {
              // Desktop view
              if (!isMobile) {
                return session?.user ? <UserNavbar /> : <ButtonLink onClick={handleLoginClick} label="LOGIN" />;
              }
              
              // Mobile view
              if (session?.user) {
                return <UserNavbar />;
              }
              
              return (
                <button type="button" className={styles.mobileLoginButton} onClick={handleLoginClick}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              );
            })()}
          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar;

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
import { getMenuLinks } from '@src/components/dom/navbar/constants/menuLinks';

function Navbar() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const router = useRouter();
  const [lenis] = useStore(useShallow((state) => [state.lenis]));
  const [isScrolled, setIsScrolled] = useState(false);
  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [menuLinks, setMenuLinks] = useState(getMenuLinks([]));

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        if (data.success && data.categories) {
          setMenuLinks(getMenuLinks(data.categories));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

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

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (isGuestMenuOpen || isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
    } else {
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    }
    
    return () => {
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    };
  }, [isGuestMenuOpen, isMobileSearchOpen, lenis]);

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

  const getLogoWidth = () => (isMobile ? 50 : 80);

  const getLogoHeight = () => (isMobile ? 16 : 26);

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
              
              // Mobile view - Always show search, wishlist, cart
              return (
                <>
                  {/* Search Icon - Mobile */}
                  <button 
                    type="button"
                    className={styles.mobileIconButton} 
                    onClick={() => setIsMobileSearchOpen(true)}
                    aria-label="Cari"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  
                  {/* Wishlist Icon - Mobile */}
                  <Link href="/wishlist" className={styles.mobileIconButton} aria-label="Wishlist">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  
                  {/* Cart Icon - Mobile */}
                  <Link href="/cart" className={styles.mobileIconButton} aria-label="Keranjang">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 6H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  
                  {/* User/Profile - Mobile */}
                  {session?.user ? (
                    <UserNavbar />
                  ) : (
                    <>
                      <button type="button" className={styles.mobileLoginButton} onClick={handleLoginClick}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      
                      {/* Menu Button for Guest - Mobile */}
                      <button 
                        type="button" 
                        className={styles.mobileMenuButton} 
                        onClick={() => setIsGuestMenuOpen(!isGuestMenuOpen)}
                        aria-label="Menu"
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 8h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          <path d="M4 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </button>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </header>
      
      {/* Guest Mobile Menu */}
      {isMobile && !session?.user && isGuestMenuOpen && (
        <>
          <div 
            className={styles.menuOverlay} 
            onClick={() => setIsGuestMenuOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsGuestMenuOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Tutup menu"
          />
          <div className={styles.mobileMenu}>
            <div className={styles.mobileMenuHeader}>
              <h3>Menu</h3>
              <button 
                type="button" 
                className={styles.closeButton}
                onClick={() => setIsGuestMenuOpen(false)}
                aria-label="Tutup"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className={styles.mobileMenuNav}>
              {menuLinks.filter((link) => link.title !== 'Contact').map((link) => (
                <div key={link.title}>
                  {link.href ? (
                    <Link 
                      href={link.href} 
                      className={styles.mobileMenuItem} 
                      onClick={() => setIsGuestMenuOpen(false)}
                    >
                      {link.title}
                    </Link>
                  ) : (
                    <div className={styles.mobileMenuItem}>
                      {link.title}
                    </div>
                  )}
                  {link.submenu && link.submenu.length > 0 && (
                    <div className={styles.mobileSubmenu}>
                      {link.submenu.filter((sub) => sub.href).map((sublink) => (
                        <Link
                          key={sublink.title}
                          href={sublink.href}
                          className={styles.mobileSubmenuItem}
                          onClick={() => setIsGuestMenuOpen(false)}
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
          </div>
        </>
      )}

      {/* Mobile Search Bar */}
      {isMobile && isMobileSearchOpen && (
        <>
          <div 
            className={styles.searchOverlay} 
            onClick={() => setIsMobileSearchOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsMobileSearchOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Tutup pencarian"
          />
          <div className={styles.mobileSearchContainer}>
            <button 
              type="button" 
              className={styles.closeSearchButton}
              onClick={() => setIsMobileSearchOpen(false)}
              aria-label="Tutup"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className={styles.mobileSearchWrapper}>
              <SearchDropdown onClose={() => setIsMobileSearchOpen(false)} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default Navbar;

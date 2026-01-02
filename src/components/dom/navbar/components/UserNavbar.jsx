import { useCallback, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import useIsMobile from '@src/hooks/useIsMobile';
import menuLinks from '@src/components/dom/navbar/constants/menuLinks';
import styles from '@src/components/dom/navbar/styles/userNavbar.module.scss';

function UserNavbar() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  const [setIsAuthModalOpen, wishlist, cart, setWishlist, setCart, showAlert] = useStore(
    useShallow((state) => [state.setIsAuthModalOpen, state.wishlist, state.cart, state.setWishlist, state.setCart, state.showAlert]),
  );

  // Helper function to hash email for Gravatar
  const hashEmail = async (email) => {
    const normalized = email.trim().toLowerCase();
    const encoder = new TextEncoder();
    const data = encoder.encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Fetch and update profile image from user data or email
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (session?.user) {
        // Priority 1: Use image from session if available
        if (session.user.image) {
          setProfileImage(session.user.image);
          return;
        }

        // Priority 2: Fetch from API to get updated profile picture
        try {
          const response = await fetch('/api/user/profile');
          const data = await response.json();
          
          if (data.user?.image) {
            setProfileImage(data.user.image);
          } else if (session.user.email) {
            // Priority 3: Use Gravatar based on email as fallback
            const emailHash = await hashEmail(session.user.email);
            const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=mp&s=200`;
            setProfileImage(gravatarUrl);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          // Fallback to initials if everything fails
          setProfileImage(null);
        }
      }
    };

    fetchProfileImage();
  }, [session]);

  // Fetch wishlist and cart when user is logged in
  useEffect(() => {
    if (session?.user) {
      // Fetch wishlist
      fetch('/api/user/wishlist')
        .then((res) => res.json())
        .then((data) => {
          if (data.wishlist) {
            setWishlist(data.wishlist);
          }
        })
        .catch(console.error);

      // Fetch cart
      fetch('/api/user/cart')
        .then((res) => res.json())
        .then((data) => {
          if (data.cart) {
            setCart(data.cart);
          }
        })
        .catch(console.error);
    }
  }, [session, setWishlist, setCart]);

  const handleLogin = useCallback(() => {
    setIsAuthModalOpen(true);
  }, [setIsAuthModalOpen]);

  const handleLogout = useCallback(() => {
    showAlert({
      type: 'confirm',
      title: 'Keluar dari Akun',
      message: 'Apakah Anda yakin ingin keluar dari akun Anda?',
      confirmText: 'Keluar',
      showCancel: true,
      onConfirm: async () => {
        // Clear wishlist and cart before logout
        setWishlist([]);
        setCart([]);
        
        // Sign out and redirect to home
        await signOut({ callbackUrl: '/', redirect: true });
        
        // Force navigation to home page after logout
        if (typeof window !== 'undefined') {
          window.history.pushState(null, '', '/');
        }
      },
    });
  }, [showAlert, setWishlist, setCart]);

  const getInitials = useCallback((name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  if (!session?.user) {
    return (
      <div className={styles.userNavbar}>
        <button type="button" className={styles.loginButton} onClick={handleLogin}>
          LOGIN
        </button>
      </div>
    );
  }

  return (
    <div className={styles.userNavbar}>
      {/* Wishlist - Desktop Only */}
      {!isMobile && (
        <Link href="/wishlist" className={styles.iconButton} aria-label="Wishlist">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {wishlist.length > 0 && <span className={styles.badge}>{wishlist.length}</span>}
        </Link>
      )}

      {/* Cart / Bag - Desktop Only */}
      {!isMobile && (
        <Link href="/cart" className={styles.iconButton} aria-label="Keranjang">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {cart.length > 0 && <span className={styles.badge}>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
        </Link>
      )}

      {/* Profile */}
      <div className={styles.profileContainer}>
        <button type="button" className={styles.profileButton} aria-label="Profil">
          {profileImage ? (
            <Image 
              src={profileImage} 
              alt={session.user.name || 'Profile'} 
              width={32} 
              height={32}
              key={profileImage}
              onError={() => setProfileImage(null)}
            />
          ) : (
            <span className={styles.profilePlaceholder}>{getInitials(session.user.name)}</span>
          )}
        </button>
        <div className={styles.profileDropdown}>
          <div className={styles.profileHeader}>
            <p className={styles.profileName}>{session.user.name || 'User'}</p>
            <p className={styles.profileEmail}>{session.user.email}</p>
          </div>
          <Link href="/profile" className={styles.profileItem}>
            Profil Saya
          </Link>
          <Link href="/orders" className={styles.profileItem}>
            Pesanan Saya
          </Link>
          <button type="button" className={`${styles.profileItem} ${styles.logout}`} onClick={handleLogout}>
            Keluar
          </button>
        </div>
      </div>

      {/* Menu Button - Mobile Only */}
      {isMobile && (
        <button 
          type="button" 
          className={styles.menuButton} 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 8h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Mobile Menu Overlay */}
      {isMobile && isMenuOpen && (
        <>
          <div 
            className={styles.menuOverlay} 
            onClick={() => setIsMenuOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsMenuOpen(false)}
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
                onClick={() => setIsMenuOpen(false)}
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
                      onClick={() => setIsMenuOpen(false)}
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
                          onClick={() => setIsMenuOpen(false)}
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
    </div>
  );
}

export default UserNavbar;

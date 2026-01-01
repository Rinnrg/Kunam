import { useCallback, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import styles from '@src/components/dom/navbar/styles/userNavbar.module.scss';

function UserNavbar() {
  const { data: session } = useSession();

  const [setIsAuthModalOpen, wishlist, cart, setWishlist, setCart, showAlert] = useStore(
    useShallow((state) => [state.setIsAuthModalOpen, state.wishlist, state.cart, state.setWishlist, state.setCart, state.showAlert]),
  );

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
      onConfirm: () => {
        signOut({ callbackUrl: '/' });
      },
    });
  }, [showAlert]);

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
      {/* Wishlist */}
      <Link href="/wishlist" className={`${styles.iconButton} ${wishlist.length > 0 ? styles.active : ''}`} aria-label="Wishlist">
        <svg width="22" height="22" viewBox="0 0 24 24" fill={wishlist.length > 0 ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {wishlist.length > 0 && <span className={styles.badge}>{wishlist.length}</span>}
      </Link>

      {/* Cart / Bag */}
      <Link href="/cart" className={styles.iconButton} aria-label="Keranjang">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {cart.length > 0 && <span className={styles.badge}>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}
      </Link>

      {/* Profile */}
      <div className={styles.profileContainer}>
        <button type="button" className={styles.profileButton} aria-label="Profil">
          {session.user.image ? (
            <Image src={session.user.image} alt={session.user.name || 'Profile'} width={36} height={36} />
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
    </div>
  );
}

export default UserNavbar;

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import CustomHead from '@src/components/dom/CustomHead';
import styles from './cart.module.scss';

function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cart, setCart, cartTotal, setCartTotal, setIsAuthModalOpen, showAlert] = useStore(
    useShallow((state) => [state.cart, state.setCart, state.cartTotal, state.setCartTotal, state.setIsAuthModalOpen, state.showAlert]),
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsAuthModalOpen(true);
      router.push('/');
    }
  }, [status, router, setIsAuthModalOpen]);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/cart')
        .then((res) => res.json())
        .then((data) => {
          if (data.cart) {
            setCart(data.cart);
            setCartTotal(data.total || 0);
          }
        })
        .catch(console.error);
    }
  }, [session, setCart, setCartTotal]);

  const calculateTotal = useCallback((items) => {
    return items.reduce((sum, item) => {
      const price = item.produk.harga * (1 - item.produk.diskon / 100);
      return sum + price * item.quantity;
    }, 0);
  }, []);

  const handleUpdateQuantity = useCallback(
    async (cartId, newQuantity) => {
      try {
        if (newQuantity < 1) {
          await fetch('/api/user/cart', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartId }),
          });
          const newCart = cart.filter((item) => item.id !== cartId);
          setCart(newCart);
          setCartTotal(calculateTotal(newCart));
          showAlert({
            type: 'success',
            title: 'Produk Dihapus',
            message: 'Produk berhasil dihapus dari keranjang.',
          });
        } else {
          const res = await fetch('/api/user/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cartId, quantity: newQuantity }),
          });
          const data = await res.json();
          if (data.cartItem) {
            const newCart = cart.map((item) => (item.id === cartId ? data.cartItem : item));
            setCart(newCart);
            setCartTotal(calculateTotal(newCart));
          }
        }
      } catch (error) {
        console.error('Error updating cart:', error);
        showAlert({
          type: 'error',
          title: 'Terjadi Kesalahan',
          message: 'Gagal memperbarui keranjang. Silakan coba lagi.',
        });
      }
    },
    [cart, setCart, setCartTotal, calculateTotal, showAlert],
  );

  const handleRemove = useCallback(
    async (cartId) => {
      showAlert({
        type: 'confirm',
        title: 'Hapus Produk',
        message: 'Apakah Anda yakin ingin menghapus produk ini dari keranjang?',
        confirmText: 'Hapus',
        showCancel: true,
        onConfirm: async () => {
          try {
            await fetch('/api/user/cart', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ cartId }),
            });
            const newCart = cart.filter((item) => item.id !== cartId);
            setCart(newCart);
            setCartTotal(calculateTotal(newCart));
            showAlert({
              type: 'success',
              title: 'Produk Dihapus',
              message: 'Produk berhasil dihapus dari keranjang.',
            });
          } catch (error) {
            console.error('Error removing from cart:', error);
            showAlert({
              type: 'error',
              title: 'Terjadi Kesalahan',
              message: 'Gagal menghapus produk. Silakan coba lagi.',
            });
          }
        },
      });
    },
    [cart, setCart, setCartTotal, calculateTotal, showAlert],
  );

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <p>Memuat...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <CustomHead title="Keranjang - Kunam" description="Keranjang belanja Anda" />
      <main className={styles.container}>
        <div className={styles.header}>
          <button type="button" onClick={() => router.back()} className={styles.backButton} aria-label="Kembali">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1>Keranjang Saya</h1>
        </div>

        {cart.length === 0 ? (
          <div className={styles.empty}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2>Keranjang Anda kosong</h2>
            <p>Tambahkan produk ke keranjang untuk melanjutkan belanja</p>
            <Link href="/produk" className={styles.browseButton}>
              Lihat Produk
            </Link>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.items}>
              {cart.map((item) => (
                <div key={item.id} className={styles.card}>
                  <Link href={`/produk/${item.produkId}`} className={styles.imageContainer}>
                    {item.produk?.gambar && (
                      <Image
                        src={Array.isArray(item.produk.gambar) ? item.produk.gambar[0] : item.produk.gambar}
                        alt={item.produk.nama}
                        fill
                        sizes="120px"
                        className={styles.image}
                      />
                    )}
                  </Link>
                  <div className={styles.info}>
                    <Link href={`/produk/${item.produkId}`} className={styles.name}>
                      {item.produk?.nama}
                    </Link>
                    <p className={styles.kategori}>{item.produk?.kategori}</p>
                    {item.ukuran && <p className={styles.variant}>Ukuran: {item.ukuran}</p>}
                    {item.warna && <p className={styles.variant}>Warna: {item.warna}</p>}
                    <div className={styles.price}>
                      {item.produk?.diskon > 0 ? (
                        <>
                          <span className={styles.priceOriginal}>Rp {item.produk.harga.toLocaleString('id-ID')}</span>
                          <span className={styles.priceFinal}>
                            Rp {(item.produk.harga * (1 - item.produk.diskon / 100)).toLocaleString('id-ID')}
                          </span>
                        </>
                      ) : (
                        <span className={styles.priceFinal}>Rp {item.produk?.harga?.toLocaleString('id-ID')}</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.quantityControl}>
                    <button type="button" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} aria-label="Kurangi">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} aria-label="Tambah">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <button type="button" className={styles.removeButton} onClick={() => handleRemove(item.id)} aria-label="Hapus dari keranjang">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H21M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              <h3>Ringkasan Pesanan</h3>
              <div className={styles.summaryRow}>
                <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} item)</span>
                <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Ongkos Kirim</span>
                <span>-</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total</span>
                <span>Rp {cartTotal.toLocaleString('id-ID')}</span>
              </div>
              <button type="button" className={styles.checkoutButton}>
                Checkout
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

export default CartPage;

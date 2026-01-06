import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import CustomHead from '@src/components/dom/CustomHead';
import Breadcrumb from '@src/components/dom/Breadcrumb';
import styles from './wishlist.module.scss';

function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wishlist, setWishlist, showAlert] = useStore(
    useShallow((state) => [state.wishlist, state.setWishlist, state.showAlert])
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetch('/api/user/wishlist')
        .then((res) => res.json())
        .then((data) => {
          if (data.wishlist) {
            setWishlist(data.wishlist);
          }
        })
        .catch(console.error);
    }
  }, [session, setWishlist]);

  const handleRemove = useCallback(
    async (produkId) => {
      showAlert({
        type: 'confirm',
        title: 'Hapus dari Wishlist',
        message: 'Apakah Anda yakin ingin menghapus produk ini dari wishlist?',
        confirmText: 'Hapus',
        showCancel: true,
        onConfirm: async () => {
          try {
            await fetch('/api/user/wishlist', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ produkId }),
            });
            setWishlist(wishlist.filter((item) => item.produkId !== produkId));
            showAlert({
              type: 'success',
              title: 'Dihapus dari Wishlist',
              message: 'Produk berhasil dihapus dari wishlist.',
            });
          } catch (error) {
            console.error('Error removing from wishlist:', error);
            showAlert({
              type: 'error',
              title: 'Terjadi Kesalahan',
              message: 'Gagal menghapus produk. Silakan coba lagi.',
            });
          }
        },
      });
    },
    [wishlist, setWishlist, showAlert],
  );

  const handleAddToCart = useCallback(
    async (produkId) => {
      try {
        await fetch('/api/user/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ produkId, quantity: 1 }),
        });
        showAlert({
          type: 'success',
          title: 'Ditambahkan ke Keranjang',
          message: 'Produk berhasil ditambahkan ke keranjang.',
        });
        // Optionally remove from wishlist after adding to cart
      } catch (error) {
        console.error('Error adding to cart:', error);
        showAlert({
          type: 'error',
          title: 'Terjadi Kesalahan',
          message: 'Gagal menambahkan produk ke keranjang. Silakan coba lagi.',
        });
      }
    },
    [showAlert],
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
      <CustomHead title="Wishlist - Kunam" description="Produk yang Anda sukai" />
      <main className={styles.container}>
        <Breadcrumb items={[{ label: 'Wishlist', href: null }]} />
        <div className={styles.header}>
          <h1>Wishlist Saya</h1>
        </div>

        {wishlist.length === 0 ? (
          <div className={styles.empty}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2>Wishlist Anda kosong</h2>
            <p>Tambahkan produk yang Anda sukai ke wishlist</p>
            <Link href="/produk" className={styles.browseButton}>
              Lihat Produk
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {wishlist.map((item) => (
              <div key={item.id} className={styles.card}>
                <Link href={`/produk/${item.produkId}`} className={styles.imageContainer}>
                  {item.produk?.gambar && (
                    <Image
                      src={Array.isArray(item.produk.gambar) ? item.produk.gambar[0] : item.produk.gambar}
                      alt={item.produk.nama}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className={styles.image}
                    />
                  )}
                </Link>
                <div className={styles.info}>
                  <Link href={`/produk/${item.produkId}`} className={styles.name}>
                    {item.produk?.nama}
                  </Link>
                  <p className={styles.kategori}>{item.produk?.kategori}</p>
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
                <div className={styles.actions}>
                  <button type="button" className={styles.addToCart} onClick={() => handleAddToCart(item.produkId)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Tambah ke Keranjang
                  </button>
                  <button type="button" className={styles.removeButton} onClick={() => handleRemove(item.produkId)} aria-label="Hapus dari wishlist">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H21M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default WishlistPage;

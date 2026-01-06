import { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import AppearByWords from '@src/components/animationComponents/appearByWords/Index';
import ButtonLink from '@src/components/animationComponents/buttonLink/Index';
import clsx from 'clsx';
import styles from '@src/pages/components/produk/styles/produk.module.scss';

function Produk({ produk = [] }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlist, setWishlist, showAlert] = useStore(
    useShallow((state) => [state.wishlist, state.setWishlist, state.showAlert]),
  );

  // Show only 4 newest products on homepage
  const latestProduk = produk
    .sort((a, b) => new Date(b.tanggalDibuat) - new Date(a.tanggalDibuat))
    .slice(0, 4);

  // Handle wishlist toggle
  const handleWishlistToggle = useCallback(async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      showAlert({
        type: 'warning',
        title: 'Login Diperlukan',
        message: 'Anda harus login terlebih dahulu untuk menambahkan produk ke wishlist.',
        confirmText: 'Login Sekarang',
        showCancel: true,
        onConfirm: () => {
          router.push('/login');
        },
      });
      return;
    }

    const isLiked = wishlist.some((item) => item.produkId === productId);

    try {
      if (isLiked) {
        await fetch('/api/user/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ produkId: productId }),
        });
        setWishlist(wishlist.filter((item) => item.produkId !== productId));
      } else {
        const res = await fetch('/api/user/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ produkId: productId }),
        });
        const data = await res.json();
        if (data.wishlistItem) {
          setWishlist([...wishlist, data.wishlistItem]);
        }
      }
    } catch (err) {
      console.error('Error updating wishlist:', err);
      showAlert({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: 'Gagal memperbarui wishlist. Silakan coba lagi.',
      });
    }
  }, [session, wishlist, setWishlist, router, showAlert]);

  return (
    <>
      <section className={clsx(styles.titleContainer, 'layout-grid-inner')}>
        <h1 className={clsx(styles.title, 'h1')}>
          <AppearByWords>Koleksi Terbaru</AppearByWords>
        </h1>
      </section>
      <section className={clsx(styles.root, 'layout-block-inner')}>
        <div className={styles.productGrid}>
          {latestProduk.map((item) => {
            const isLiked = wishlist.some((w) => w.produkId === item.id);
            const finalPrice = item.diskon > 0
              ? item.harga * (1 - item.diskon / 100)
              : item.harga;

            return (
              <Link
                key={item.id}
                href={`/produk/${item.id}`}
                className={styles.productCard}
              >
                {/* Wishlist Button */}
                <button
                  type="button"
                  className={clsx(styles.wishlistBtn, { [styles.active]: isLiked })}
                  onClick={(e) => handleWishlistToggle(e, item.id)}
                  aria-label={isLiked ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
                >
                  {isLiked ? '♥' : '♡'}
                </button>

                {/* Discount Badge */}
                {item.diskon > 0 && (
                  <span className={styles.discountBadge}>-{item.diskon}%</span>
                )}

                {/* Image */}
                <div className={styles.imageContainer}>
                  <Image
                    src={item.gambar?.[0] || '/logo/logo 1 black.svg'}
                    alt={item.nama}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>

                {/* Content */}
                <div className={styles.cardContent}>
                  <h3 className={styles.productName}>{item.nama}</h3>
                  <div className={styles.priceContainer}>
                    <span className={styles.currentPrice}>
                      Rp {finalPrice.toLocaleString('id-ID')}
                    </span>
                    {item.diskon > 0 && (
                      <span className={styles.originalPrice}>
                        Rp {item.harga.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className={styles.buttonContainer}>
          <ButtonLink href="/produk" label="LIHAT SEMUA PRODUK" />
        </div>
      </section>
    </>
  );
}

export default Produk;

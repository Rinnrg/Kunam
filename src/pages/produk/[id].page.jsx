/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import { useMemo, useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import CustomHead from '@src/components/dom/CustomHead';
import AddToCartDialog from '@src/components/dom/AddToCartDialog';
import styles from '@src/pages/produk/produkDetail.module.scss';

function Page({ produk, error }) {
  const currentProduk = produk;
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlist, cart, setWishlist, setCart, showAlert] = useStore(
    useShallow((state) => [state.wishlist, state.cart, state.setWishlist, state.setCart, state.showAlert]),
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isLiked = useMemo(() => wishlist.some((item) => item.produkId === currentProduk?.id), [wishlist, currentProduk]);

  // Enable scrolling on this page (override global body overflow hidden)
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';

    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleLike = useCallback(async () => {
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

    try {
      if (isLiked) {
        await fetch('/api/user/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ produkId: currentProduk.id }),
        });
        setWishlist(wishlist.filter((item) => item.produkId !== currentProduk.id));
        showAlert({
          type: 'success',
          title: 'Dihapus dari Wishlist',
          message: 'Produk berhasil dihapus dari wishlist Anda.',
        });
      } else {
        const res = await fetch('/api/user/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ produkId: currentProduk.id }),
        });
        const data = await res.json();
        if (data.wishlistItem) {
          setWishlist([...wishlist, data.wishlistItem]);
          showAlert({
            type: 'success',
            title: 'Ditambahkan ke Wishlist',
            message: 'Produk berhasil ditambahkan ke wishlist Anda.',
          });
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating wishlist:', error);
      showAlert({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: 'Gagal memperbarui wishlist. Silakan coba lagi.',
      });
    }
  }, [session, isLiked, currentProduk, wishlist, setWishlist, router, showAlert]);

  const handleAddToCart = useCallback(async () => {
    if (!session?.user) {
      showAlert({
        type: 'warning',
        title: 'Login Diperlukan',
        message: 'Anda harus login terlebih dahulu untuk menambahkan produk ke keranjang.',
        confirmText: 'Login Sekarang',
        showCancel: true,
        onConfirm: () => {
          router.push('/login');
        },
      });
      return;
    }

    // Open dialog instead of directly adding to cart
    setIsDialogOpen(true);
  }, [session, router, showAlert]);

  const handleConfirmAddToCart = useCallback(
    async (cartData) => {
      try {
        const res = await fetch('/api/user/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cartData),
        });
        const data = await res.json();
        if (data.cartItem) {
          const existingIndex = cart.findIndex((item) => item.produkId === currentProduk.id && item.ukuran === cartData.ukuran && item.warna === cartData.warna);
          if (existingIndex >= 0) {
            const newCart = [...cart];
            newCart[existingIndex] = data.cartItem;
            setCart(newCart);
          } else {
            setCart([...cart, data.cartItem]);
          }
          showAlert({
            type: 'success',
            title: 'Ditambahkan ke Keranjang',
            message: 'Produk berhasil ditambahkan ke keranjang Anda.',
          });
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error adding to cart:', error);
        showAlert({
          type: 'error',
          title: 'Terjadi Kesalahan',
          message: 'Gagal menambahkan produk ke keranjang. Silakan coba lagi.',
        });
      }
    },
    [currentProduk, cart, setCart, showAlert],
  );

  const handleBuy = useCallback(async () => {
    if (!session?.user) {
      showAlert({
        type: 'warning',
        title: 'Login Diperlukan',
        message: 'Anda harus login terlebih dahulu untuk membeli produk.',
        confirmText: 'Login Sekarang',
        showCancel: true,
        onConfirm: () => {
          router.push('/login');
        },
      });
      return;
    }

    // Logic untuk membeli langsung - bisa redirect ke checkout atau proses lainnya
    showAlert({
      type: 'info',
      title: 'Fitur Beli',
      message: 'Fitur pembelian langsung akan segera hadir!',
    });
  }, [session, router, showAlert]);

  const seo = useMemo(
    () => ({
      title: currentProduk ? `Kunam - ${currentProduk.nama}` : 'Kunam - Produk Tidak Ditemukan',
      description: currentProduk
        ? `${currentProduk.nama} - ${currentProduk.kategori}. ${currentProduk.deskripsi || 'Produk clothing berkualitas dari Kunam.'} Harga: Rp ${currentProduk.harga.toLocaleString('id-ID')}`
        : 'Produk tidak ditemukan',
      keywords: currentProduk
        ? [
            `${currentProduk.nama}`,
            `${currentProduk.kategori}`,
            `Kunam ${currentProduk.kategori}`,
            `Beli ${currentProduk.nama}`,
            `${currentProduk.kategori} Online`,
            'Kunam Clothing',
            'Fashion Indonesia',
          ]
        : [],
    }),
    [currentProduk],
  );

  // Show error message if failed to load
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--black)' }}>Gagal Memuat Produk</h2>
        <p style={{ marginBottom: '1.5rem', color: 'rgba(0, 0, 0, 0.6)' }}>{error}</p>
        <button 
          type="button"
          onClick={() => router.back()} 
          style={{ 
            padding: '0.75rem 1.5rem', 
            background: 'var(--black)', 
            color: 'var(--white)', 
            border: 'none', 
            borderRadius: '0.5rem',
            cursor: 'pointer'
          }}
        >
          Kembali
        </button>
      </div>
    );
  }

  if (!currentProduk) {
    return <div>Produk tidak ditemukan</div>;
  }

  return (
    <>
      <CustomHead {...seo} />
      <main className={styles.container}>
        {/* Header with Back Button and Title */}
        <div className={styles.headerSection}>
          <button type="button" onClick={() => window.history.back()} className={styles.backButton} aria-label="Kembali">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className={styles.projectTitle}>{currentProduk.nama}</h1>
        </div>

        {/* Hero Product Images */}
        <div className={styles.heroMockup}>
          <div className={styles.mockupContainer}>
            {currentProduk.gambar && (
              <Image src={Array.isArray(currentProduk.gambar) ? currentProduk.gambar[0] : currentProduk.gambar} alt={currentProduk.nama} fill priority className={styles.mockupImage} />
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className={styles.contentWrapper}>
          <div className={styles.contentInner}>
            {/* Product Info */}
            <div className={styles.descriptionSection}>
              <h2 className={styles.descriptionTitle}>
                {currentProduk.nama} - {currentProduk.kategori}
              </h2>
              <div className={styles.priceSection}>
                <div className={styles.priceWrapper}>
                  {currentProduk.diskon > 0 ? (
                    <>
                      <p className={styles.priceOriginal}>Rp {currentProduk.harga.toLocaleString('id-ID')}</p>
                      <p className={styles.price}>Rp {(currentProduk.harga * (1 - currentProduk.diskon / 100)).toLocaleString('id-ID')}</p>
                      <span className={styles.discountBadge}>{currentProduk.diskon}% OFF</span>
                    </>
                  ) : (
                    <p className={styles.price}>Rp {currentProduk.harga.toLocaleString('id-ID')}</p>
                  )}
                </div>
                <div className={styles.stockWrapper}>
                  <p className={styles.stock}>Stok: {currentProduk.stok}</p>
                  <button type="button" className={clsx(styles.wishlistIcon, isLiked && styles.liked)} onClick={handleLike} aria-label={isLiked ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Jumlah Terjual Badge */}
              {currentProduk?.jumlahTerjual && currentProduk.jumlahTerjual > 0 && (
                <div className={styles.soldBadge}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M20 12V22H4V12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M22 7H2V12H22V7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 22V7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>{currentProduk.jumlahTerjual.toLocaleString('id-ID')} Terjual</span>
                </div>
              )}
              
              {currentProduk.deskripsi && (
                <div className={styles.descriptionWrapper}>
                  <h3 className={styles.descriptionLabel}>Deskripsi Produk</h3>
                  <p className={styles.description}>{currentProduk.deskripsi}</p>
                </div>
              )}

              {currentProduk.ukuran && currentProduk.ukuran.length > 0 && (
                <div className={styles.sizeSection}>
                  <p className={styles.label}>Ukuran tersedia:</p>
                  <div className={styles.sizes}>
                    {currentProduk.ukuran.map((size) => (
                      <span key={size} className={styles.sizeTag}>
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentProduk.warna && currentProduk.warna.length > 0 && (
                <div className={styles.colorSection}>
                  <p className={styles.label}>Warna tersedia:</p>
                  <div className={styles.colors}>
                    {currentProduk.warna.map((color) => (
                      <span key={color} className={styles.colorTag}>
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Section */}
            <div className={styles.bottomSection}>
              <div className={styles.categoryTag}>
                <span className={styles.categoryLabel}>{currentProduk.kategori}</span>
                <p className={styles.categoryInfo}>Kunam Clothing - Premium Quality</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtonsContainer}>
              <button type="button" className={clsx(styles.actionBtn, styles.cartBtn)} onClick={handleAddToCart}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path
                    d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                TAMBAH KE KERANJANG
              </button>
              <button type="button" className={clsx(styles.actionBtn, styles.buyBtn)} onClick={handleBuy}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                BELI SEKARANG
              </button>
            </div>
          </div>
        </div>

        {/* Add to Cart Dialog */}
        <AddToCartDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} produk={currentProduk} onConfirm={handleConfirmAddToCart} />
      </main>
    </>
  );
}

export async function getServerSideProps(context) {
  const { params } = context;

  // Import prisma hanya di server side
  const prisma = (await import('../../lib/prisma')).default;

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timeout')), 10000); // 10 second timeout
    });

    const queryPromise = prisma.produk.findUnique({
      where: { id: params.id },
    });

    const produk = await Promise.race([queryPromise, timeoutPromise]);

    if (!produk) {
      return { notFound: true };
    }

    return {
      props: {
        produk: JSON.parse(JSON.stringify(produk)),
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error in getServerSideProps:', error.message || error);
    
    // Return error page instead of 404
    return {
      props: {
        error: 'Failed to load product. Please try again.',
        produk: null,
      },
    };
  }
}

export default Page;

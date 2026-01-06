/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import { useMemo, useEffect, useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import CustomHead from '@src/components/dom/CustomHead';
import Breadcrumb from '@src/components/dom/Breadcrumb';
import styles from '@src/pages/produk/produkDetail.module.scss';
import prisma from '@src/lib/db';

function ProdukDetailPage({ produk, error }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlist, cart, setWishlist, setCart, showAlert] = useStore(
    useShallow((state) => [state.wishlist, state.cart, state.setWishlist, state.setCart, state.showAlert]),
  );

  // State management
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    features: true,
    care: true,
    shipping: true,
  });

  const currentProduk = produk;
  const isLiked = useMemo(() => wishlist.some((item) => item.produkId === currentProduk?.id), [wishlist, currentProduk]);

  // Enable scrolling on this page
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

  // Set default size and color
  useEffect(() => {
    if (currentProduk) {
      if (currentProduk.ukuran?.length > 0 && !selectedSize) {
        // Always clean the first size - remove stock number if present
        const firstSize = currentProduk.ukuran[0];
        const cleanSize = firstSize.includes(':') ? firstSize.split(':')[0] : firstSize;
        setSelectedSize(cleanSize);
      }
      if (currentProduk.warna?.length > 0 && !selectedColor) {
        setSelectedColor(currentProduk.warna[0]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduk]);

  // Image gallery - combine all images
  const allImages = useMemo(() => {
    if (!currentProduk?.gambar) return [];
    return Array.isArray(currentProduk.gambar) ? currentProduk.gambar : [currentProduk.gambar];
  }, [currentProduk]);

  // Calculate final price
  const finalPrice = useMemo(() => {
    if (!currentProduk) return 0;
    return currentProduk.diskon > 0
      ? currentProduk.harga * (1 - currentProduk.diskon / 100)
      : currentProduk.harga;
  }, [currentProduk]);

  // Stock status
  const stockStatus = useMemo(() => {
    if (!currentProduk) return 'out';
    if (currentProduk.stok === 0) return 'out';
    if (currentProduk.stok <= 5) return 'low';
    return 'available';
  }, [currentProduk]);

  // Handlers
  const handleQuantityChange = useCallback((delta) => {
    setQuantity((prev) => {
      const newQty = prev + delta;
      return Math.max(1, Math.min(newQty, currentProduk?.stok || 1));
    });
  }, [currentProduk]);

  const toggleSection = useCallback((section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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
    } catch (err) {
      console.error('Error updating wishlist:', err);
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

    if (!selectedSize || !selectedColor) {
      showAlert({
        type: 'warning',
        title: 'Pilihan Belum Lengkap',
        message: 'Mohon pilih ukuran dan warna terlebih dahulu.',
      });
      return;
    }

    // Proceed to add to cart (API will handle duplicates by updating quantity)
    await addToCartAction();
  }, [session, currentProduk, quantity, selectedSize, selectedColor, cart, setCart, router, showAlert]);

  const addToCartAction = useCallback(async () => {
    try {
      const res = await fetch('/api/user/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produkId: currentProduk.id,
          quantity,
          ukuran: selectedSize,
          warna: selectedColor,
        }),
      });
      const data = await res.json();
      if (data.cartItem) {
        const existingIndex = cart.findIndex(
          (item) => item.produkId === currentProduk.id && item.ukuran === selectedSize && item.warna === selectedColor
        );
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
    } catch (err) {
      console.error('Error adding to cart:', err);
      showAlert({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: 'Gagal menambahkan produk ke keranjang. Silakan coba lagi.',
      });
    }
  }, [currentProduk, quantity, selectedSize, selectedColor, cart, setCart, showAlert]);

  const handleBuyNow = useCallback(async () => {
    await handleAddToCart();
    router.push('/cart');
  }, [handleAddToCart, router]);

  // SEO
  const seo = useMemo(
    () => ({
      title: `${currentProduk?.nama || 'Produk'} - Kunam`,
      description: currentProduk?.deskripsi || `Beli ${currentProduk?.nama} di Kunam`,
      keywords: [currentProduk?.nama, currentProduk?.kategori, 'Kunam', 'Fashion', 'Clothing'],
      image: allImages[0] || '/logo/logo 1 black.svg',
    }),
    [currentProduk, allImages]
  );

  if (error || !currentProduk) {
    return (
      <>
        <CustomHead {...seo} />
        <div className={styles.root}>
          <div className={styles.container}>
            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
              <h1>Produk tidak ditemukan</h1>
              <p>{error || 'Produk yang Anda cari tidak tersedia.'}</p>
              <Link href="/produk">
                <button type="button" style={{ marginTop: '1rem', padding: '0.75rem 2rem' }}>
                  Kembali ke Produk
                </button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomHead {...seo} />
      <div className={styles.root}>
        <div className={styles.container}>
          {/* Breadcrumb */}
          <Breadcrumb items={[
            { label: 'Produk', href: '/produk' },
            { label: currentProduk.kategori, href: `/produk?kategori=${currentProduk.kategori}` },
            { label: currentProduk.nama, href: null }
          ]} />

          {/* Main Product Layout */}
          <div className={styles.productLayout}>
            {/* Left Column: Image Gallery + Product Details */}
            <div className={styles.leftColumn}>
              {/* Image Gallery */}
              <div className={styles.imageGallery}>
                {/* Main Image */}
                <div className={styles.mainImage}>
                  <Image
                    src={allImages[selectedImageIndex] || allImages[0]}
                    alt={currentProduk.nama}
                    fill
                    priority
                    quality={90}
                    sizes="(max-width: 768px) 100vw, 60vw"
                  />
                </div>

                {/* Thumbnail Grid */}
                {allImages.length > 1 && (
                  <div className={styles.thumbnailGrid}>
                    {allImages.map((img, index) => (
                      <div
                        key={index}
                        className={clsx(styles.thumbnail, { [styles.active]: index === selectedImageIndex })}
                        onClick={() => setSelectedImageIndex(index)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelectedImageIndex(index);
                        }}
                      >
                        <Image src={img} alt={`${currentProduk.nama} ${index + 1}`} fill sizes="150px" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className={styles.productDetails}>
                {/* Description */}
                <div className={styles.detailSection}>
                  {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                  <div className={styles.detailHeader} onClick={() => toggleSection('description')}>
                    <h3>Deskripsi Produk</h3>
                    <span className={clsx(styles.toggleIcon, { [styles.expanded]: expandedSections.description })}>
                      ▼
                    </span>
                  </div>
                  <div className={clsx(styles.detailContent, { [styles.expanded]: expandedSections.description })}>
                    <p>{currentProduk.deskripsi || 'Tidak ada deskripsi tersedia.'}</p>
                  </div>
                </div>

                {/* Features */}
                <div className={styles.detailSection}>
                  {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                  <div className={styles.detailHeader} onClick={() => toggleSection('features')}>
                    <h3>Fitur & Material</h3>
                    <span className={clsx(styles.toggleIcon, { [styles.expanded]: expandedSections.features })}>
                      ▼
                    </span>
                  </div>
                  <div className={clsx(styles.detailContent, { [styles.expanded]: expandedSections.features })}>
                    <ul>
                      <li>Bahan berkualitas tinggi</li>
                      <li>Nyaman dipakai</li>
                      <li>Desain modern dan stylish</li>
                    </ul>
                  </div>
                </div>

                {/* Care Instructions */}
                <div className={styles.detailSection}>
                  {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                  <div className={styles.detailHeader} onClick={() => toggleSection('care')}>
                    <h3>Cara Perawatan</h3>
                    <span className={clsx(styles.toggleIcon, { [styles.expanded]: expandedSections.care })}>
                      ▼
                    </span>
                  </div>
                  <div className={clsx(styles.detailContent, { [styles.expanded]: expandedSections.care })}>
                    <ul>
                      <li>Cuci dengan mesin air dingin</li>
                      <li>Jangan gunakan pemutih</li>
                      <li>Keringkan dengan suhu rendah</li>
                      <li>Setrika dengan suhu sedang</li>
                    </ul>
                  </div>
                </div>

                {/* Shipping & Returns */}
                <div className={styles.detailSection}>
                  {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
                  <div className={styles.detailHeader} onClick={() => toggleSection('shipping')}>
                    <h3>Pengiriman & Pengembalian</h3>
                    <span className={clsx(styles.toggleIcon, { [styles.expanded]: expandedSections.shipping })}>
                      ▼
                    </span>
                  </div>
                  <div className={clsx(styles.detailContent, { [styles.expanded]: expandedSections.shipping })}>
                    <p>Gratis ongkir untuk pembelian di atas Rp 500.000</p>
                    <p>Pengembalian gratis dalam 30 hari</p>
                    <p>Garansi uang kembali jika produk tidak sesuai</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Product Info (Sticky) */}
            <div className={styles.productInfo}>
              {/* Product Name */}
              <div className={styles.productHeader}>
                <h1 className={styles.productName}>{currentProduk.nama}</h1>
              </div>

              {/* Color Selector */}
              {currentProduk.warna && currentProduk.warna.length > 0 && (
                <div className={styles.colorSection}>
                  <div className={styles.sectionLabel}>
                    Warna: <span>{selectedColor}</span>
                  </div>
                  <div className={styles.colorGrid}>
                    {currentProduk.warna.map((color) => (
                      <div
                        key={color}
                        className={clsx(styles.colorOption, { [styles.selected]: selectedColor === color })}
                        onClick={() => setSelectedColor(color)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setSelectedColor(color);
                        }}
                        title={color}
                      >
                        <div
                          className={styles.colorSwatch}
                          style={{
                            backgroundColor: color.toLowerCase(),
                            border: ['white', 'putih', '#fff', '#ffffff'].includes(color.toLowerCase())
                              ? '1px solid #e0e0e0'
                              : 'none',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {currentProduk.ukuran && currentProduk.ukuran.length > 0 && (
                <div className={styles.sizeSection}>
                  <div className={styles.sectionLabel}>
                    Ukuran: <span>{selectedSize}</span>
                  </div>
                  <div className={styles.sizeGrid}>
                    {currentProduk.ukuran.map((size) => {
                      const sizeLabel = size.includes(':') ? size.split(':')[0] : size;
                      return (
                        <button
                          key={size}
                          type="button"
                          className={clsx(styles.sizeOption, { [styles.selected]: selectedSize === sizeLabel })}
                          onClick={() => setSelectedSize(sizeLabel)}
                        >
                          {sizeLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price Section - Moved after size */}
              <div className={styles.priceSection}>
                {currentProduk.diskon > 0 && (
                  <div className={styles.originalPriceContainer}>
                    <span className={styles.originalPrice}>
                      Rp {currentProduk.harga.toLocaleString('id-ID')}
                    </span>
                    <span className={styles.discountBadge}>-{currentProduk.diskon}%</span>
                  </div>
                )}
                <div className={styles.priceContainer}>
                  <span className={styles.currentPrice}>
                    Rp {finalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className={styles.rating}>
                  ★★★★★ <span>4.8</span> (197)
                </div>
              </div>

              {/* Stock Info - Only show if low stock or out of stock */}
              {(stockStatus === 'low' || stockStatus === 'out') && (
                <div className={clsx(styles.stockInfo, {
                  [styles.lowStock]: stockStatus === 'low',
                  [styles.outOfStock]: stockStatus === 'out',
                })}>
                  {stockStatus === 'out' && 'Stok habis'}
                  {stockStatus === 'low' && `Hanya tersisa ${currentProduk.stok} item`}
                </div>
              )}

              {/* Quantity & Buy Button Row */}
              <div className={styles.quantityBuyRow}>
                <div className={styles.quantityControl}>
                  <button
                    type="button"
                    className={styles.quantityButton}
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className={styles.quantityValue}>{quantity}</span>
                  <button
                    type="button"
                    className={styles.quantityButton}
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= currentProduk.stok}
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.buyNowButton}
                  onClick={handleBuyNow}
                  disabled={stockStatus === 'out'}
                >
                  Beli Sekarang
                </button>
              </div>

              {/* Wishlist + Add to Cart Row */}
              <div className={styles.cartWishlistRow}>
                <button
                  type="button"
                  className={clsx(styles.wishlistButton, { [styles.active]: isLiked })}
                  onClick={handleLike}
                  aria-label={isLiked ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isLiked ? '♥' : '♡'}
                </button>
                <button
                  type="button"
                  className={styles.addToCartButton}
                  onClick={handleAddToCart}
                  disabled={stockStatus === 'out'}
                >
                  ADD TO CART
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    const produk = await prisma.produk.findUnique({
      where: { id },
    });

    if (!produk) {
      return {
        props: {
          produk: null,
          error: 'Produk tidak ditemukan',
        },
      };
    }

    const serializedProduk = {
      ...produk,
      tanggalDibuat: produk.tanggalDibuat.toISOString(),
      tanggalDiubah: produk.tanggalDiubah.toISOString(),
    };

    return {
      props: {
        produk: serializedProduk,
        error: null,
      },
    };
  } catch (error) {
    console.error('[Product Detail] Error:', error);
    return {
      props: {
        produk: null,
        error: 'Terjadi kesalahan saat memuat produk',
      },
    };
  }
}

export default ProdukDetailPage;

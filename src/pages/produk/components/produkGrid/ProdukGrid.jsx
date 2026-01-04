import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import { useRouter } from 'next/router';
import ProdukSidebar from '../produkSidebar/ProdukSidebar';
import styles from './styles/produkGrid.module.scss';

function ProdukGrid({ produk = [], kategori = null }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlist, cart, setWishlist, setCart, setIsAuthModalOpen] = useStore(
    useShallow((state) => [state.wishlist, state.cart, state.setWishlist, state.setCart, state.setIsAuthModalOpen]),
  );
  
  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    categories: [],
    colors: [],
    discount: '',
    priceMin: '',
    priceMax: '',
  });

  // Apply filters to products
  const filteredProduk = useMemo(() => {
    let result = [...produk];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter((item) =>
        item.nama.toLowerCase().includes(searchLower) ||
        item.kategori?.toLowerCase().includes(searchLower) ||
        item.deskripsi?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter((item) => filters.categories.includes(item.kategori));
    }

    // Color filter
    if (filters.colors.length > 0) {
      result = result.filter((item) =>
        item.warna && item.warna.some((color) => filters.colors.includes(color))
      );
    }

    // Discount filter
    if (filters.discount) {
      const minDiscount = parseInt(filters.discount, 10);
      result = result.filter((item) => item.diskon >= minDiscount);
    }

    // Price filter
    if (filters.priceMin) {
      const min = parseFloat(filters.priceMin);
      result = result.filter((item) => {
        const finalPrice = item.diskon > 0 ? item.harga * (1 - item.diskon / 100) : item.harga;
        return finalPrice >= min;
      });
    }
    if (filters.priceMax) {
      const max = parseFloat(filters.priceMax);
      result = result.filter((item) => {
        const finalPrice = item.diskon > 0 ? item.harga * (1 - item.diskon / 100) : item.harga;
        return finalPrice <= max;
      });
    }

    return result;
  }, [produk, filters]);

  // Handle filter change from sidebar
  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Initialize filters from URL
  useMemo(() => {
    const { search, kategori: urlKategori, diskon } = router.query;
    if (search || urlKategori || diskon) {
      setFilters((prev) => ({
        ...prev,
        search: search || '',
        categories: urlKategori ? [urlKategori] : [],
        discount: diskon || '',
      }));
    }
  }, [router.query]);

  const wishlistIds = useMemo(() => new Set(wishlist.map((item) => item.produkId)), [wishlist]);
  // eslint-disable-next-line no-unused-vars
  const cartIds = useMemo(() => new Set(cart.map((item) => item.produkId)), [cart]);

  const handleLike = useCallback(
    async (e, produkId) => {
      e.preventDefault();
      e.stopPropagation();

      if (!session?.user) {
        setIsAuthModalOpen(true);
        return;
      }

      const isLiked = wishlistIds.has(produkId);

      try {
        if (isLiked) {
          await fetch('/api/user/wishlist', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produkId }),
          });
          setWishlist(wishlist.filter((item) => item.produkId !== produkId));
        } else {
          const res = await fetch('/api/user/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produkId }),
          });
          const data = await res.json();
          if (data.wishlistItem) {
            setWishlist([...wishlist, data.wishlistItem]);
          }
        }
      } catch (error) {
        // Silently handle error to avoid console spam
      }
    },
    [session, wishlist, wishlistIds, setWishlist, setIsAuthModalOpen],
  );

  const handleAddToCart = useCallback(
    async (e, produkId) => {
      e.preventDefault();
      e.stopPropagation();

      if (!session?.user) {
        setIsAuthModalOpen(true);
        return;
      }

      try {
        const res = await fetch('/api/user/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ produkId, quantity: 1 }),
        });
        const data = await res.json();
        if (data.cartItem) {
          const existingIndex = cart.findIndex((item) => item.produkId === produkId);
          if (existingIndex >= 0) {
            const newCart = [...cart];
            newCart[existingIndex] = data.cartItem;
            setCart(newCart);
          } else {
            setCart([...cart, data.cartItem]);
          }
        }
      } catch (error) {
        // Silently handle error to avoid console spam
      }
    },
    [session, cart, setCart, setIsAuthModalOpen],
  );

  if (!produk || produk.length === 0) {
    return (
      <section className={styles.root}>
        <div className={styles.pageContainer}>
          <ProdukSidebar produkList={produk} onFilterChange={handleFilterChange} />
          <div className={styles.mainContent}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{kategori ? `${kategori}` : 'Semua Produk'}</h1>
              <p style={{ fontSize: '1.2rem', color: '#666' }}>{kategori ? `Belum ada produk ${kategori} tersedia.` : 'Belum ada produk tersedia.'}</p>
              {kategori && (
                <Link href="/produk" style={{ marginTop: '1rem', display: 'inline-block', color: '#000', textDecoration: 'underline' }}>
                  Lihat semua produk
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Get search term from URL for breadcrumb display
  const searchTerm = router.query.search || filters.search;
  // eslint-disable-next-line no-nested-ternary
  const displayTitle = searchTerm ? `Pencarian untuk "${searchTerm}"` : kategori || 'Semua Produk';

  return (
    <section className={styles.root}>
      <div className={styles.pageContainer}>
        {/* Left Sidebar */}
        <ProdukSidebar produkList={produk} onFilterChange={handleFilterChange} />
        
        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Breadcrumb & Results Count */}
          <div className={styles.pageHeader}>
            <div className={styles.breadcrumb}>
              <Link href="/">Home</Link>
              <span className={styles.separator}>&gt;</span>
              <Link href="/produk">Produk</Link>
              {(kategori || searchTerm) && (
                <>
                  <span className={styles.separator}>&gt;</span>
                  <span className={styles.current}>{displayTitle}</span>
                </>
              )}
            </div>
            <div className={styles.resultsInfo}>
              <h1 className={styles.resultsTitle}>{displayTitle}</h1>
              <span className={styles.resultsCount}>{filteredProduk.length} Barang ditemukan</span>
            </div>
          </div>

          {/* Product Grid */}
          <div className={styles.gridContainer}>
            {filteredProduk.map((item) => (
          <Link key={item.id} href={`/produk/${item.id}`} className={styles.projectCard} scroll={false} aria-label={`View ${item.nama}`}>
            <div className={styles.cardHeader}>
              <h2 className={clsx(styles.projectTitle, 'h2')}>{item.nama}</h2>
            </div>

            <div className={styles.imageContainer}>
              {item.gambar && <Image src={Array.isArray(item.gambar) ? item.gambar[0] : item.gambar} alt={item.nama} fill sizes="(max-width: 768px) 100vw, 50vw" className={styles.projectImage} />}
              
              {/* Discount Badge */}
              {item.diskon > 0 && (
                <div className={styles.discountBadge}>
                  -{item.diskon}%
                </div>
              )}
              
              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  className={clsx(styles.actionButton, wishlistIds.has(item.id) && styles.liked)}
                  onClick={(e) => handleLike(e, item.id)}
                  aria-label={wishlistIds.has(item.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlistIds.has(item.id) ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.produkInfo}>
                <div className={styles.labelContainer}>
                  <span className={styles.kategoriLabel}>{item.kategori}</span>
                  {item.jumlahTerjual && item.jumlahTerjual > 0 && (
                    <span className={styles.terjualLabel}>
                      {item.jumlahTerjual.toLocaleString('id-ID')} Terjual
                    </span>
                  )}
                </div>
                <div className={styles.produkHeader}>
                  <h3 className={styles.produkNama}>{item.nama}</h3>
                  <button
                    type="button"
                    className={clsx(styles.wishlistIcon, wishlistIds.has(item.id) && styles.liked)}
                    onClick={(e) => handleLike(e, item.id)}
                    aria-label={wishlistIds.has(item.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlistIds.has(item.id) ? 'currentColor' : 'none'} xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
                <div className={styles.priceContainer}>
                  {item.diskon > 0 ? (
                    <>
                      <span className={styles.harga}>Rp {(item.harga * (1 - item.diskon / 100)).toLocaleString('id-ID')}</span>
                      <span className={styles.hargaAsli}>Rp {item.harga.toLocaleString('id-ID')}</span>
                    </>
                  ) : (
                    <span className={styles.harga}>Rp {item.harga.toLocaleString('id-ID')}</span>
                  )}
                </div>
              </div>
              <button type="button" className={styles.viewButton} onClick={(e) => handleAddToCart(e, item.id)}>
                <span>Masukkan ke Tas</span>
              </button>
            </div>
          </Link>
        ))}
          </div>

          {/* No results in filtered */}
          {filteredProduk.length === 0 && produk.length > 0 && (
            <div className={styles.noResults}>
              <p>Tidak ada produk yang sesuai dengan filter.</p>
              <button
                type="button"
                className={styles.resetButton}
                onClick={() => setFilters({
                  search: '',
                  categories: [],
                  colors: [],
                  discount: '',
                  priceMin: '',
                  priceMax: '',
                })}
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProdukGrid;

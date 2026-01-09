/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import Breadcrumb from '@src/components/dom/Breadcrumb';
import styles from './ProdukGrid.module.scss';

function ProdukGrid({ produk = [], kategori = null, error = null }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [wishlist, setWishlist, showAlert] = useStore(
    useShallow((state) => [state.wishlist, state.setWishlist, state.showAlert]),
  );

  // Filter and sort state
  const [sortBy, setSortBy] = useState('newest');
  const [filterKategori, setFilterKategori] = useState(kategori || '');
  // eslint-disable-next-line no-unused-vars
  const [priceRange, setPriceRange] = useState({ min: 0, max: Infinity });

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(produk.map((p) => p.kategori))];
    return cats.filter(Boolean);
  }, [produk]);

  // Filter and sort products
  const filteredProduk = useMemo(() => {
    let result = [...produk];

    // Filter by category
    if (filterKategori) {
      result = result.filter((p) => p.kategori === filterKategori);
    }

    // Filter by price range
    result = result.filter((p) => {
      const price = p.diskon > 0 ? p.harga * (1 - p.diskon / 100) : p.harga;
      return price >= priceRange.min && price <= priceRange.max;
    });

    // Sort
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => {
          const priceA = a.diskon > 0 ? a.harga * (1 - a.diskon / 100) : a.harga;
          const priceB = b.diskon > 0 ? b.harga * (1 - b.diskon / 100) : b.harga;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        result.sort((a, b) => {
          const priceA = a.diskon > 0 ? a.harga * (1 - a.diskon / 100) : a.harga;
          const priceB = b.diskon > 0 ? b.harga * (1 - b.diskon / 100) : b.harga;
          return priceB - priceA;
        });
        break;
      case 'name-az':
        result.sort((a, b) => a.nama.localeCompare(b.nama));
        break;
      case 'name-za':
        result.sort((a, b) => b.nama.localeCompare(a.nama));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.tanggalDibuat) - new Date(a.tanggalDibuat));
        break;
    }

    return result;
  }, [produk, filterKategori, priceRange, sortBy]);

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

  if (error) {
    return (
      <div className={styles.root}>
        <div className={styles.container}>
          <div className={styles.errorState}>
            <h2>Terjadi Kesalahan</h2>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <Breadcrumb items={
          filterKategori 
            ? [
                { label: 'Produk', href: '/produk' },
                { label: filterKategori, href: null }
              ]
            : [{ label: 'Produk', href: null }]
        } />
        
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            {filterKategori || 'Semua Produk'}
          </h1>
          <span className={styles.count}>
            {filteredProduk.length} produk
          </span>
        </div>

        {/* Filters & Sort Bar */}
        <div className={styles.filterBar}>
          <div className={styles.filters}>
            {/* Category Filter */}
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className={styles.select}
            >
              <option value="">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className={styles.sortContainer}>
            <label htmlFor="sort">Urutkan:</label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.select}
            >
              <option value="newest">Terbaru</option>
              <option value="price-low">Harga Terendah</option>
              <option value="price-high">Harga Tertinggi</option>
              <option value="name-az">Nama A-Z</option>
              <option value="name-za">Nama Z-A</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProduk.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>Tidak ada produk ditemukan</h3>
            <p>Coba ubah filter atau kategori yang dipilih.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredProduk.map((item) => {
              const isLiked = wishlist.some((w) => w.produkId === item.id);
              const finalPrice = item.diskon > 0
                ? item.harga * (1 - item.diskon / 100)
                : item.harga;

              return (
                <Link
                  key={item.id}
                  href={`/produk/${item.id}`}
                  className={styles.card}
                >

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
                    <div className={styles.nameContainer}>
                      <h3 className={styles.productName}>{item.nama}</h3>
                      {/* Wishlist Button */}
                      <button
                        type="button"
                        className={clsx(styles.wishlistBtn, { [styles.active]: isLiked })}
                        onClick={(e) => handleWishlistToggle(e, item.id)}
                        aria-label={isLiked ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
                      >
                        {isLiked ? '♥' : '♡'}
                      </button>
                    </div>
                    <div className={styles.priceContainer}>
                      <span className={clsx(styles.currentPrice, { [styles.discountedPrice]: item.diskon > 0 })}>
                        Rp {finalPrice.toLocaleString('id-ID')}
                      </span>
                      {item.diskon > 0 && (
                        <div className={styles.originalPriceContainer}>
                          <span className={styles.originalPrice}>
                            Rp {item.harga.toLocaleString('id-ID')}
                          </span>
                          <span className={styles.discountBadgeSmall}>-{item.diskon}%</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.category}>{item.kategori}</div>
                  </div>

                  {/* Bottom Actions */}
                  <div className={styles.bottomActions}>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProdukGrid;

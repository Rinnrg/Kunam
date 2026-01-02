import { useEffect, useCallback, useState } from 'react';
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
  const [cart, setCart, , setCartTotal, setIsAuthModalOpen, showAlert, wishlist, setWishlist] = useStore(
    useShallow((state) => [
      state.cart, 
      state.setCart, 
      state.cartTotal, 
      state.setCartTotal, 
      state.setIsAuthModalOpen, 
      state.showAlert,
      state.wishlist,
      state.setWishlist
    ]),
  );

  const [selectedItems, setSelectedItems] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // Dummy data untuk kupon diskon
  const coupons = [
    { id: 1, code: 'DISKON10', discount: 10, type: 'percentage', minPurchase: 100000 },
    { id: 2, code: 'DISKON50K', discount: 50000, type: 'fixed', minPurchase: 200000 },
    { id: 3, code: 'NEWYEAR2026', discount: 15, type: 'percentage', minPurchase: 150000 },
  ];

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
            // Select all items by default
            setSelectedItems(data.cart.map(item => item.id));
            setIsAllSelected(true);
          }
        })
        .catch(console.error);
    }
  }, [session, setCart, setCartTotal]);

  useEffect(() => {
    // Check if all items are selected
    if (cart.length > 0 && selectedItems.length === cart.length) {
      setIsAllSelected(true);
    } else {
      setIsAllSelected(false);
    }
  }, [selectedItems, cart.length]);

  const calculateTotal = useCallback((items) => {
    return items.reduce((sum, item) => {
      const price = item.produk.harga * (1 - item.produk.diskon / 100);
      return sum + price * item.quantity;
    }, 0);
  }, []);

  const calculateSelectedTotal = useCallback(() => {
    const selectedCartItems = cart.filter(item => selectedItems.includes(item.id));
    return calculateTotal(selectedCartItems);
  }, [cart, selectedItems, calculateTotal]);

  const calculateDiscount = useCallback(() => {
    if (!selectedCoupon) return 0;
    const subtotal = calculateSelectedTotal();
    
    if (selectedCoupon.type === 'percentage') {
      return (subtotal * selectedCoupon.discount) / 100;
    }
    return selectedCoupon.discount;
  }, [selectedCoupon, calculateSelectedTotal]);

  const calculateFinalTotal = useCallback(() => {
    const subtotal = calculateSelectedTotal();
    const discount = calculateDiscount();
    return Math.max(0, subtotal - discount);
  }, [calculateSelectedTotal, calculateDiscount]);

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cart.map(item => item.id));
    }
  }, [isAllSelected, cart]);

  const handleSelectItem = useCallback((cartId) => {
    setSelectedItems(prev => {
      if (prev.includes(cartId)) {
        return prev.filter(id => id !== cartId);
      }
      return [...prev, cartId];
    });
  }, []);

  const handleToggleWishlist = useCallback(async (item) => {
    const isInWishlist = wishlist.some(w => w.produkId === item.produkId);
    
    try {
      if (isInWishlist) {
        // Remove from wishlist
        await fetch('/api/user/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ produkId: item.produkId }),
        });
        setWishlist(wishlist.filter(w => w.produkId !== item.produkId));
        showAlert({
          type: 'success',
          title: 'Dihapus dari Wishlist',
          message: 'Produk berhasil dihapus dari wishlist.',
        });
      } else {
        // Add to wishlist
        const res = await fetch('/api/user/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            produkId: item.produkId,
            ukuran: item.ukuran,
            warna: item.warna 
          }),
        });
        const data = await res.json();
        if (data.wishlistItem) {
          setWishlist([...wishlist, data.wishlistItem]);
          showAlert({
            type: 'success',
            title: 'Ditambahkan ke Wishlist',
            message: 'Produk berhasil ditambahkan ke wishlist.',
          });
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      showAlert({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: 'Gagal memperbarui wishlist. Silakan coba lagi.',
      });
    }
  }, [wishlist, setWishlist, showAlert]);

  const handleApplyCoupon = useCallback((coupon) => {
    const subtotal = calculateSelectedTotal();
    if (subtotal < coupon.minPurchase) {
      showAlert({
        type: 'error',
        title: 'Kupon Tidak Valid',
        message: `Minimal pembelian Rp ${coupon.minPurchase.toLocaleString('id-ID')} untuk menggunakan kupon ini.`,
      });
      return;
    }
    setSelectedCoupon(coupon);
    setIsCouponOpen(false);
    showAlert({
      type: 'success',
      title: 'Kupon Diterapkan',
      message: `Kupon ${coupon.code} berhasil diterapkan!`,
    });
  }, [calculateSelectedTotal, showAlert]);

  const handleRemoveCoupon = useCallback(() => {
    setSelectedCoupon(null);
    showAlert({
      type: 'success',
      title: 'Kupon Dihapus',
      message: 'Kupon berhasil dihapus.',
    });
  }, [showAlert]);

  const handleCheckout = useCallback(() => {
    if (selectedItems.length === 0) {
      showAlert({
        type: 'error',
        title: 'Tidak Ada Item',
        message: 'Silakan pilih item yang ingin di-checkout.',
      });
      return;
    }
    // TODO: Implement checkout logic
    showAlert({
      type: 'success',
      title: 'Checkout',
      message: 'Proses checkout akan segera dimulai...',
    });
  }, [selectedItems, showAlert]);

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
              <div className={styles.selectAllBar}>
                <label className={styles.checkboxLabel}>
                  <input 
                    type="checkbox" 
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className={styles.checkbox}
                  />
                  <span>Pilih Semua ({cart.length} Item)</span>
                </label>
              </div>

              {cart.map((item) => {
                const isInWishlist = wishlist.some(w => w.produkId === item.produkId);
                const isSelected = selectedItems.includes(item.id);
                
                return (
                  <div key={item.id} className={`${styles.card} ${isSelected ? styles.selected : ''}`}>
                    <label className={styles.checkboxContainer}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleSelectItem(item.id)}
                        className={styles.checkbox}
                      />
                    </label>
                    
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
                      {item.ukuran && <p className={styles.variant}>Size: {item.ukuran}</p>}
                      {item.warna && <p className={styles.variant}>Color: {item.warna}</p>}

                      <div className={styles.priceAndQuantity}>
                        <div className={styles.price}>
                          {item.produk?.diskon > 0 ? (
                            <>
                              <span className={styles.priceFinal}>
                                Rp {(item.produk.harga * (1 - item.produk.diskon / 100)).toLocaleString('id-ID')}
                              </span>
                              <span className={styles.priceOriginal}>Rp {item.produk.harga.toLocaleString('id-ID')}</span>
                              {item.produk.diskon > 0 && (
                                <span className={styles.saleLabel}>Diskon</span>
                              )}
                            </>
                          ) : (
                            <span className={styles.priceFinal}>Rp {item.produk?.harga?.toLocaleString('id-ID')}</span>
                          )}
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
                      </div>

                      {item.produk?.diskon > 0 && (
                        <div className={styles.subtotal}>
                          Subtotal: <span className={styles.priceFinal}>
                            Rp {((item.produk.harga * (1 - item.produk.diskon / 100)) * item.quantity).toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className={styles.actions}>
                      <button 
                        type="button" 
                        className={`${styles.wishlistButton} ${isInWishlist ? styles.active : ''}`}
                        onClick={() => handleToggleWishlist(item)}
                        aria-label={isInWishlist ? "Hapus dari wishlist" : "Tambah ke wishlist"}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill={isInWishlist ? "currentColor" : "none"} xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      <button 
                        type="button" 
                        className={styles.removeButton} 
                        onClick={() => handleRemove(item.id)}
                        aria-label="Hapus dari keranjang"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 6H21M19 6V20C19 21.1 18.1 22 17 22H7C5.9 22 5 21.1 5 20V6M8 6V4C8 2.9 8.9 2 10 2H14C15.1 2 16 2.9 16 4V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.summary}>
              <h3>Ringkasan Pesanan</h3>
              <div className={styles.summaryItems}>
                <div className={styles.summaryRow}>
                  <span>Subtotal Item ({selectedItems.length})</span>
                  <span>Rp {calculateSelectedTotal().toLocaleString('id-ID')}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Ongkos Kirim</span>
                  <span>TBD</span>
                </div>
                {selectedCoupon && (
                  <div className={styles.summaryRow}>
                    <span>Diskon ({selectedCoupon.code})</span>
                    <span className={styles.discount}>-Rp {calculateDiscount().toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span>Subtotal</span>
                  <span>Rp {calculateSelectedTotal().toLocaleString('id-ID')}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Estimasi Pajak</span>
                  <span>TBD</span>
                </div>
              </div>
              <div className={`${styles.summaryRow} ${styles.total}`}>
                <span>Total Pesanan</span>
                <span>Rp {calculateFinalTotal().toLocaleString('id-ID')}</span>
              </div>
              
              <div className={styles.couponSection}>
                <button 
                  type="button" 
                  className={styles.couponButton}
                  onClick={() => setIsCouponOpen(!isCouponOpen)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 12L3.27 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 12L20.73 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>
                    {selectedCoupon ? `Kupon: ${selectedCoupon.code}` : `Pilih Kupon (${coupons.length})`}
                  </span>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ transform: isCouponOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {isCouponOpen && (
                  <div className={styles.couponDropdown}>
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className={styles.couponItem}>
                        <div className={styles.couponInfo}>
                          <h4>{coupon.code}</h4>
                          <p>
                            Diskon {coupon.type === 'percentage' ? `${coupon.discount}%` : `Rp ${coupon.discount.toLocaleString('id-ID')}`}
                          </p>
                          <p className={styles.minPurchase}>
                            Min. pembelian: Rp {coupon.minPurchase.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={styles.applyCouponBtn}
                          onClick={() => handleApplyCoupon(coupon)}
                          disabled={selectedCoupon?.id === coupon.id}
                        >
                          {selectedCoupon?.id === coupon.id ? 'Terpilih' : 'Gunakan'}
                        </button>
                      </div>
                    ))}
                    
                    {selectedCoupon && (
                      <button
                        type="button"
                        className={styles.removeCouponBtn}
                        onClick={handleRemoveCoupon}
                      >
                        Hapus Kupon
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button 
                type="button" 
                className={styles.checkoutButton}
                onClick={handleCheckout}
                disabled={selectedItems.length === 0}
              >
                Checkout ({selectedItems.length} Item)
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

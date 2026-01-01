/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import styles from './AddToCartDialog.module.scss';

function AddToCartDialog({ isOpen, onClose, produk, onConfirm }) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (isOpen) {
      // Reset when dialog opens
      setSelectedSize(produk?.ukuran?.[0] || '');
      setSelectedColor(produk?.warna?.[0] || '');
      setQuantity(1);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, produk]);

  if (!isOpen || !produk) return null;

  const handleConfirm = () => {
    onConfirm({
      produkId: produk.id,
      ukuran: selectedSize,
      warna: selectedColor,
      quantity,
    });
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const incrementQuantity = () => {
    if (quantity < produk.stok) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="presentation">
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Pilih Variasi Produk</h2>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Tutup">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {/* Size Selection */}
          {produk.ukuran && produk.ukuran.length > 0 && (
            <div className={styles.section}>
              <div className={styles.label}>Ukuran</div>
              <div className={styles.options}>
                {produk.ukuran.map((size) => (
                  <button key={size} type="button" className={`${styles.optionButton} ${selectedSize === size ? styles.selected : ''}`} onClick={() => setSelectedSize(size)}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {produk.warna && produk.warna.length > 0 && (
            <div className={styles.section}>
              <div className={styles.label}>Warna</div>
              <div className={styles.options}>
                {produk.warna.map((color) => (
                  <button key={color} type="button" className={`${styles.optionButton} ${selectedColor === color ? styles.selected : ''}`} onClick={() => setSelectedColor(color)}>
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity Selection */}
          <div className={styles.section}>
            <div className={styles.label}>Jumlah</div>
            <div className={styles.quantityControl}>
              <button type="button" className={styles.quantityButton} onClick={decrementQuantity} disabled={quantity <= 1} aria-label="Kurangi">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <span className={styles.quantityValue}>{quantity}</span>
              <button type="button" className={styles.quantityButton} onClick={incrementQuantity} disabled={quantity >= produk.stok} aria-label="Tambah">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p className={styles.stockInfo}>Stok tersedia: {produk.stok}</p>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Batal
          </button>
          <button type="button" className={styles.confirmButton} onClick={handleConfirm} disabled={!selectedSize && produk.ukuran?.length > 0}>
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddToCartDialog;

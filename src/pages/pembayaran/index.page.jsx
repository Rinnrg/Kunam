/* eslint-disable react/jsx-props-no-spreading */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import CustomHead from '@src/components/dom/CustomHead';
import Breadcrumb from '@src/components/dom/Breadcrumb';
import LoadingSpinner from '@src/components/dom/LoadingSpinner';
import styles from './pembayaran.module.scss';

function PembayaranPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAlert, setIsAuthModalOpen] = useStore(
    useShallow((state) => [
      state.showAlert,
      state.setIsAuthModalOpen,
    ])
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState([]);

  // Get checkout items from query params or localStorage
  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsAuthModalOpen(true);
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      // Pre-fill form with user data
      setFormData((prev) => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }));

      // Get checkout items from query or localStorage
      const { items } = router.query;
      
      if (items) {
        try {
          const parsedItems = JSON.parse(decodeURIComponent(items));
          setCheckoutItems(parsedItems);
        } catch (e) {
          console.error('Error parsing items:', e);
        }
      } else {
        // Try to get from localStorage
        const storedItems = localStorage.getItem('checkoutItems');
        if (storedItems) {
          try {
            const parsedItems = JSON.parse(storedItems);
            setCheckoutItems(parsedItems);
          } catch (e) {
            console.error('Error parsing stored items:', e);
          }
        }
      }
      
      setIsLoading(false);
    }
  }, [status, session, router, setIsAuthModalOpen]);

  // Fetch available vouchers
  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const response = await fetch('/api/vouchers?active=true');
        const data = await response.json();
        if (data.vouchers) {
          setAvailableVouchers(data.vouchers);
        }
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      }
    };

    if (status === 'authenticated') {
      fetchVouchers();
    }
  }, [status]);

  // Calculate totals
  const subtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => {
      const price = item.produk?.diskon > 0
        ? item.produk.harga * (1 - item.produk.diskon / 100)
        : item.produk?.harga || 0;
      return sum + price * item.quantity;
    }, 0);
  }, [checkoutItems]);

  const discount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const total = subtotal - discount;

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Nomor telepon wajib diisi';
    } else if (!/^[0-9]{10,15}$/.test(formData.phone.replace(/[^0-9]/g, ''))) {
      newErrors.phone = 'Nomor telepon tidak valid (10-15 digit)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form change
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  // Handle voucher apply
  const handleApplyVoucher = useCallback(async (codeOrVoucher) => {
    const code = typeof codeOrVoucher === 'string' ? codeOrVoucher : codeOrVoucher.code;
    
    if (!code || !code.trim()) {
      setVoucherError('Masukkan kode voucher');
      return;
    }

    setVoucherLoading(true);
    setVoucherError('');

    try {
      const response = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          totalAmount: subtotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVoucherError(data.error || 'Voucher tidak valid');
        setAppliedVoucher(null);
      } else {
        setAppliedVoucher(data);
        setVoucherCode(data.voucher.code);
        setVoucherError('');
        setIsVoucherModalOpen(false);
        showAlert({
          type: 'success',
          title: 'Voucher Diterapkan',
          message: `Voucher ${data.voucher.code} berhasil diterapkan!`,
        });
      }
    } catch (error) {
      console.error('Error validating voucher:', error);
      setVoucherError('Terjadi kesalahan saat memvalidasi voucher');
      setAppliedVoucher(null);
    } finally {
      setVoucherLoading(false);
    }
  }, [subtotal, showAlert]);

  // Handle remove voucher
  const handleRemoveVoucher = useCallback(() => {
    setAppliedVoucher(null);
    setVoucherCode('');
    setVoucherError('');
    showAlert({
      type: 'success',
      title: 'Voucher Dihapus',
      message: 'Voucher berhasil dihapus.',
    });
  }, [showAlert]);

  // Handle apply voucher from input
  const handleApplyVoucherFromInput = useCallback(() => {
    handleApplyVoucher(voucherCode);
  }, [voucherCode, handleApplyVoucher]);

  // Handle payment
  const handlePayment = useCallback(async () => {
    if (!validateForm()) {
      showAlert({
        type: 'error',
        title: 'Form Tidak Lengkap',
        message: 'Mohon lengkapi semua data yang diperlukan.',
      });
      return;
    }

    if (checkoutItems.length === 0) {
      showAlert({
        type: 'error',
        title: 'Keranjang Kosong',
        message: 'Tidak ada item untuk dibayar.',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create transaction
      const res = await fetch('/api/payment/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems.map((item) => ({
            produkId: item.produkId,
            quantity: item.quantity,
            ukuran: item.ukuran,
            warna: item.warna,
          })),
          customerDetails: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat transaksi');
      }

      // Store order info for receipt page
      localStorage.setItem('lastOrder', JSON.stringify({
        orderNumber: data.order.orderNumber,
        totalAmount: data.order.totalAmount,
      }));

      // Clear checkout items from localStorage
      localStorage.removeItem('checkoutItems');

      // Open Midtrans Snap popup
      if (window.snap && data.snapToken) {
        window.snap.pay(data.snapToken, {
          onSuccess: (result) => {
            console.log('Payment success:', result);
            router.push(`/pembayaran/sukses?order=${data.order.orderNumber}`);
          },
          onPending: (result) => {
            console.log('Payment pending:', result);
            router.push(`/pembayaran/pending?order=${data.order.orderNumber}`);
          },
          onError: (result) => {
            console.log('Payment error:', result);
            showAlert({
              type: 'error',
              title: 'Pembayaran Gagal',
              message: 'Terjadi kesalahan saat memproses pembayaran.',
            });
            setIsProcessing(false);
          },
          onClose: () => {
            console.log('Snap popup closed');
            showAlert({
              type: 'warning',
              title: 'Pembayaran Dibatalkan',
              message: 'Anda menutup popup pembayaran. Pesanan Anda masih tersimpan.',
              confirmText: 'Lihat Pesanan',
              showCancel: true,
              onConfirm: () => {
                router.push('/pesanan');
              },
            });
            setIsProcessing(false);
          },
        });
      }
    } catch (error) {
      console.error('Payment error:', error);
      showAlert({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: error.message || 'Gagal memproses pembayaran. Silakan coba lagi.',
      });
      setIsProcessing(false);
    }
  }, [validateForm, checkoutItems, formData, showAlert, router]);

  // SEO
  const seo = {
    title: 'Pembayaran - Kunam',
    description: 'Selesaikan pembayaran Anda dengan aman dan mudah.',
  };

  if (status === 'loading' || isLoading) {
    return (
      <>
        <CustomHead {...seo} />
        <LoadingSpinner fullscreen />
      </>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <>
        <CustomHead {...seo} />
        <div className={styles.container}>
          <Breadcrumb items={[{ label: 'Pembayaran', href: null }]} />
          <div className={styles.emptyState}>
            <h2>Tidak Ada Item</h2>
            <p>Keranjang belanja Anda kosong. Silakan tambahkan produk terlebih dahulu.</p>
            <Link href="/produk" className={styles.backButton}>
              Lihat Produk
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CustomHead {...seo} />
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-F_0FEDIhSYS_VwxM'}
        onReady={() => setSnapReady(true)}
        strategy="lazyOnload"
      />
      
      <div className={styles.container}>
        <Breadcrumb items={[
          { label: 'Keranjang', href: '/cart' },
          { label: 'Pembayaran', href: null },
        ]} />

        <div className={styles.content}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* Customer Info Form */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Informasi Pembeli
              </h2>
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Nama Lengkap *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap"
                    className={errors.name ? styles.error : ''}
                  />
                  {errors.name && <span className={styles.errorText}>{errors.name}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="email@example.com"
                    className={errors.email ? styles.error : ''}
                  />
                  {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">Nomor Telepon *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="08xxxxxxxxxx"
                    className={errors.phone ? styles.error : ''}
                  />
                  {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                Ringkasan Pesanan ({checkoutItems.length} item)
              </h2>
              <div className={styles.orderItems}>
                {checkoutItems.map((item, index) => {
                  const price = item.produk?.diskon > 0
                    ? item.produk.harga * (1 - item.produk.diskon / 100)
                    : item.produk?.harga || 0;
                  const itemTotal = price * item.quantity;

                  return (
                    <div key={`${item.produkId}-${item.ukuran}-${item.warna}-${index}`} className={styles.orderItem}>
                      <div className={styles.itemImage}>
                        {item.produk?.gambar?.[0] ? (
                          <Image
                            src={item.produk.gambar[0]}
                            alt={item.produk.nama}
                            fill
                            sizes="80px"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#ddd' }} />
                        )}
                      </div>
                      <div className={styles.itemDetails}>
                        <h4>{item.produk?.nama || 'Produk'}</h4>
                        <p>
                          {item.ukuran && `Ukuran: ${item.ukuran}`}
                          {item.ukuran && item.warna && ' | '}
                          {item.warna && `Warna: ${item.warna}`}
                        </p>
                        <p>Qty: {item.quantity}</p>
                        <span className={styles.priceInline}>
                          Rp {itemTotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className={styles.itemPrice}>
                        <span className={styles.price}>Rp {itemTotal.toLocaleString('id-ID')}</span>
                        <span className={styles.qty}>{item.quantity}x</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Summary */}
          <div className={styles.rightColumn}>
            <div className={styles.summaryCard}>
              <h2 className={styles.summaryTitle}>Ringkasan Pembayaran</h2>

              {/* Voucher Section */}
              <div className={styles.voucherSection}>
                <button
                  type="button"
                  className={styles.voucherButton}
                  onClick={() => setIsVoucherModalOpen(!isVoucherModalOpen)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 22V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 12L3.27 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 12L20.73 6.96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>
                    {appliedVoucher ? `Voucher: ${appliedVoucher.voucher.code}` : `Pilih Voucher (${availableVouchers.length})`}
                  </span>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ transform: isVoucherModalOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {isVoucherModalOpen && (
                  <div className={styles.voucherDropdown}>
                    {/* Manual Input Section */}
                    <div className={styles.manualVoucherInput}>
                      <h4>Masukkan Kode Voucher</h4>
                      <div className={styles.voucherInputGroup}>
                        <input
                          type="text"
                          value={voucherCode}
                          onChange={(e) => {
                            setVoucherCode(e.target.value.toUpperCase());
                            setVoucherError('');
                          }}
                          placeholder="KODE VOUCHER"
                          className={voucherError ? styles.error : ''}
                        />
                        <button
                          type="button"
                          onClick={handleApplyVoucherFromInput}
                          disabled={voucherLoading || !voucherCode.trim()}
                          className={styles.applyBtn}
                        >
                          {voucherLoading ? 'Validasi...' : 'Gunakan'}
                        </button>
                      </div>
                      {voucherError && (
                        <span className={styles.errorText}>{voucherError}</span>
                      )}
                    </div>

                    {/* Available Vouchers List */}
                    {availableVouchers.length > 0 && (
                      <>
                        <div className={styles.dividerText}>
                          <span>atau pilih voucher tersedia</span>
                        </div>
                        <div className={styles.voucherList}>
                          {availableVouchers.map((voucher) => (
                            <div key={voucher.id} className={styles.voucherItem}>
                              <div className={styles.voucherItemHeader}>
                                <div className={styles.voucherBadge}>
                                  {voucher.discountType === 'percentage' 
                                    ? `${voucher.discountValue}%` 
                                    : `Rp ${voucher.discountValue.toLocaleString('id-ID')}`
                                  }
                                </div>
                                <span className={styles.voucherCode}>{voucher.code}</span>
                              </div>
                              <h4 className={styles.voucherName}>{voucher.name}</h4>
                              {voucher.description && (
                                <p className={styles.voucherDesc}>{voucher.description}</p>
                              )}
                              <div className={styles.voucherDetails}>
                                <span className={styles.minPurchase}>
                                  Min. pembelian: Rp {voucher.minPurchase.toLocaleString('id-ID')}
                                </span>
                                {voucher.maxDiscount && (
                                  <span className={styles.maxDiscount}>
                                    Maks. diskon: Rp {voucher.maxDiscount.toLocaleString('id-ID')}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                className={styles.useVoucherBtn}
                                onClick={() => handleApplyVoucher(voucher)}
                                disabled={appliedVoucher?.voucher.id === voucher.id || voucherLoading}
                              >
                                {appliedVoucher?.voucher.id === voucher.id ? '✓ Terpilih' : 'Gunakan'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {appliedVoucher && (
                      <button
                        type="button"
                        className={styles.removeVoucherBtn}
                        onClick={handleRemoveVoucher}
                      >
                        Hapus Voucher
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.divider} />

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span className={styles.label}>Subtotal ({checkoutItems.reduce((sum, item) => sum + item.quantity, 0)} item)</span>
                  <span className={styles.value}>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                {discount > 0 && (
                  <div className={`${styles.summaryRow} ${styles.discount}`}>
                    <span className={styles.label}>Diskon Voucher</span>
                    <span className={styles.value}>-Rp {discount.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className={styles.divider} />

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>Total</span>
                <span className={styles.totalValue}>Rp {total.toLocaleString('id-ID')}</span>
              </div>

              <button
                type="button"
                className={styles.payButton}
                onClick={handlePayment}
                disabled={isProcessing || !snapReady}
              >
                {isProcessing ? 'Memproses...' : 'Bayar Sekarang'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PembayaranPage;

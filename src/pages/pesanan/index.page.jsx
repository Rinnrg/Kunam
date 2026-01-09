import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import CustomHead from '@src/components/dom/CustomHead';
import Breadcrumb from '@src/components/dom/Breadcrumb';
import LoadingSpinner from '@src/components/dom/LoadingSpinner';
import ReviewDialog from '@src/components/dom/ReviewDialog';
import styles from './pesanan.module.scss';

const ORDER_STATUSES = [
  { key: 'all', label: 'Semua', icon: null },
  { key: 'pending', label: 'Menunggu Pembayaran'},
  { key: 'processing', label: 'Diproses',},
  { key: 'shipped', label: 'Dikirim',},
  { key: 'delivered', label: 'Selesai',},
  { key: 'cancelled', label: 'Dibatalkan',},
];

const STATUS_LABELS = {
  pending: 'Menunggu Pembayaran',
  processing: 'Diproses',
  shipped: 'Dikirim',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
};

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Pesanan Dibuat'},
  { key: 'processing', label: 'Diproses'},
  { key: 'shipped', label: 'Dikirim'},
  { key: 'delivered', label: 'Diterima'},
];

function PesananPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAlert, setIsAuthModalOpen] = useStore(
    useShallow((state) => [state.showAlert, state.setIsAuthModalOpen])
  );

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [reviewDialog, setReviewDialog] = useState({
    isOpen: false,
    produkId: null,
    produkName: '',
    orderId: null,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsAuthModalOpen(true);
      router.push('/');
    }
  }, [status, router, setIsAuthModalOpen]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/orders');
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showAlert({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: 'Gagal memuat pesanan. Silakan coba lagi.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    if (session?.user) {
      fetchOrders();
    }
  }, [session, fetchOrders]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Filter by status
    if (activeTab !== 'all') {
      result = result.filter((order) => order.status === activeTab);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((order) =>
        order.orderNumber.toLowerCase().includes(query) ||
        order.order_items?.some((item) =>
          item.produk?.nama?.toLowerCase().includes(query)
        )
      );
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'highest') {
      result.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (sortBy === 'lowest') {
      result.sort((a, b) => a.totalAmount - b.totalAmount);
    }

    return result;
  }, [orders, activeTab, searchQuery, sortBy]);

  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    ORDER_STATUSES.forEach((statusItem) => {
      if (statusItem.key !== 'all') {
        counts[statusItem.key] = orders.filter((o) => o.status === statusItem.key).length;
      }
    });
    return counts;
  }, [orders]);

  const handleCancelOrder = useCallback((orderId) => {
    showAlert({
      type: 'confirm',
      title: 'Batalkan Pesanan',
      message: 'Apakah Anda yakin ingin membatalkan pesanan ini?',
      confirmText: 'Batalkan',
      showCancel: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/user/orders/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'cancelled' }),
          });

          if (res.ok) {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === orderId ? { ...order, status: 'cancelled' } : order
              )
            );
            showAlert({
              type: 'success',
              title: 'Pesanan Dibatalkan',
              message: 'Pesanan berhasil dibatalkan.',
            });
          } else {
            throw new Error('Failed to cancel order');
          }
        } catch (error) {
          console.error('Error cancelling order:', error);
          showAlert({
            type: 'error',
            title: 'Terjadi Kesalahan',
            message: 'Gagal membatalkan pesanan. Silakan coba lagi.',
          });
        }
      },
    });
  }, [showAlert]);

  const handleBuyAgain = useCallback(async (order) => {
    try {
      // Add all items from order to cart
      const addToCartPromises = order.order_items.map((item) =>
        fetch('/api/user/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produkId: item.produkId,
            quantity: item.quantity,
            ukuran: item.ukuran,
            warna: item.warna,
          }),
        })
      );

      await Promise.all(addToCartPromises);

      showAlert({
        type: 'success',
        title: 'Ditambahkan ke Keranjang',
        message: 'Semua produk berhasil ditambahkan ke keranjang.',
      });

      router.push('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showAlert({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: 'Gagal menambahkan produk ke keranjang.',
      });
    }
  }, [router, showAlert]);

  const handleOpenReview = useCallback((produkId, produkName, orderId) => {
    setReviewDialog({
      isOpen: true,
      produkId,
      produkName,
      orderId,
    });
  }, []);

  const handleCloseReview = useCallback(() => {
    setReviewDialog({
      isOpen: false,
      produkId: null,
      produkName: '',
      orderId: null,
    });
  }, []);

  const handleReviewSuccess = useCallback(() => {
    showAlert({
      type: 'success',
      title: 'Ulasan Berhasil',
      message: 'Terima kasih atas ulasan Anda!',
    });
    // Optionally refresh orders to update review status
    fetchOrders();
  }, [showAlert, fetchOrders]);

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const formatShortDate = (dateString) => {
    const options = { day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  const getTimelineStatus = (orderStatus, step) => {
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(orderStatus);
    const stepIndex = statusOrder.indexOf(step);

    if (orderStatus === 'cancelled') return '';
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return '';
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.loading}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <>
      <CustomHead title="Pesanan Saya - Kunam" description="Lihat riwayat dan status pesanan Anda" />
      <main className={styles.container}>
        <Breadcrumb items={[{ label: 'Pesanan', href: null }]} />

        <div className={styles.content}>
          {/* Status Tabs */}
          <div className={styles.tabs}>
            {ORDER_STATUSES.map((statusItem) => (
              <button
                key={statusItem.key}
                type="button"
                className={`${styles.tab} ${activeTab === statusItem.key ? styles.active : ''}`}
                onClick={() => setActiveTab(statusItem.key)}
              >
                {statusItem.icon && <span>{statusItem.icon}</span>}
                {statusItem.label}
                {statusCounts[statusItem.key] > 0 && (
                  <span className={styles.tabBadge}>{statusCounts[statusItem.key]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Filter Section */}
          <div className={styles.filterSection}>
            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <input
                type="text"
                placeholder="Cari nomor pesanan atau nama produk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="highest">Harga Tertinggi</option>
              <option value="lowest">Harga Terendah</option>
            </select>
          </div>

          {filteredOrders.length === 0 ? (
            <div className={styles.empty}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 10C16 11.0609 15.5786 12.0783 14.8284 12.8284C14.0783 13.5786 13.0609 14 12 14C10.9391 14 9.92172 13.5786 9.17157 12.8284C8.42143 12.0783 8 11.0609 8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <h2>{activeTab === 'all' ? 'Belum ada pesanan' : `Tidak ada pesanan ${STATUS_LABELS[activeTab]?.toLowerCase()}`}</h2>
              <p>Mulai belanja dan pesanan Anda akan muncul di sini</p>
              <Link href="/produk" className={styles.browseButton}>
                Mulai Belanja
              </Link>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {filteredOrders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <div className={styles.orderInfo}>
                      <span className={styles.orderNumber}>{order.orderNumber}</span>
                      <span className={styles.orderDate}>{formatDate(order.createdAt)}</span>
                    </div>
                    <span className={`${styles.orderStatus} ${styles[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className={styles.orderBody}>
                    <div className={styles.orderItems}>
                      {order.order_items?.slice(0, expandedOrder === order.id ? undefined : 2).map((item) => (
                        <div key={item.id} className={styles.orderItem}>
                          <div className={styles.itemImage}>
                            {item.produk?.gambar && (
                              <Image
                                src={Array.isArray(item.produk.gambar) ? item.produk.gambar[0] : item.produk.gambar}
                                alt={item.produk.nama || 'Product'}
                                fill
                                sizes="80px"
                                style={{ objectFit: 'cover' }}
                              />
                            )}
                          </div>
                          <div className={styles.itemInfo}>
                            <Link href={`/produk/${item.produkId}`} className={styles.itemName}>
                              {item.produk?.nama || 'Produk'}
                            </Link>
                            {(item.ukuran || item.warna) && (
                              <p className={styles.itemVariant}>
                                {item.ukuran && `Size: ${item.ukuran}`}
                                {item.ukuran && item.warna && ' | '}
                                {item.warna && `Color: ${item.warna}`}
                              </p>
                            )}
                            <p className={styles.itemQuantity}>{item.quantity}x</p>
                          </div>
                          <div className={styles.itemPrice}>
                            Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                          </div>
                        </div>
                      ))}

                      {order.order_items?.length > 2 && expandedOrder !== order.id && (
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          onClick={() => setExpandedOrder(order.id)}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          Lihat {order.order_items.length - 2} produk lainnya
                        </button>
                      )}
                    </div>

                    <div className={styles.orderSummary}>
                      <div className={styles.orderTotal}>
                        <span className={styles.totalLabel}>Total Pesanan:</span>
                        <span className={styles.totalAmount}>Rp {order.totalAmount.toLocaleString('id-ID')}</span>
                      </div>
                      <div className={styles.orderActions}>
                        {order.status === 'pending' && (
                          <>
                            <button type="button" className={styles.btnPrimary}>
                              Bayar Sekarang
                            </button>
                            <button
                              type="button"
                              className={styles.btnDanger}
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              Batalkan
                            </button>
                          </>
                        )}
                        {order.status === 'shipped' && (
                          <button type="button" className={styles.btnPrimary}>
                            Lacak Pesanan
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <>
                            <button
                              type="button"
                              className={styles.btnPrimary}
                              onClick={() => handleBuyAgain(order)}
                            >
                              Beli Lagi
                            </button>
                            <button 
                              type="button" 
                              className={styles.btnSecondary}
                              onClick={() => {
                                const firstItem = order.order_items?.[0];
                                if (firstItem) {
                                  handleOpenReview(
                                    firstItem.produkId,
                                    firstItem.produk?.nama || 'Produk',
                                    order.id
                                  );
                                }
                              }}
                            >
                              Beri Ulasan
                            </button>
                          </>
                        )}
                        {order.status === 'cancelled' && (
                          <button
                            type="button"
                            className={styles.btnPrimary}
                            onClick={() => handleBuyAgain(order)}
                          >
                            Beli Lagi
                          </button>
                        )}
                        <Link href={`/pesanan/${order.id}`} className={styles.btnSecondary}>
                          Detail
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Timeline - Only show for non-cancelled orders */}
                  {order.status !== 'cancelled' && (
                    <div className={styles.timeline}>
                      <h4 className={styles.timelineTitle}>Status Pesanan</h4>
                      <div className={styles.timelineSteps}>
                        {TIMELINE_STEPS.map((step) => {
                          const stepStatus = getTimelineStatus(order.status, step.key);
                          return (
                            <div key={step.key} className={styles.timelineStep}>
                              <div className={`${styles.stepIcon} ${stepStatus ? styles[stepStatus] : ''}`}>
                                {stepStatus === 'completed' ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <polyline points="20,6 9,17 4,12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <span style={{ fontSize: '12px' }}>{step.icon}</span>
                                )}
                              </div>
                              <div className={styles.stepInfo}>
                                <span className={styles.stepLabel}>{step.label}</span>
                                {stepStatus === 'active' && (
                                  <span className={styles.stepDate}>{formatShortDate(order.updatedAt)}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Review Dialog */}
      <ReviewDialog
        isOpen={reviewDialog.isOpen}
        onClose={handleCloseReview}
        produkId={reviewDialog.produkId}
        produkName={reviewDialog.produkName}
        orderId={reviewDialog.orderId}
        onSuccess={handleReviewSuccess}
      />
    </>
  );
}

export default PesananPage;

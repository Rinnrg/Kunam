import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './OrdersManager.module.scss';

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'Semua Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Diproses' },
    { value: 'shipped', label: 'Dikirim' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ];

  const paymentStatusOptions = [
    { value: 'pending', label: 'Menunggu Pembayaran', color: '#f59e0b' },
    { value: 'settlement', label: 'Sudah Dibayar', color: '#10b981' },
    { value: 'expire', label: 'Kadaluarsa', color: '#ef4444' },
    { value: 'cancel', label: 'Dibatalkan', color: '#6b7280' },
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery, orders]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/orders');
      const data = await response.json();
      if (response.ok) {
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(query) ||
          order.customerName?.toLowerCase().includes(query) ||
          order.customerEmail?.toLowerCase().includes(query) ||
          order.users?.name?.toLowerCase().includes(query) ||
          order.users?.email?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      completed: '#10b981',
      cancelled: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const getPaymentStatusInfo = (paymentStatus) => {
    return paymentStatusOptions.find((opt) => opt.value === paymentStatus) || { label: paymentStatus, color: '#6b7280' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Memuat data pesanan...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Manajemen Pesanan</h2>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Pesanan</span>
            <span className={styles.statValue}>{orders.length}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Pending</span>
            <span className={styles.statValue}>{orders.filter((o) => o.status === 'pending').length}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Selesai</span>
            <span className={styles.statValue}>{orders.filter((o) => o.status === 'completed').length}</span>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input type="text" placeholder="Cari order number, nama, atau email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.searchInput} />
        </div>
        <div className={styles.filterGroup}>
          <label htmlFor="statusFilter">Filter Status:</label>
          <select id="statusFilter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.select}>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Tidak ada pesanan yang ditemukan</p>
        </div>
      ) : (
        <div className={styles.ordersTable}>
          <table>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Tanggal</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status Pembayaran</th>
                <th>Status Pesanan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const paymentInfo = getPaymentStatusInfo(order.paymentStatus);
                return (
                  <tr key={order.id}>
                    <td>
                      <span className={styles.orderNumber}>{order.orderNumber}</span>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div className={styles.customerInfo}>
                        <span className={styles.customerName}>{order.customerName || order.users?.name || '-'}</span>
                        <span className={styles.customerEmail}>{order.customerEmail || order.users?.email || '-'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.itemCount}>{order.order_items?.length || 0} item</span>
                    </td>
                    <td>
                      <span className={styles.totalAmount}>{formatCurrency(order.totalAmount)}</span>
                    </td>
                    <td>
                      <span className={styles.paymentStatus} style={{ backgroundColor: paymentInfo.color }}>
                        {paymentInfo.label}
                      </span>
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className={styles.statusSelect}
                        style={{ borderColor: getStatusColor(order.status) }}
                      >
                        {statusOptions.slice(1).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button type="button" onClick={() => setSelectedOrder(order)} className={styles.detailButton}>
                        Detail
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <div className={styles.modal} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.closeButton} onClick={() => setSelectedOrder(null)}>
              ×
            </button>
            <h3>Detail Pesanan</h3>
            <div className={styles.orderDetail}>
              <div className={styles.detailSection}>
                <h4>Informasi Pesanan</h4>
                <p>
                  <strong>Order Number:</strong> {selectedOrder.orderNumber}
                </p>
                <p>
                  <strong>Tanggal:</strong> {formatDate(selectedOrder.createdAt)}
                </p>
                <p>
                  <strong>Status:</strong> {statusOptions.find((s) => s.value === selectedOrder.status)?.label}
                </p>
                <p>
                  <strong>Status Pembayaran:</strong> {getPaymentStatusInfo(selectedOrder.paymentStatus).label}
                </p>
              </div>

              <div className={styles.detailSection}>
                <h4>Informasi Customer</h4>
                <p>
                  <strong>Nama:</strong> {selectedOrder.customerName || selectedOrder.users?.name || '-'}
                </p>
                <p>
                  <strong>Email:</strong> {selectedOrder.customerEmail || selectedOrder.users?.email || '-'}
                </p>
                <p>
                  <strong>Telepon:</strong> {selectedOrder.customerPhone || selectedOrder.users?.phone || '-'}
                </p>
              </div>

              <div className={styles.detailSection}>
                <h4>Items Pesanan</h4>
                <div className={styles.orderItems}>
                  {selectedOrder.order_items?.map((item, index) => (
                    <div key={index} className={styles.orderItem}>
                      {item.produk?.gambar?.[0] && (
                        <div className={styles.itemImage}>
                          <Image src={item.produk.gambar[0]} alt={item.produk.nama} width={60} height={60} />
                        </div>
                      )}
                      <div className={styles.itemInfo}>
                        <p className={styles.itemName}>{item.produk?.nama || 'Produk tidak ditemukan'}</p>
                        <p className={styles.itemVariant}>
                          {item.ukuran && `Ukuran: ${item.ukuran}`} {item.warna && `| Warna: ${item.warna}`}
                        </p>
                        <p className={styles.itemQuantity}>Qty: {item.quantity}</p>
                      </div>
                      <div className={styles.itemPrice}>{formatCurrency(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.detailSection}>
                <h4>Total Pembayaran</h4>
                <p className={styles.totalPrice}>{formatCurrency(selectedOrder.totalAmount)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

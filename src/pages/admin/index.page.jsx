import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import OrdersManager from './components/OrdersManager';
import HomeSectionManager from './components/HomeSectionManager';
import styles from './dashboard.module.scss';

// Dynamically import chart component to avoid SSR issues
const RevenueChart = dynamic(() => import('./components/RevenueChart'), { ssr: false });
const OrdersChart = dynamic(() => import('./components/OrdersChart'), { ssr: false });

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [produk, setProduk] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchProduk = async () => {
    try {
      const response = await fetch('/api/produk');
      const data = await response.json();
      if (Array.isArray(data)) {
        setProduk(data);
      } else {
        setProduk([]);
      }
    } catch (error) {
      setProduk([]);
    }
  };

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchStats(), fetchProduk()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
    
    // Redirect jika bukan admin
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  // Enable scrolling on admin page
  useEffect(() => {
    // Store original body overflow
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    
    // Enable scrolling
    document.body.style.overflow = 'visible';
    document.body.style.height = 'auto';
    
    // Cleanup: restore original values on unmount
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/admin/login');
  };

  const handleDeleteProduk = async (id) => {
    // eslint-disable-next-line no-alert, no-restricted-globals
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/produk/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchProduk();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader} />
        <p>Loading...</p>
      </div>
    );
  }

  // Block non-admin users
  if (status === 'authenticated' && session?.user?.role !== 'admin') {
    return (
      <div className={styles.loadingContainer}>
        <div style={{ textAlign: 'center' }}>
          <h2>Access Denied</h2>
          <p>Anda tidak memiliki akses ke halaman admin.</p>
          <button 
            type="button"
            onClick={() => router.push('/')}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Kembali ke Home
          </button>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Kunam</title>
      </Head>
      <div className={styles.dashboardContainer}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h1 className={styles.logo}>Kunam Admin</h1>
            <p className={styles.subtitle}>Dashboard</p>
          </div>
          <nav className={styles.sidebarNav}>
            <button type="button" className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`} onClick={() => setActiveTab('dashboard')}>
              <span className={styles.navIcon}>📊</span>
              Dashboard
            </button>
            <button type="button" className={`${styles.navItem} ${activeTab === 'orders' ? styles.active : ''}`} onClick={() => setActiveTab('orders')}>
              <span className={styles.navIcon}>📦</span>
              Pesanan
            </button>
            <button type="button" className={`${styles.navItem} ${activeTab === 'products' ? styles.active : ''}`} onClick={() => setActiveTab('products')}>
              <span className={styles.navIcon}>🛍️</span>
              Produk
            </button>
            <button type="button" className={`${styles.navItem} ${activeTab === 'home-sections' ? styles.active : ''}`} onClick={() => setActiveTab('home-sections')}>
              <span className={styles.navIcon}>🏠</span>
              Home Sections
            </button>
          </nav>
          <div className={styles.sidebarFooter}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{session.user.name || session.user.email}</span>
              <span className={styles.userRole}>Administrator</span>
            </div>
            <button type="button" onClick={handleLogout} className={styles.logoutButton}>
              <span>🚪</span> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={styles.mainContent}>
          <header className={styles.topBar}>
            <h2 className={styles.pageTitle}>
              {activeTab === 'dashboard' && 'Dashboard Overview'}
              {activeTab === 'orders' && 'Manajemen Pesanan'}
              {activeTab === 'products' && 'Manajemen Produk'}
              {activeTab === 'home-sections' && 'Home Sections Manager'}
            </h2>
          </header>

          <div className={styles.contentArea}>
            {activeTab === 'dashboard' && (
              <>
                {/* Statistics Cards */}
                <div className={styles.statsGrid}>
                  <div className={styles.statCard} style={{ '--card-color': '#3b82f6' }}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
                      👥
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Total Users</span>
                      <span className={styles.statValue}>{stats?.totalUsers || 0}</span>
                      <span className={`${styles.statChange} ${styles.positive}`}>↑ Active</span>
                    </div>
                  </div>
                  <div className={styles.statCard} style={{ '--card-color': '#10b981' }}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                      🛍️
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Total Produk</span>
                      <span className={styles.statValue}>{stats?.totalProducts || 0}</span>
                      <span className={`${styles.statChange} ${styles.positive}`}>↑ In Stock</span>
                    </div>
                  </div>
                  <div className={styles.statCard} style={{ '--card-color': '#f59e0b' }}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                      📦
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Total Pesanan</span>
                      <span className={styles.statValue}>{stats?.totalOrders || 0}</span>
                      <span className={`${styles.statChange} ${styles.positive}`}>↑ All Time</span>
                    </div>
                  </div>
                  <div className={styles.statCard} style={{ '--card-color': '#8b5cf6' }}>
                    <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                      💰
                    </div>
                    <div className={styles.statInfo}>
                      <span className={styles.statLabel}>Total Revenue</span>
                      <span className={styles.statValue}>{formatCurrency(stats?.totalRevenue || 0).replace('Rp', '').trim().slice(0, -3)}K</span>
                      <span className={`${styles.statChange} ${styles.positive}`}>↑ This Month</span>
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className={styles.chartsSection}>
                  <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                      <h3 className={styles.chartTitle}>Revenue Overview</h3>
                      <div className={styles.chartFilter}>
                        <button type="button" className={styles.active}>6 Bulan</button>
                        <button type="button">1 Tahun</button>
                      </div>
                    </div>
                    <div className={styles.chartContent}>
                      <RevenueChart data={stats?.monthlyRevenue} />
                    </div>
                  </div>
                  
                  <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                      <h3 className={styles.chartTitle}>Order Status</h3>
                    </div>
                    <div className={styles.chartContent}>
                      <OrdersChart data={stats?.ordersByStatus} />
                    </div>
                  </div>
                </div>

                {/* Order Status Overview */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Status Pesanan</h3>
                  <div className={styles.orderStatusGrid}>
                    <div className={styles.orderStatusCard} style={{ borderColor: '#f59e0b' }}>
                      <span className={styles.orderStatusLabel}>Pending</span>
                      <span className={styles.orderStatusValue}>{stats?.ordersByStatus?.pending || 0}</span>
                    </div>
                    <div className={styles.orderStatusCard} style={{ borderColor: '#3b82f6' }}>
                      <span className={styles.orderStatusLabel}>Processing</span>
                      <span className={styles.orderStatusValue}>{stats?.ordersByStatus?.processing || 0}</span>
                    </div>
                    <div className={styles.orderStatusCard} style={{ borderColor: '#10b981' }}>
                      <span className={styles.orderStatusLabel}>Completed</span>
                      <span className={styles.orderStatusValue}>{stats?.ordersByStatus?.completed || 0}</span>
                    </div>
                    <div className={styles.orderStatusCard} style={{ borderColor: '#ef4444' }}>
                      <span className={styles.orderStatusLabel}>Cancelled</span>
                      <span className={styles.orderStatusValue}>{stats?.ordersByStatus?.cancelled || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>Quick Actions</h3>
                  <div className={styles.quickActions}>
                    <button type="button" onClick={() => setActiveTab('orders')} className={styles.actionButton}>
                      📦 Lihat Semua Pesanan
                    </button>
                    <button type="button" onClick={() => router.push('/admin/produk/create')} className={styles.actionButton}>
                      ➕ Tambah Produk Baru
                    </button>
                    <button type="button" onClick={() => setActiveTab('products')} className={styles.actionButton}>
                      🛍️ Kelola Produk
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'orders' && <OrdersManager />}

            {activeTab === 'products' && (
              <div className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Daftar Produk</h3>
                  <button type="button" onClick={() => router.push('/admin/produk/create')} className={styles.addButton}>
                    + Tambah Produk
                  </button>
                </div>

                {produk.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>Belum ada produk. Tambahkan produk pertama Anda!</p>
                  </div>
                ) : (
                  <div className={styles.productsGrid}>
                    {produk.map((item) => (
                      <div key={item.id} className={styles.productCard}>
                        <div className={styles.productInfo}>
                          <h3 className={styles.productTitle}>{item.nama}</h3>
                          <p className={styles.productCategory}>{item.kategori}</p>
                          <p className={styles.productPrice}>{formatCurrency(item.harga)}</p>
                          <p className={styles.productStock}>Stok: {item.stok}</p>
                        </div>
                        <div className={styles.productActions}>
                          <button type="button" onClick={() => router.push(`/admin/produk/edit/${item.id}`)} className={styles.editButton}>
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDeleteProduk(item.id)} className={styles.deleteButton}>
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'home-sections' && <HomeSectionManager />}
          </div>
        </main>
      </div>
    </>
  );
}

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Breadcrumb from '@src/components/dom/Breadcrumb';
import HomeSectionManager from './components/HomeSectionManager';
import styles from './dashboard.module.scss';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [produk, setProduk] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProduk = async () => {
    try {
      const response = await fetch('/api/produk');
      const data = await response.json();
      // Make sure data is an array before setting it
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
    await fetchProduk();
    setIsLoading(false);
  };

  useEffect(() => {
    // Jika belum login, redirect ke login
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
      // Error handling
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Breadcrumb items={[{ label: 'Admin', href: null }]} />
          <h1 className={styles.title}>Admin Dashboard</h1>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{session.user.name || session.user.email}</span>
            <button type="button" onClick={handleLogout} className={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <HomeSectionManager />

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Produk</h2>
            <button type="button" onClick={() => router.push('/admin/produk/create')} className={styles.addButton}>
              + Tambah Produk
            </button>
          </div>

          {produk.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Belum ada produk. Tambahkan produk pertama Anda!</p>
            </div>
          ) : (
            <div className={styles.projectsGrid}>
              {produk.map((item) => (
                <div key={item.id} className={styles.projectCard}>
                  <div className={styles.projectInfo}>
                    <h3 className={styles.projectTitle}>{item.nama}</h3>
                    <p className={styles.projectCategory}>{item.kategori}</p>
                    <p className={styles.projectYear}>Rp {item.harga.toLocaleString('id-ID')}</p>
                    <p className={styles.projectYear}>Stok: {item.stok}</p>
                  </div>
                  <div className={styles.projectActions}>
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
      </main>
    </div>
  );
}

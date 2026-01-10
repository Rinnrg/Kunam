import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { AdminLayout } from '@src/components/admin/layout/admin-layout';
import {
  Search,
  Calendar,
  ShoppingBag,
  Star,
  Heart,
  ShoppingCart,
  Mail,
  Phone,
  Trash2,
  User,
  TrendingUp,
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

export default function CustomersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [imageErrors, setImageErrors] = useState({});
  const limit = 10;

  const [showAlert] = useStore(useShallow((state) => [state.showAlert]));

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'admin') {
      router.push('/admin/login');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, sortBy, sortOrder, currentPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchQuery,
        sortBy,
        order: sortOrder,
        page: currentPage,
        limit,
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch customers');
      }

      const data = await response.json();
      console.log('Customers data:', data.users?.slice(0, 2)); // Log first 2 customers for debugging
      setCustomers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching customers:', error);
      showAlert({ type: 'error', title: 'Gagal memuat pelanggan', message: error.message || 'Terjadi kesalahan saat memuat daftar pelanggan.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    showAlert({
      type: 'confirm',
      title: 'Hapus Customer',
      message: 'Apakah Anda yakin ingin menghapus customer ini? Ini juga akan menghapus semua pesanan, review, dan wishlist yang terkait.',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/customers?id=${userId}`, {
            method: 'DELETE',
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || data.message || 'Gagal menghapus customer');
          showAlert({ type: 'success', title: 'Berhasil', message: 'Customer berhasil dihapus.' });
          fetchCustomers();
        } catch (error) {
          console.error('Error deleting customer:', error);
          showAlert({ type: 'error', title: 'Gagal', message: error.message || 'Gagal menghapus customer.' });
        }
      },
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p>Loading...</p>
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
        <title>Customers - Admin Dashboard</title>
      </Head>
      <AdminLayout>
        <div style={{ padding: '2rem' }}>
          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem',
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                    Total Customers
                  </p>
                  <p style={{ fontSize: '1.875rem', fontWeight: '700', color: '#111827' }}>
                    {total}
                  </p>
                </div>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#dbeafe',
                  borderRadius: '0.5rem',
                }}>
                  <User style={{ width: '1.5rem', height: '1.5rem', color: '#2563eb' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            marginBottom: '1.5rem',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: '1rem',
              alignItems: 'center',
            }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1.25rem',
                  height: '1.25rem',
                  color: '#9ca3af',
                }} />
                <input
                  type="text"
                  placeholder="Search by name, email, username, or phone..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  padding: '0.625rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <option value="createdAt">Registration Date</option>
                <option value="name">Name</option>
                <option value="email">Email</option>
              </select>

              {/* Sort Order */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  padding: '0.625rem 0.75rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Customers Table */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Customer
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Contact
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Orders
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Reviews
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'right',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Total Spent
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Registered
                    </th>
                    <th style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'center',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{
                        padding: '3rem',
                        textAlign: 'center',
                        color: '#6b7280',
                      }}>
                        No customers found
                      </td>
                    </tr>
                  ) : (
                    customers.map((customer) => (
                      <tr
                        key={customer.id}
                        style={{
                          borderTop: '1px solid #e5e7eb',
                        }}
                      >
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {customer.image && !imageErrors[customer.id] ? (
                              <img
                                src={customer.image}
                                alt={customer.name || 'User'}
                                style={{
                                  width: '2.5rem',
                                  height: '2.5rem',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  flexShrink: 0,
                                }}
                                onError={(e) => {
                                  console.error('Image load error for user:', customer.id, customer.image);
                                  setImageErrors(prev => ({ ...prev, [customer.id]: true }));
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                borderRadius: '50%',
                                backgroundColor: '#e5e7eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}>
                                <User style={{ width: '1.25rem', height: '1.25rem', color: '#6b7280' }} />
                              </div>
                            )}
                            <div>
                              <div style={{
                                fontWeight: '500',
                                color: '#111827',
                                fontSize: '0.875rem',
                              }}>
                                {customer.name || 'N/A'}
                              </div>
                              <div style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                              }}>
                                @{customer.username || 'no-username'}
                              </div>
                              {customer.provider !== 'credentials' && (
                                <span style={{
                                  fontSize: '0.625rem',
                                  padding: '0.125rem 0.5rem',
                                  backgroundColor: '#dbeafe',
                                  color: '#1e40af',
                                  borderRadius: '0.25rem',
                                  display: 'inline-block',
                                  marginTop: '0.25rem',
                                }}>
                                  {customer.provider}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {customer.email && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: '#6b7280',
                              }}>
                                <Mail style={{ width: '0.875rem', height: '0.875rem' }} />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                color: '#6b7280',
                              }}>
                                <Phone style={{ width: '0.875rem', height: '0.875rem' }} />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#f3f4f6',
                            borderRadius: '0.375rem',
                          }}>
                            <ShoppingBag style={{ width: '0.875rem', height: '0.875rem', color: '#6b7280' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                              {customer.stats.totalOrders ?? 0}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0.75rem',
                            backgroundColor: '#fef3c7',
                            borderRadius: '0.375rem',
                          }}>
                            <Star style={{ width: '0.875rem', height: '0.875rem', color: '#f59e0b' }} />
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                              {customer.stats.totalReviews ?? 0}
                            </span>
                          </div>
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'right',
                          fontWeight: '600',
                          color: '#059669',
                          fontSize: '0.875rem',
                        }}>
                          {formatCurrency(customer.stats.totalSpent || 0)}
                        </td>
                        <td style={{
                          padding: '1rem',
                          textAlign: 'center',
                          fontSize: '0.875rem',
                          color: '#6b7280',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <Calendar style={{ width: '0.875rem', height: '0.875rem' }} />
                            {formatDate(customer.createdAt)}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              color: '#dc2626',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Delete customer"
                          >
                            <Trash2 style={{ width: '1.125rem', height: '1.125rem' }} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{
                padding: '1rem',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Page {currentPage} of {totalPages}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      backgroundColor: '#ffffff',
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      backgroundColor: '#ffffff',
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { AdminLayout } from '@src/components/admin/layout/admin-layout';
import { Star, Trash2, Eye, Search, Filter } from 'lucide-react';
import Link from 'next/link';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';

export default function ReviewsPage() {
  const { data: session, status } = useSession();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState('all');
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });

  const [showAlert] = useStore(useShallow((state) => [state.showAlert]));

  useEffect(() => {
    if (status === 'authenticated') {
      fetchReviews();
    }
  }, [status]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setStats(data.stats || {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        });
      } else {
        showAlert({ type: 'error', title: 'Gagal Memuat', message: 'Gagal memuat review' });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      showAlert({ type: 'error', title: 'Terjadi Kesalahan', message: 'Gagal memuat review' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    showAlert({
      type: 'confirm',
      title: 'Hapus Review',
      message: 'Apakah Anda yakin ingin menghapus review ini?',
      confirmText: 'Hapus',
      cancelText: 'Batal',
      showCancel: true,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
          if (response.ok) {
            setReviews(reviews.filter((r) => r.id !== id));
            showAlert({ type: 'success', title: 'Berhasil', message: 'Review berhasil dihapus' });
            fetchReviews();
          } else {
            showAlert({ type: 'error', title: 'Gagal', message: 'Gagal menghapus review' });
          }
        } catch (error) {
          console.error('Error deleting review:', error);
          showAlert({ type: 'error', title: 'Terjadi Kesalahan', message: 'Gagal menghapus review' });
        }
      },
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            fill={star <= rating ? '#fbbf24' : 'none'}
            color={star <= rating ? '#fbbf24' : '#d1d5db'}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.users?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.produk?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating =
      filterRating === 'all' || review.rating === parseInt(filterRating);

    return matchesSearch && matchesRating;
  });

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Stats Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '0.5rem',
              }}
            >
              Total Reviews
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>
              {stats.totalReviews}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#fff',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                marginBottom: '0.5rem',
              }}
            >
              Average Rating
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#111827' }}>
                {stats.averageRating.toFixed(1)}
              </div>
              <Star size={24} fill="#fbbf24" color="#fbbf24" />
            </div>
          </div>

          {/* Rating Distribution */}
          {[5, 4, 3, 2, 1].map((star) => (
            <div
              key={star}
              style={{
                backgroundColor: '#fff',
                padding: '1rem',
                borderRadius: '0.5rem',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Star size={14} fill="#fbbf24" color="#fbbf24" />
                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{star}</span>
                </div>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {stats.ratingDistribution[star] || 0}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    backgroundColor: '#fbbf24',
                    width: `${stats.totalReviews > 0 ? ((stats.ratingDistribution[star] || 0) / stats.totalReviews) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div
          style={{
            backgroundColor: '#fff',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
            }}
          >
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                }}
              />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              />
            </div>

            {/* Filter by Rating */}
            <div style={{ position: 'relative' }}>
              <Filter
                size={18}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af',
                }}
              />
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Customer
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Product
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Rating
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Comment
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'right',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      style={{
                        padding: '3rem',
                        textAlign: 'center',
                        color: '#6b7280',
                      }}
                    >
                      No reviews found
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr
                      key={review.id}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div
                            style={{
                              fontWeight: '500',
                              color: '#111827',
                              fontSize: '0.875rem',
                            }}
                          >
                            {review.users?.name || 'Anonymous'}
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              marginTop: '0.125rem',
                            }}
                          >
                            {review.users?.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {review.produk?.gambar?.[0] && (
                            <img
                              src={review.produk.gambar[0]}
                              alt={review.produk.nama}
                              style={{
                                width: '2.5rem',
                                height: '2.5rem',
                                objectFit: 'cover',
                                borderRadius: '0.375rem',
                                backgroundColor: '#f3f4f6',
                              }}
                            />
                          )}
                          <div
                            style={{
                              fontSize: '0.875rem',
                              color: '#374151',
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {review.produk?.nama || 'Deleted Product'}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>{renderStars(review.rating)}</td>
                      <td style={{ padding: '1rem' }}>
                        <div
                          style={{
                            fontSize: '0.875rem',
                            color: '#374151',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {review.comment}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: '1rem',
                          fontSize: '0.875rem',
                          color: '#6b7280',
                        }}
                      >
                        {formatDate(review.createdAt)}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.5rem',
                          }}
                        >
                          <Link href={`/produk/${review.produkId}`}>
                            <button
                              style={{
                                padding: '0.5rem',
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                              }}
                              title="View Product"
                            >
                              <Eye size={16} />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDelete(review.id)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

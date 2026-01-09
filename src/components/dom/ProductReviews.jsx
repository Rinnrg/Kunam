/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useStore } from '@src/store';
import { useShallow } from 'zustand/react/shallow';
import LoadingSpinner from './LoadingSpinner';
import styles from './ProductReviews.module.scss';

function ProductReviews({ produkId }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showAlert] = useStore(useShallow((state) => [state.showAlert]));

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ totalReviews: 0, averageRating: 0 });
  const [canReview, setCanReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/${produkId}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setStats(data.stats || { totalReviews: 0, averageRating: 0 });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [produkId]);

  // Check if user can review
  const checkCanReview = useCallback(async () => {
    if (!session?.user) {
      setCanReview(false);
      setHasPurchased(false);
      setHasReviewed(false);
      return;
    }

    try {
      const res = await fetch('/api/reviews/check-purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ produkId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCanReview(data.canReview);
        setHasPurchased(data.hasPurchased);
        setHasReviewed(data.hasReviewed);
      }
    } catch (error) {
      console.error('Error checking purchase:', error);
    }
  }, [session, produkId]);

  useEffect(() => {
    fetchReviews();
    checkCanReview();
  }, [fetchReviews, checkCanReview]);

  // Submit review
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session?.user) {
      showAlert({
        type: 'warning',
        title: 'Login Diperlukan',
        message: 'Anda harus login terlebih dahulu untuk memberikan review.',
        confirmText: 'Login Sekarang',
        showCancel: true,
        onConfirm: () => {
          router.push('/login');
        },
      });
      return;
    }

    if (comment.trim().length < 10) {
      showAlert({
        type: 'error',
        title: 'Komentar Terlalu Pendek',
        message: 'Komentar harus minimal 10 karakter.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/reviews/${produkId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert({
          type: 'success',
          title: 'Review Berhasil',
          message: 'Terima kasih atas review Anda!',
        });
        setComment('');
        setRating(5);
        setShowForm(false);
        fetchReviews();
        checkCanReview();
      } else {
        showAlert({
          type: 'error',
          title: 'Gagal Menambahkan Review',
          message: data.error || 'Terjadi kesalahan saat menambahkan review.',
        });
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showAlert({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: 'Gagal menambahkan review. Silakan coba lagi.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Format tanggal
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('id-ID', options);
  };

  // Render stars
  const renderStars = (ratingValue, interactive = false) => {
    return (
      <div className={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={styles.star}
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            aria-label={`${star} bintang`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={star <= (interactive ? (hoverRating || rating) : ratingValue) ? 'currentColor' : 'none'}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <LoadingSpinner size="medium" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Review Produk</h2>
        {stats.totalReviews > 0 && (
          <div className={styles.statsWrapper}>
            <div className={styles.ratingDisplay}>
              <span className={styles.ratingNumber}>{stats.averageRating}</span>
              {renderStars(stats.averageRating)}
              <span className={styles.totalReviews}>({stats.totalReviews} review)</span>
            </div>
          </div>
        )}
      </div>

      {/* Review Form */}
      {canReview && !showForm && (
        <div className={styles.reviewPrompt}>
          <p>Anda sudah membeli produk ini. Berikan review Anda!</p>
          <button type="button" className={styles.writeReviewBtn} onClick={() => setShowForm(true)}>
            Tulis Review
          </button>
        </div>
      )}

      {hasReviewed && (
        <div className={styles.reviewPrompt}>
          <p>Anda sudah memberikan review untuk produk ini.</p>
        </div>
      )}

      {!session?.user && (
        <div className={styles.reviewPrompt}>
          <p>Login untuk memberikan review setelah membeli produk ini.</p>
        </div>
      )}

      {hasPurchased && !hasReviewed && !canReview && (
        <div className={styles.reviewPrompt}>
          <p>Pesanan Anda masih diproses. Anda dapat memberikan review setelah pesanan selesai.</p>
        </div>
      )}

      {showForm && canReview && (
        <form onSubmit={handleSubmit} className={styles.reviewForm}>
          <div className={styles.formGroup}>
            <label htmlFor="rating" className={styles.label}>
              Rating
            </label>
            {renderStars(rating, true)}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="comment" className={styles.label}>
              Komentar (minimal 10 karakter)
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={styles.textarea}
              placeholder="Ceritakan pengalaman Anda dengan produk ini..."
              rows={5}
              required
            />
            <div className={styles.charCount}>{comment.length} karakter</div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)} disabled={submitting}>
              Batal
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting || comment.trim().length < 10}>
              {submitting ? 'Mengirim...' : 'Kirim Review'}
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className={styles.reviewsList}>
        {reviews.length === 0 ? (
          <div className={styles.noReviews}>
            <p>Belum ada review untuk produk ini.</p>
            <p>Jadilah yang pertama memberikan review!</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <div className={styles.userInfo}>
                  {review.users?.image ? (
                    <img src={review.users.image} alt={review.users.name || 'User'} className={styles.userAvatar} />
                  ) : (
                    <div className={styles.userAvatarPlaceholder}>{(review.users?.name || review.users?.email || 'U').charAt(0).toUpperCase()}</div>
                  )}
                  <div>
                    <p className={styles.userName}>{review.users?.name || review.users?.email}</p>
                    <p className={styles.reviewDate}>{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>
              <p className={styles.reviewComment}>{review.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProductReviews;

import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@src/store';
import { useShallow } from 'zustand/react/shallow';
import styles from './ReviewDialog.module.scss';

function ReviewDialog({ isOpen, onClose, produkId, produkName, orderId, onSuccess }) {
  const [showAlert] = useStore(useShallow((state) => [state.showAlert]));
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      
      // Lock scroll
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        // Unlock scroll and restore position
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
    return undefined;
  }, [isOpen]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      showAlert({
        type: 'warning',
        title: 'Rating Diperlukan',
        message: 'Silakan pilih rating bintang terlebih dahulu.',
      });
      return;
    }

    if (comment.trim().length < 10) {
      showAlert({
        type: 'warning',
        title: 'Komentar Terlalu Pendek',
        message: 'Komentar harus minimal 10 karakter.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reviews/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produkId,
          orderId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showAlert({
          type: 'success',
          title: 'Review Berhasil',
          message: 'Terima kasih atas review Anda!',
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showAlert({
          type: 'error',
          title: 'Gagal Mengirim Review',
          message: data.message || 'Gagal mengirim ulasan. Silakan coba lagi.',
        });
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      showAlert({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: 'Terjadi kesalahan. Silakan coba lagi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, comment, produkId, orderId, onClose, onSuccess, showAlert]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setRating(0);
      setComment('');
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Beri Ulasan</h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.productName}>{produkName}</p>

          <form onSubmit={handleSubmit}>
            {/* Star Rating */}
            <div className={styles.ratingSection}>
              <label className={styles.label}>Berikan Rating</label>
              <div className={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`${styles.star} ${
                      star <= (hoveredRating || rating) ? styles.active : ''
                    }`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    disabled={isSubmitting}
                  >
                    ★
                  </button>
                ))}
              </div>
              <p className={styles.ratingText}>
                {rating === 0 && 'Pilih rating'}
                {rating === 1 && 'Sangat Buruk'}
                {rating === 2 && 'Buruk'}
                {rating === 3 && 'Cukup'}
                {rating === 4 && 'Bagus'}
                {rating === 5 && 'Sangat Bagus'}
              </p>
            </div>

            {/* Comment */}
            <div className={styles.commentSection}>
              <label className={styles.label} htmlFor="comment">
                Tulis Ulasan Anda
              </label>
              <textarea
                id="comment"
                className={styles.textarea}
                placeholder="Ceritakan pengalaman Anda dengan produk ini..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={5}
                disabled={isSubmitting}
                maxLength={500}
              />
              <div className={styles.charCount}>
                {comment.length}/500 karakter
              </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Batal
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReviewDialog;

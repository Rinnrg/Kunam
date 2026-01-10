import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@src/store';
import { useShallow } from 'zustand/react/shallow';
import styles from './ReviewDialog.module.scss';

function ReviewDialog({ isOpen, onClose, produkId, produkName, orderId, onSuccess }) {
  const [showAlert, lenis] = useStore(useShallow((state) => [state.showAlert, state.lenis]));
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const scrollRef = useRef(0);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (!isOpen) return undefined;

    // Save current scroll position (use Lenis value if available)
    scrollRef.current = (lenis && typeof lenis.scroll === 'number') ? lenis.scroll : (window.scrollY || 0);

    // If Lenis is used, stop it. Otherwise use native overflow hidden
    if (lenis && typeof lenis.stop === 'function') {
      try {
        lenis.stop();
      } catch (err) {
        // fallback to native overflow hiding
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }

    return () => {
      // Restore scrolling behavior
      if (lenis && typeof lenis.start === 'function') {
        try {
          lenis.start();
          if (typeof lenis.scrollTo === 'function') {
            lenis.scrollTo(scrollRef.current, { immediate: true });
          } else {
            window.scrollTo(0, scrollRef.current);
          }
        } catch (err) {
          // fallback
          document.body.style.overflow = '';
          document.body.style.touchAction = '';
          window.scrollTo(0, scrollRef.current);
        }
      } else {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        window.scrollTo(0, scrollRef.current);
      }
    };
  }, [isOpen, lenis]);

  // Fetch existing user review for this product when dialog opens
  useEffect(() => {
    let mounted = true;

    const reset = () => {
      setIsEdit(false);
      setRating(0);
      setComment('');
    };

    if (!isOpen || !produkId) {
      reset();
      return () => { mounted = false; };
    }

    (async () => {
      try {
        const res = await fetch(`/api/reviews/my/${produkId}`);
        if (!mounted) return;
        if (!res.ok) {
          // If unauthorized or other error, treat as no existing review
          reset();
          return;
        }
        const data = await res.json();
        if (data && data.review) {
          setIsEdit(true);
          setRating(data.review.rating || 0);
          setComment(data.review.comment || '');
        } else {
          reset();
        }
      } catch (err) {
        console.error('Error fetching user review:', err);
        reset();
      }
    })();

    return () => { mounted = false; };
  }, [isOpen, produkId]);

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
      if (isEdit) {
        // Update existing review
        const res = await fetch(`/api/reviews/my/${produkId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, comment: comment.trim() }),
        });

        const data = await res.json();

        if (res.ok) {
          showAlert({
            type: 'success',
            title: 'Ulasan Berhasil Diperbarui',
            message: data.message || 'Ulasan berhasil diperbarui.',
          });
          if (onSuccess) onSuccess();
          onClose();
        } else {
          showAlert({
            type: 'error',
            title: 'Gagal Memperbarui Ulasan',
            message: data.error || 'Gagal memperbarui ulasan. Silakan coba lagi.',
          });
        }
      } else {
        // Create new review
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
  }, [rating, comment, produkId, orderId, onClose, onSuccess, showAlert, isEdit]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setRating(0);
      setComment('');
      setIsEdit(false);
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const dialog = (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{isEdit ? 'Edit Ulasan' : 'Beri Ulasan'}</h3>
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
                {isSubmitting ? 'Mengirim...' : (isEdit ? 'Perbarui Ulasan' : 'Kirim Ulasan')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}

export default ReviewDialog;

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './alertDialog.module.scss';

/**
 * AlertDialog Component - Reusable dialog for alerts and confirmations
 * @param {boolean} isOpen - Control dialog visibility
 * @param {function} onClose - Callback when dialog is closed
 * @param {function} onConfirm - Callback when confirm button is clicked (optional)
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} type - Dialog type: 'info', 'success', 'warning', 'error', 'confirm'
 * @param {string} confirmText - Text for confirm button (default: 'OK')
 * @param {string} cancelText - Text for cancel button (default: 'Batal')
 * @param {boolean} showCancel - Show cancel button (default: false for info/success/error, true for confirm)
 */
function AlertDialog({ isOpen, onClose, onConfirm, title, message, type = 'info', confirmText = 'OK', cancelText = 'Batal', showCancel }) {
  // Auto-determine showCancel based on type if not explicitly set
  const shouldShowCancel = showCancel !== undefined ? showCancel : type === 'confirm';

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const overlayRef = useRef(null);

  useEffect(() => {
    if (overlayRef.current) {
      // eslint-disable-next-line no-console
      console.log('[AlertDialog] mounted overlay element:', overlayRef.current);
      // eslint-disable-next-line no-console
      const cs = getComputedStyle(overlayRef.current);
      // eslint-disable-next-line no-console
      console.log('[AlertDialog] overlay styles', { display: cs.display, visibility: cs.visibility, opacity: cs.opacity, zIndex: cs.zIndex, position: cs.position, top: cs.top });
      // Force inline styles to ensure visibility when global resets interfere
      try {
        const el = overlayRef.current;
        el.style.display = 'flex';
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.zIndex = '2147483647';
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.left = '0';
        el.style.right = '0';
        el.style.bottom = '0';
      } catch (e) {
        // ignore
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('[AlertDialog] overlayRef is null');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // If document isn't available (SSR), do not attempt to portal
  if (typeof document === 'undefined') return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className={styles.icon} width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'error':
        return (
          <svg className={styles.icon} width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={styles.icon} width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 20H22L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="17" r="1" fill="currentColor" />
          </svg>
        );
      case 'confirm':
        return (
          <svg className={styles.icon} width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        );
      default:
        return (
          <svg className={styles.icon} width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
            <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        );
    }
  };

  return createPortal(
    <div ref={overlayRef} className={`${styles.overlay} ${styles.alertDebugForce}`} onClick={handleBackdropClick} role="presentation">
      <div className={`${styles.dialog} ${styles[type]}`}>
        <div className={styles.iconWrapper}>{getIcon()}</div>

        {title && <h2 className={styles.title}>{title}</h2>}

        {message && <p className={styles.message}>{message}</p>}

        <div className={styles.actions}>
          {shouldShowCancel && (
            <button type="button" className={styles.cancelButton} onClick={handleCancel}>
              {cancelText}
            </button>
          )}
          <button type="button" className={styles.confirmButton} onClick={handleConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AlertDialog;

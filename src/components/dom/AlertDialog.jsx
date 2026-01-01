import { useEffect } from 'react';
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
function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Batal',
  showCancel,
}) {
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

  if (!isOpen) return null;

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

  return (
    <div className={styles.overlay} onClick={handleBackdropClick} role="presentation">
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
    </div>
  );
}

export default AlertDialog;

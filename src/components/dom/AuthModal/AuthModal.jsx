import { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '@src/store';
import styles from './styles/authModal.module.scss';

function AuthModal() {
  const [isAuthModalOpen, setIsAuthModalOpen, authModalTab, setAuthModalTab] = useStore(
    useShallow((state) => [state.isAuthModalOpen, state.setIsAuthModalOpen, state.authModalTab, state.setAuthModalTab]),
  );

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleClose = useCallback(() => {
    setIsAuthModalOpen(false);
    setError('');
    setSuccess('');
    setFormData({ email: '', password: '', name: '', phone: '', confirmPassword: '' });
  }, [setIsAuthModalOpen]);

  const handleOverlayClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose],
  );

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  }, []);

  const handleLogin = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
        const result = await signIn('user-credentials', {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });

        if (result?.error) {
          setError('Email atau password salah');
        } else {
          handleClose();
          window.location.reload();
        }
      } catch (err) {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    },
    [formData.email, formData.password, handleClose],
  );

  const handleRegister = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      if (formData.password !== formData.confirmPassword) {
        setError('Password tidak cocok');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Password minimal 6 karakter');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            phone: formData.phone,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message || 'Registrasi gagal');
        } else {
          setSuccess('Registrasi berhasil! Silakan login.');
          setAuthModalTab('login');
          setFormData({ email: formData.email, password: '', name: '', phone: '', confirmPassword: '' });
        }
      } catch (err) {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    },
    [formData, setAuthModalTab],
  );

  const handleGoogleLogin = useCallback(() => {
    signIn('google', { callbackUrl: '/' });
  }, []);

  const handleTabChange = useCallback(
    (tab) => {
      setAuthModalTab(tab);
      setError('');
      setSuccess('');
    },
    [setAuthModalTab],
  );

  return (
    <div className={`${styles.overlay} ${isAuthModalOpen ? styles.open : ''}`} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button type="button" className={styles.closeButton} onClick={handleClose} aria-label="Tutup">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className={styles.header}>
          <h2>Selamat Datang</h2>
          <p>Masuk atau daftar untuk melanjutkan</p>
        </div>

        <div className={styles.tabs}>
          <button type="button" className={`${styles.tab} ${authModalTab === 'login' ? styles.active : ''}`} onClick={() => handleTabChange('login')}>
            Masuk
          </button>
          <button type="button" className={`${styles.tab} ${authModalTab === 'register' ? styles.active : ''}`} onClick={() => handleTabChange('register')}>
            Daftar
          </button>
        </div>

        <div className={styles.content}>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          {authModalTab === 'login' ? (
            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.inputGroup}>
                <label htmlFor="login-email">Email</label>
                <input type="email" id="login-email" name="email" value={formData.email} onChange={handleInputChange} placeholder="nama@email.com" required />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="login-password">Password</label>
                <input type="password" id="login-password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Masukkan password" required />
              </div>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
          ) : (
            <form className={styles.form} onSubmit={handleRegister}>
              <div className={styles.inputGroup}>
                <label htmlFor="register-name">Nama</label>
                <input type="text" id="register-name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nama lengkap" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="register-phone">Nomor Telepon</label>
                <input type="tel" id="register-phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="08123456789" />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="register-email">Email</label>
                <input type="email" id="register-email" name="email" value={formData.email} onChange={handleInputChange} placeholder="nama@email.com" required />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="register-password">Password</label>
                <input type="password" id="register-password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Minimal 6 karakter" required />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="register-confirm">Konfirmasi Password</label>
                <input type="password" id="register-confirm" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="Ulangi password" required />
              </div>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Memproses...' : 'Daftar'}
              </button>
            </form>
          )}

          <div className={styles.divider}>
            <span>atau</span>
          </div>

          <button type="button" className={styles.googleButton} onClick={handleGoogleLogin}>
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Lanjutkan dengan Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;

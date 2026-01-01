import { useState, useCallback, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from './login.module.scss';

function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('login');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    birthday: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check for OAuth errors in URL
  useEffect(() => {
    const { error: oauthError } = router.query;
    if (oauthError === 'OAuthCallback') {
      setError('Error connecting to Google. Please check Google OAuth configuration.');
    } else if (oauthError === 'OAuthSignin') {
      setError('Error initializing Google sign-in. Please try again.');
    } else if (oauthError === 'OAuthCreateAccount') {
      setError('Could not create user account. Please try again.');
    } else if (oauthError) {
      setError(`Authentication error: ${oauthError}`);
    }
  }, [router.query]);

  // Redirect jika sudah login
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/');
    }
  }, [session, status, router]);

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
          router.push('/');
        }
      } catch (err) {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    },
    [formData.email, formData.password, router],
  );

  const handleRegister = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setError('');

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
          setActiveTab('login');
          setFormData({ email: formData.email, password: '', name: '', phone: '', birthday: '', confirmPassword: '' });
        }
      } catch (err) {
        setError('Terjadi kesalahan. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    },
    [formData],
  );

  const handleGoogleLogin = useCallback(() => {
    signIn('google', { callbackUrl: '/' });
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
    setFormData({
      email: '',
      password: '',
      name: '',
      phone: '',
      birthday: '',
      confirmPassword: '',
    });
    setRememberMe(false);
    setShowPassword(false);
    setNewsletterOptIn(false);
  }, []);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Memuat...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{activeTab === 'login' ? 'Masuk' : 'Daftar'} - Kunam</title>
        <meta name="description" content="Masuk atau daftar untuk melanjutkan belanja di Kunam" />
      </Head>

      <div className={styles.container}>
        <div className={styles.card}>
          {/* Logo */}
          <div className={styles.logoContainer}>
            <Image src="/logo/logo 2 black.svg" alt="Kunam" width={120} height={50} priority />
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button type="button" className={`${styles.tab} ${activeTab === 'login' ? styles.active : ''}`} onClick={() => handleTabChange('login')}>
              Masuk
            </button>
            <button type="button" className={`${styles.tab} ${activeTab === 'register' ? styles.active : ''}`} onClick={() => handleTabChange('register')}>
              Daftar
            </button>
          </div>

          <div className={styles.content}>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            {activeTab === 'login' ? (
              <form className={styles.form} onSubmit={handleLogin}>
                <div className={styles.inputGroup}>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Alamat Email *" required className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Kata Sandi *"
                      required
                      className={styles.input}
                    />
                    <button type="button" className={styles.eyeButton} onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className={styles.optionsRow}>
                  <label className={styles.checkboxLabel} htmlFor="remember-me">
                    <input type="checkbox" id="remember-me" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>Tetap masuk</span>
                  </label>
                  <Link href="/forgot-password" className={styles.forgotLink}>
                    Lupa Kata Sandi?
                  </Link>
                </div>

                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>

                <div className={styles.socialDivider}>Atau masuk dengan</div>

                {/* Social Login Buttons */}
                <div className={styles.socialButtons}>
                  <button type="button" className={styles.socialButton} onClick={handleGoogleLogin}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                      <path
                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                        fill="#1877F2"
                      />
                    </svg>
                    <span>Lanjutkan dengan Facebook</span>
                  </button>
                  <button type="button" className={styles.socialButton} onClick={handleGoogleLogin}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Lanjutkan dengan Google</span>
                  </button>
                </div>

                <p className={styles.privacyText}>
                  Dengan membuat akun Anda atau masuk, Anda setuju dengan <Link href="/privacy">Syarat dan Ketentuan</Link> & <Link href="/privacy">Kebijakan Privasi</Link> kami
                </p>
              </form>
            ) : (
              <form className={styles.form} onSubmit={handleRegister}>
                <div className={styles.inputGroup}>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="Alamat Email *" required className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Kata Sandi *"
                      required
                      className={styles.input}
                    />
                    <button type="button" className={styles.eyeButton} onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className={styles.inputGroup}>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nama Depan *" className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <input type="date" name="birthday" value={formData.birthday} onChange={handleInputChange} placeholder="Hari Ulang Tahun (opsional)" className={styles.input} />
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel} htmlFor="remember-reg">
                    <input type="checkbox" id="remember-reg" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                    <span>Tetap masuk</span>
                  </label>
                  <label className={styles.checkboxLabel} htmlFor="newsletter">
                    <input type="checkbox" id="newsletter" checked={newsletterOptIn} onChange={(e) => setNewsletterOptIn(e.target.checked)} />
                    <span>Saya ingin tips gaya, produk baru, dan semua yang terbaru dalam fashion dikirim ke kotak masuk saya!</span>
                  </label>
                </div>

                <button type="submit" className={styles.submitButton} disabled={loading}>
                  {loading ? 'Memproses...' : 'Daftar'}
                </button>

                <div className={styles.socialDivider}>Atau masuk dengan</div>

                {/* Social Login Buttons */}
                <div className={styles.socialButtons}>
                  <button type="button" className={styles.socialButton} onClick={handleGoogleLogin}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                      <path
                        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                        fill="#1877F2"
                      />
                    </svg>
                    <span>Lanjutkan dengan Facebook</span>
                  </button>
                  <button type="button" className={styles.socialButton} onClick={handleGoogleLogin}>
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="20" height="20">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span>Lanjutkan dengan Google</span>
                  </button>
                </div>

                <p className={styles.privacyText}>
                  Dengan membuat akun Anda atau masuk, Anda setuju dengan <Link href="/privacy">Syarat dan Ketentuan</Link> & <Link href="/privacy">Kebijakan Privasi</Link> kami
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;

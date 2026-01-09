import { signIn, useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import styles from './login.module.scss';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [infoMessage, setInfoMessage] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Show info message based on query parameters
    if (router.query.logout === 'true') {
      setInfoMessage('Anda telah berhasil logout.');
    } else if (router.query.expired === 'true') {
      setInfoMessage('Sesi Anda telah kedaluwarsa. Silakan login kembali.');
    }

    // Jika ada session tapi ada query parameter logout, clear session
    if (router.query.logout === 'true' && session) {
      signOut({ redirect: false });
    }
    // Jika sudah login sebagai admin, redirect ke dashboard
    else if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/admin');
    }
  }, [status, session, router]);

  useEffect(() => {
    // Clear any lingering admin tokens on mount
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin-token');
    }
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setIsLoading(true);

      try {
        const result = await signIn('admin-credentials', {
          redirect: false,
          email: email.trim(),
          password,
        });

        if (result?.error) {
          // Parse error message
          if (result.error.includes('Terlalu banyak')) {
            setError('Terlalu banyak percobaan login. Akun Anda telah diblokir sementara.');
            setRemainingAttempts(0);
          } else {
            setError('Email atau password salah');
            // Decrement remaining attempts if available
            if (remainingAttempts !== null) {
              setRemainingAttempts(Math.max(0, remainingAttempts - 1));
            }
          }
        } else if (result?.ok) {
          // Force redirect to admin dashboard
          router.replace('/admin');
        }
      } catch (err) {
        console.error('Login error:', err);
        setError('Terjadi kesalahan. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    },
    [email, password, router, remainingAttempts],
  );

  const handleInputChange = useCallback((setter) => (e) => {
    setter(e.target.value);
    setError('');
  }, []);

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
        <title>Admin Login - Kunam</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className={styles.container}>
        <div className={styles.card}>
          {/* Logo */}
          <div className={styles.logoContainer}>
            <Image src="/logo/logo 2 black.svg" alt="Kunam Admin" width={120} height={50} priority />
          </div>


          <div className={styles.content}>
            {infoMessage && (
              <div className={styles.info}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{infoMessage}</span>
              </div>
            )}

            {error && (
              <div className={styles.error}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {remainingAttempts !== null && remainingAttempts > 0 && remainingAttempts <= 3 && (
              <div className={styles.warning}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M10.29 3.86L1.82 18C1.64537 18.3024 1.55297 18.6453 1.55199 18.9945C1.55101 19.3437 1.64149 19.6871 1.81442 19.9905C1.98735 20.2939 2.23672 20.5467 2.53771 20.7239C2.83869 20.9011 3.18086 20.9962 3.53 21H20.47C20.8191 20.9962 21.1613 20.9011 21.4623 20.7239C21.7633 20.5467 22.0126 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5317 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3437 2.89725 12 2.89725C11.6563 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4683 3.56611 10.29 3.86Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M12 9V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Sisa percobaan: {remainingAttempts}</span>
              </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="admin-email" className={styles.label}>
                  Email Admin
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={handleInputChange(setEmail)}
                  className={styles.input}
                  placeholder="email"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handleInputChange(setPassword)}
                    className={styles.input}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06L17.94 17.94Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C19 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19L9.9 4.24Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path
                          d="M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.5719 9.14351 13.1984C8.99262 12.8248 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2218 9.18488 10.8538C9.34884 10.4859 9.58525 10.1546 9.88 9.88"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.submitButton} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg className={styles.spinner} width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <circle className={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

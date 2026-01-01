import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from './login.module.scss';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // Jika sudah login, redirect ke dashboard
    if (status === 'authenticated') {
      router.push('/admin');
    }
  }, [status, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('admin-credentials', {
        redirect: false,
        email,
        password,
        callbackUrl: '/admin',
      });

      if (result?.error) {
        setError('Email atau password salah');
      } else if (result?.ok) {
        // Force redirect to admin
        window.location.href = '/admin';
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>Admin Login</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.input} placeholder="admin@example.com" required disabled={isLoading} />
            </label>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              Password
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={styles.input} placeholder="••••••••" required disabled={isLoading} />
            </label>
          </div>

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

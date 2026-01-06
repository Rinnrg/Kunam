import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/**
 * Custom hook untuk mengamankan halaman admin
 * Mengecek apakah user sudah login dan memiliki role admin
 * Jika tidak, redirect ke halaman yang sesuai
 */
export function useAdminAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    // Redirect ke login jika belum authenticate
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }

    // Redirect ke home jika bukan admin
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    // User adalah admin
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      setIsAuthorized(true);
    }
  }, [status, session, router]);

  return {
    isAuthorized,
    isLoading: status === 'loading',
    session,
    isAdmin: session?.user?.role === 'admin',
  };
}

/**
 * HOC (Higher Order Component) untuk protect admin pages
 */
export function withAdminAuth(Component) {
  // eslint-disable-next-line func-names
  return function ProtectedAdminPage(props) {
    const { isAuthorized, isLoading, session } = useAdminAuth();

    // Loading state
    if (isLoading) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading...</p>
          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    // Not authorized
    if (!isAuthorized) {
      return null;
    }

    // Authorized - render component
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <Component {...props} session={session} />;
  };
}

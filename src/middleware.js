import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Middleware function untuk check role
const adminMiddleware = (req) => {
  const token = req.nextauth.token;
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isAdminLoginPage = req.nextUrl.pathname === '/admin/login';

  // Jika user mencoba akses admin route (kecuali login page)
  if (isAdminRoute && !isAdminLoginPage) {
    // Cek apakah user adalah admin
    if (!token || token.role !== 'admin') {
      // Redirect ke home jika bukan admin
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
};

export default withAuth(adminMiddleware, {
  callbacks: {
    authorized: ({ token, req }) => {
      const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
      const isAdminLoginPage = req.nextUrl.pathname === '/admin/login';
      
      // Untuk halaman admin login, izinkan akses tanpa token
      if (isAdminLoginPage) {
        return true;
      }
      
      // Untuk halaman admin lainnya, harus ada token DAN role admin
      if (isAdminRoute) {
        return !!token && token.role === 'admin';
      }
      
      return !!token;
    },
  },
  pages: {
    signIn: '/admin/login',
  },
});

export const config = {
  matcher: ['/admin/:path*'],
};

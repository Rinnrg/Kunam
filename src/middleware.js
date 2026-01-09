import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// Middleware function untuk check role dengan enhanced security
const adminMiddleware = (req) => {
  const token = req.nextauth.token;
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const isAdminLoginPage = req.nextUrl.pathname === '/admin/login';
  const isLogout = req.nextUrl.searchParams.get('logout') === 'true';

  // Security headers untuk semua request
  const response = NextResponse.next();
  
  // Set security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';"
  );

  // Jika admin login page dengan logout parameter, izinkan tanpa redirect
  if (isAdminLoginPage && isLogout) {
    return response;
  }

  // Jika user sudah login sebagai admin dan mencoba akses login page
  if (isAdminLoginPage && token?.role === 'admin' && !isLogout) {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  // Jika user mencoba akses admin route (kecuali login page)
  if (isAdminRoute && !isAdminLoginPage) {
    // Cek apakah user adalah admin
    if (!token || token.role !== 'admin') {
      // Log suspicious activity
      console.warn(`[SECURITY] Unauthorized admin access attempt from: ${req.ip || 'unknown'}`);
      
      // Redirect ke admin login jika bukan admin
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    
    // Additional security check: verify token freshness
    const tokenAge = Date.now() - (token.iat * 1000);
    const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (tokenAge > maxTokenAge) {
      console.warn(`[SECURITY] Admin token expired for: ${token.email}`);
      return NextResponse.redirect(new URL('/admin/login?expired=true', req.url));
    }
  }

  // Prevent admin from accessing user routes if explicitly needed
  if (token?.role === 'admin' && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/admin', req.url));
  }

  return response;
};

export default withAuth(adminMiddleware, {
  callbacks: {
    authorized: ({ token, req }) => {
      const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
      const isAdminLoginPage = req.nextUrl.pathname === '/admin/login';
      
      // Untuk halaman admin login, izinkan akses tanpa token
      if (isAdminLoginPage) {
        // Jika sudah login sebagai admin, redirect ke dashboard
        if (token?.role === 'admin') {
          return true; // Will be redirected by adminMiddleware
        }
        return true;
      }
      
      // Untuk halaman admin lainnya, harus ada token DAN role admin
      if (isAdminRoute) {
        const isAuthorized = !!token && token.role === 'admin';
        
        if (!isAuthorized) {
          console.warn(`[SECURITY] Unauthorized admin access: ${token?.email || 'unknown'}`);
        }
        
        return isAuthorized;
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


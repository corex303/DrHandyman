import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const MAINTENANCE_COOKIE_NAME = 'maintenance_session';
const MAINTENANCE_EXPECTED_COOKIE_VALUE = 'maintenance_session_active_marker';

const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_EXPECTED_COOKIE_VALUE = 'admin_session_active_marker';

const IS_PRODUCTION_MW = process.env.NODE_ENV === 'production';
const NEXTAUTH_SESSION_TOKEN_COOKIE_NAME = IS_PRODUCTION_MW ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

const nextAuthSecret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Customer Portal protection (NextAuth.js)
  if (pathname.startsWith('/portal')) {
    const token = await getToken({
      req,
      secret: nextAuthSecret,
      cookieName: NEXTAUTH_SESSION_TOKEN_COOKIE_NAME,
    });

    if (!token) {
      const signInUrl = new URL('/auth/signin', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (token.role !== 'CUSTOMER') {
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next();
  }

  // Maintenance portal protection
  if (pathname.startsWith('/maintenance')) {
    const maintenanceCookie = req.cookies.get(MAINTENANCE_COOKIE_NAME);
    const isAuthenticated = maintenanceCookie?.value === MAINTENANCE_EXPECTED_COOKIE_VALUE;
    const isLoginPage = pathname === '/maintenance/login';
    const isDashboardOrSubpath = pathname.startsWith('/maintenance/dashboard');

    // If the user is authenticated
    if (isAuthenticated) {
      // If they are trying to access the login page, redirect to the dashboard
      if (isLoginPage) {
        return NextResponse.redirect(new URL('/maintenance/dashboard', req.url));
      }
      // Otherwise, allow access
      return NextResponse.next();
    }

    // If the user is NOT authenticated
    if (!isAuthenticated) {
      // If they are trying to access a protected route (dashboard or its children), redirect to login
      if (isDashboardOrSubpath) {
        const loginUrl = new URL('/maintenance/login', req.url);
        loginUrl.searchParams.set('from', pathname);
        loginUrl.searchParams.set('error', 'SessionRequired');
        return NextResponse.redirect(loginUrl);
      }
      // If they are on the login page or other public maintenance page, allow access
      return NextResponse.next();
    }
  }

  // Admin portal protection
  if (pathname.startsWith('/admin')) {
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME);
    const isAuthenticatedAdmin = adminCookie?.value === ADMIN_EXPECTED_COOKIE_VALUE;

    if (pathname === '/admin/login') {
      if (isAuthenticatedAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      return NextResponse.next();
    }
    
    if (pathname === '/admin') {
      if (isAuthenticatedAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
    }

    if (!isAuthenticatedAdmin) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      if (!adminCookie) {
        loginUrl.searchParams.set('error', 'SessionExpired');
      } else {
        loginUrl.searchParams.set('error', 'InvalidSession');
      }
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin',
    '/maintenance/:path*',
    '/maintenance',
    '/portal/:path*'
  ],
}; 
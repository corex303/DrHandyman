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

    if (pathname === '/maintenance/login') {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/maintenance/dashboard', req.url));
      }
      return NextResponse.next();
    }
    
    if (pathname === '/maintenance') {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/maintenance/dashboard', req.url));
      }
    }

    if (!isAuthenticated) {
      const loginUrl = new URL('/maintenance/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      if (!maintenanceCookie) {
        loginUrl.searchParams.set('error', 'SessionExpired');
      } else {
        loginUrl.searchParams.set('error', 'InvalidSession');
      }
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
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
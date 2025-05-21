import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { getToken } from 'next-auth/jwt'; // No longer needed for admin if using global password

const MAINTENANCE_COOKIE_NAME = 'maintenance_session';
const MAINTENANCE_EXPECTED_COOKIE_VALUE = 'maintenance_session_active_marker';

const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_EXPECTED_COOKIE_VALUE = 'admin_session_active_marker';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Maintenance portal protection
  if (pathname.startsWith('/maintenance')) {
    const maintenanceCookie = req.cookies.get(MAINTENANCE_COOKIE_NAME);
    const isAuthenticated = maintenanceCookie?.value === MAINTENANCE_EXPECTED_COOKIE_VALUE;

    if (pathname === '/maintenance/login') {
      // If authenticated and trying to access login page, redirect to dashboard
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/maintenance/dashboard', req.url));
      }
      return NextResponse.next(); // Allow access to the login page if not authenticated
    }
    
    // Specific handling for the base /maintenance path
    if (pathname === '/maintenance') {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL('/maintenance/dashboard', req.url));
      }
      // If not authenticated, fall through to the general protection which will redirect to login
    }

    // General protection for other /maintenance/* routes
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
    // If authenticated and not /maintenance/login or /maintenance, allow access
    return NextResponse.next();
  }

  // Admin portal protection
  if (pathname.startsWith('/admin')) {
    const adminCookie = req.cookies.get(ADMIN_COOKIE_NAME);
    const isAuthenticatedAdmin = adminCookie?.value === ADMIN_EXPECTED_COOKIE_VALUE;

    if (pathname === '/admin/login') {
      // If authenticated admin and trying to access admin login page, redirect to admin dashboard
      if (isAuthenticatedAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
      return NextResponse.next(); // Allow access to the admin login page if not authenticated admin
    }
    
    // Specific handling for the base /admin path
    if (pathname === '/admin') {
      if (isAuthenticatedAdmin) {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
       // If not authenticated, fall through to the general protection which will redirect to login
    }

    // General protection for other /admin/* routes
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
    // If authenticated admin and not /admin/login or /admin, allow access
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/admin', // Explicitly match /admin
    '/maintenance/:path*',
    '/maintenance', // Explicitly match /maintenance
  ],
}; 
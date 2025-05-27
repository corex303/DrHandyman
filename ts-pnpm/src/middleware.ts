import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt'; // Import getToken for NextAuth.js session
// import { getToken } from 'next-auth/jwt'; // No longer needed for admin if using global password

const MAINTENANCE_COOKIE_NAME = 'maintenance_session';
const MAINTENANCE_EXPECTED_COOKIE_VALUE = 'maintenance_session_active_marker';

const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_EXPECTED_COOKIE_VALUE = 'admin_session_active_marker';

const IS_PRODUCTION_MW = process.env.NODE_ENV === 'production';
const NEXTAUTH_SESSION_TOKEN_COOKIE_NAME = IS_PRODUCTION_MW ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

// Define a secret for getToken, should be the same as NEXTAUTH_SECRET in .env
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  console.log(`[Middleware] Executing for pathname: ${pathname}`); // Log pathname
  console.log("[Middleware] Value of nextAuthSecret (process.env.NEXTAUTH_SECRET):", nextAuthSecret); // Log the secret

  // Log all cookies visible to the middleware
  const allCookies = req.cookies.getAll();
  console.log("[Middleware] All cookies visible:", allCookies);
  const specificCookie = req.cookies.get(NEXTAUTH_SESSION_TOKEN_COOKIE_NAME);
  console.log(`[Middleware] Specific cookie '${NEXTAUTH_SESSION_TOKEN_COOKIE_NAME}':`, specificCookie);

  // Customer Portal protection (NextAuth.js)
  if (pathname.startsWith('/portal')) {
    const rawToken = await getToken({
      req,
      secret: nextAuthSecret,
      cookieName: NEXTAUTH_SESSION_TOKEN_COOKIE_NAME,
      raw: true // Get the raw JWT string
    });
    console.log("[Middleware] Customer Portal Raw JWT Token:", rawToken);

    const token = await getToken({
      req,
      secret: nextAuthSecret,
      cookieName: NEXTAUTH_SESSION_TOKEN_COOKIE_NAME, 
      // No raw: true here, try to get the decoded token
    });
    console.log("[Middleware] Customer Portal Decoded Token (after raw check):", token);

    if (!token) {
      // Not authenticated, redirect to NextAuth.js sign-in page
      const signInUrl = new URL('/auth/signin', req.url); // Default NextAuth sign-in page
      signInUrl.searchParams.set('callbackUrl', pathname); // Redirect back after login
      return NextResponse.redirect(signInUrl);
    }

    // Check for CUSTOMER role
    if (token.role !== 'CUSTOMER') {
      // Not a customer, redirect to an appropriate page (e.g., homepage or an access denied page)
      console.log("[Middleware] Access denied for non-customer role:", token.role);
      return NextResponse.redirect(new URL('/', req.url)); // Redirect to homepage
    }

    // Authenticated and has CUSTOMER role, allow access
    return NextResponse.next();
  }

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
    '/portal/:path*' // Add matcher for customer portal
  ],
}; 
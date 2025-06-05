import { NextResponse } from 'next/server';
import { NextRequestWithAuth,withAuth } from 'next-auth/middleware';

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(request: NextRequestWithAuth) {
    const { token } = request.nextauth;
    const { pathname } = request.nextUrl;

    // Role type should be inferred from token (defined in src/types/next-auth.d.ts)
    const hasRole = (role: string) => token?.role === role; // Use string for comparison simplicity here

    if (pathname.startsWith('/admin')) {
      if (!token || !hasRole('ADMIN')) {
        // If not an admin, redirect to home or a specific unauthorized page
        // For now, redirecting to home for simplicity
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (pathname.startsWith('/worker')) {
      if (!token || !hasRole('MAINTENANCE')) {
        // If not a maintenance worker, redirect to home or a specific unauthorized page
        // For now, redirecting to home for simplicity
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    // If authenticated and has correct role (or route is not protected by role),
    // allow the request to proceed.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // A token existing means the user is authenticated
    },
    pages: {
      signIn: '/auth/signin', // This is used by default if `authorized` returns false
      // error: '/auth/error', // Optional error page
    },
  }
);

// Matcher specifies which routes the middleware should apply to.
export const config = {
  matcher: [
    '/admin/:path*',
    '/worker/:path*',
    // Add other paths that need authentication but not specific roles, e.g.:
    // '/dashboard/:path*',
    // '/profile',
  ],
}; 
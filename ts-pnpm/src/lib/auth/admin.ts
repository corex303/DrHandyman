import { cookies } from 'next/headers';

const ADMIN_COOKIE_NAME = 'admin_session';
const ADMIN_EXPECTED_COOKIE_VALUE = 'admin_session_active_marker';

/**
 * Verifies the admin session by checking the session cookie.
 * @returns { a: boolean } An object indicating if the admin is authenticated.
 */
export function verifyAdminSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);

  if (sessionCookie && sessionCookie.value === ADMIN_EXPECTED_COOKIE_VALUE) {
    return { isAuthenticated: true };
  }

  return { isAuthenticated: false };
} 
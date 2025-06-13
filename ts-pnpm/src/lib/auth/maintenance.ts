import { cookies } from 'next/headers';

const MAINTENANCE_COOKIE_NAME = 'maintenance_session';
const MAINTENANCE_EXPECTED_COOKIE_VALUE = 'maintenance_session_active_marker';

/**
 * Verifies the maintenance session by checking the session cookie.
 * @returns { a: boolean } An object indicating if the maintenance user is authenticated.
 */
export function verifyMaintenanceSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(MAINTENANCE_COOKIE_NAME);

  if (sessionCookie && sessionCookie.value === MAINTENANCE_EXPECTED_COOKIE_VALUE) {
    return { isAuthenticated: true };
  }

  return { isAuthenticated: false };
} 
// ====================================================================
// Encore - Cookie Utilities
// Simple cookie get/set/delete without external dependencies
// ====================================================================

const COOKIE_PREFIX = 'encore_';

export const COOKIE_KEYS = {
  ACCESS_TOKEN: `${COOKIE_PREFIX}access_token`,
  REFRESH_TOKEN: `${COOKIE_PREFIX}refresh_token`,
} as const;

/**
 * Set a cookie with optional expiry
 */
export function setCookie(
  name: string,
  value: string,
  days: number = 7,
  path: string = '/',
): void {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${path}; SameSite=Lax; Secure`;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const [key, val] = cookie.split('=');
    if (key === name) {
      return decodeURIComponent(val);
    }
  }
  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string, path: string = '/'): void {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; SameSite=Lax; Secure`;
}
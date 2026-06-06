/**
 * Authentication utilities for token-based auth.
 */

export const AUTH_STORAGE_KEY = "isAuthenticated";
export const AUTH_TOKEN_KEY = "access_token";
export const REFRESH_TOKEN_KEY = "refresh_token";
export const USER_EMAIL_KEY = "userEmail";

type AuthTokens = {
  accessToken?: string | null;
  refreshToken?: string | null;
};

function getStoredValue(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}

function setStoredValue(key: string, value: string, remember: boolean): void {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(key, value);
}

function clearStoredValue(key: string): void {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const matches = document.cookie.match(
    new RegExp(
      `(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`,
    ),
  );

  return matches ? decodeURIComponent(matches[1]) : null;
}

export function getAuthToken(): string | null {
  return readCookie(AUTH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return readCookie(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return getStoredValue(AUTH_STORAGE_KEY) === "true";
}

export function setAuthenticated(
  email: string,
  remember = false,
  _tokens?: AuthTokens,
  role?: string,
): void {
  setStoredValue(AUTH_STORAGE_KEY, "true", remember);
  setStoredValue(USER_EMAIL_KEY, email, remember);
  if (role) {
    setStoredValue("userRole", role, remember);
  }
}

export function getUserRole(): string | null {
  return getStoredValue("userRole");
}

export function isSeller(): boolean {
  const role = getUserRole();
  if (role === null || role === undefined) return false;
  const roleStr = String(role).toLowerCase();
  return roleStr === "seller" || roleStr === "2";
}

export function logout(): void {
  [
    AUTH_STORAGE_KEY,
    AUTH_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_EMAIL_KEY,
    "userRole",
  ].forEach(clearStoredValue);
  localStorage.clear();
  sessionStorage.clear();

  if (typeof document !== "undefined") {
    [AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY].forEach((cookieName) => {
      document.cookie = `${cookieName}=; Max-Age=0; path=/`;
      document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`;
    });
  }
}

export function getUserEmail(): string | null {
  return getStoredValue(USER_EMAIL_KEY);
}

/**
 * Get seller ID from auth state
 * In production, this should come from the authentication token/session
 */
export function getSellerId(): string | null {
  // Try to get from localStorage first
  const sellerId = localStorage.getItem("sellerId");
  if (sellerId) return sellerId;

  // Fallback: try to get from sessionStorage
  return sessionStorage.getItem("sellerId");
}

/**
 * Get shop ID from auth state
 * In production, this should come from the authentication token/session
 */
export function getShopId(): string | null {
  // Try to get from localStorage first
  const shopId = localStorage.getItem("shopId");
  if (shopId) return shopId;

  // Fallback: try to get from sessionStorage
  return sessionStorage.getItem("shopId");
}

/**
 * Set seller and shop IDs
 */
export function setSellerInfo(sellerId: string, shopId: string): void {
  localStorage.setItem("sellerId", sellerId);
  localStorage.setItem("shopId", shopId);
}

/**
 * For demo/development: Auto-login if not authenticated
 * Remove this in production!
 */
export function initDemoAuth(): void {
  // Uncomment the line below to enable auto-login for demo
  // if (!isAuthenticated()) {
  //   setAuthenticated('demo@seller.com', false);
  // }
}

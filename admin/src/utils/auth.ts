/**
 * Authentication utilities for demo/development
 */

export const AUTH_STORAGE_KEY = "isAuthenticated";
export const USER_EMAIL_KEY = "userEmail";

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

export function setAuthenticated(email: string, remember = false): void {
  localStorage.setItem(AUTH_STORAGE_KEY, "true");
  localStorage.setItem(USER_EMAIL_KEY, email);
  if (remember) {
    localStorage.setItem("rememberMe", "true");
  }
}

import { authApi } from "../services/api";

export async function logout(): Promise<void> {
  try {
    await authApi.logout();
  } catch (error) {
    console.error("Logout API call failed:", error);
  } finally {
    localStorage.clear();
    sessionStorage.clear();
  }
}

export function getUserEmail(): string | null {
  return localStorage.getItem(USER_EMAIL_KEY);
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

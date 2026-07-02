/**
 * Application Constants
 */

// Video Upload Constants
export const VIDEO_UPLOAD = {
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  ACCEPTED_FORMATS: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  ACCEPTED_EXTENSIONS: [".mp4", ".webm", ".ogg", ".mov"],
  RETRY_DELAYS: [0, 1000, 3000, 5000], // TUS retry delays in ms
} as const;

// Image Upload Constants
export const IMAGE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_FORMATS: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  ACCEPTED_EXTENSIONS: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
} as const;

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  PRODUCTS_PER_PAGE: 12,
  ORDERS_PER_PAGE: 10,
  VIDEOS_PER_PAGE: 12,
  REVIEWS_PER_PAGE: 10,
  NOTIFICATIONS_PER_PAGE: 20,
} as const;

// API Constants
export const API = {
  TIMEOUT: 30000, // 30 seconds
  REFRESH_INTERVAL: 30000, // 30 seconds for polling
  VIDEO_REFRESH_INTERVAL: 5000, // 5 seconds for video processing status
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;

// Video Status
export const VIDEO_STATUS = {
  UPLOADING: "UPLOADING",
  UPLOADED: "UPLOADED",
  PROCESSING: "PROCESSING",
  READY: "READY",
  FAILED: "FAILED",
  DELETED: "DELETED",
} as const;

// Product Status
export const PRODUCT_STATUS = {
  PUBLISHED: "Published",
  INACTIVE: "Inactive",
  OUT_OF_STOCK: "OutOfStock",
  DRAFT: "Draft",
} as const;

// Notification Types
export const NOTIFICATION_TYPE = {
  ORDER: "order",
  REVIEW: "review",
  MESSAGE: "message",
  SYSTEM: "system",
  VIDEO: "video",
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: "MMM dd, yyyy",
  DISPLAY_WITH_TIME: "MMM dd, yyyy HH:mm",
  ISO: "yyyy-MM-dd",
  API: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Currency
export const CURRENCY = {
  CODE: "VND",
  SYMBOL: "₫",
  LOCALE: "vi-VN",
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_DATA: "user_data",
  THEME: "theme",
  SIDEBAR_STATE: "sidebar_state",
} as const;

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  PRODUCTS: "/products",
  PRODUCTS_CREATE: "/products/create",
  ORDERS: "/orders",
  VIDEOS: "/videos",
  REVIEWS: "/reviews",
  NOTIFICATIONS: "/notifications",
  CHAT: "/chat",
  REPORTS: "/reports",
  SHOP: "/shop",
} as const;

// Chart Colors
export const CHART_COLORS = {
  PRIMARY: "#3b82f6",
  SUCCESS: "#10b981",
  WARNING: "#f59e0b",
  DANGER: "#ef4444",
  INFO: "#6366f1",
  PURPLE: "#8b5cf6",
  PINK: "#ec4899",
  TEAL: "#14b8a6",
} as const;

// Export types
export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
export type VideoStatus = (typeof VIDEO_STATUS)[keyof typeof VIDEO_STATUS];
export type ProductStatus =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

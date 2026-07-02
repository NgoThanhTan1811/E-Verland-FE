import type {
  SellerDashboardResponseDto,
  GetAllProductResponseDto,
  GetProductByIdResponseDto,
  CreateProductDto,
  UpdateProductDto,
  GetAllOrderResponseDto,
  GetOrderByIdResponseDto,
  UpdateOrderDto,
  GetAllNotificationResponseDto,
  NotificationItem,
  UpdateNotificationDto,
  UpdateNotificationResponseDto,
  ChatMessage,
  CreateConversationDto,
  GetAllMessagesResponseDto,
  GetAllConversationsResponseDto,
  CreateConversationResponseDto,
  GetAllVideosResponseDto,
  GetVideoByIdResponseDto,
  VideoItem,
  CreateVideoDto,
  GetAllReviewResponseDto,
  CreateReplyDto,
  UpdateReplyDto,
  CreateReportDto,
  GetReportResponseDto,
  ProductQueryParams,
  OrderQueryParams,
  VideoQueryParams,
  ReviewQueryParams,
  MediaItem,
  MediaType,
  BrandQueryParams,
} from "../types";

// Normalize URL by removing trailing slash
const normalizeUrl = (url: string) => url.replace(/\/$/, "");

// Single backend URL for seller, user, and shared modules.
const BACKEND_API_URL = normalizeUrl(
  import.meta.env.VITE_SELLER_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api/",
);
const SELLER_API_URL = BACKEND_API_URL;

// Socket.IO URL (without /api/v1 path since Socket.IO is at root level)
const SOCKET_IO_URL = normalizeUrl(
  import.meta.env.VITE_SOCKET_URL ||
  SELLER_API_URL.replace(/\/api\/v1$/, "") ||
  "http://localhost:8080/api/",
);

// Helper function for API calls to seller endpoint
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers);

  if (!headers.has("Content-Type") && !(options?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${SELLER_API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    // Try to get error details
    const contentType = response.headers.get("content-type");
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

    try {
      if (contentType?.includes("application/json")) {
        const error = await response.json();
        console.error("[API Error] Response:", error);
        errorMessage = error.message || errorMessage;
      } else {
        // Handle text/html responses (redirects, gateway errors, etc.)
        const text = await response.text();
        console.error("[API Error] Non-JSON response:", text.substring(0, 200));
      }
    } catch (parseError) {
      console.error("[API Error] Failed to parse error response:", parseError);
    }

    throw new Error(errorMessage);
  }

  // Parse and validate response
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  return data;
}

// Helper function for API calls to user endpoint (for reports, etc.)
async function userApiCall<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);

  if (!headers.has("Content-Type") && !(options?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "API request failed");
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}


const ORDER_INT_MAP: Record<number, string> = {
  0: "PENDING", 1: "CONFIRMED", 2: "SHIPPING", 3: "CANCELLED", 4: "COMPLETED",
};
const ORDER_STR_MAP: Record<string, string> = {
  Pending: "PENDING", Confirmed: "CONFIRMED", Shipping: "SHIPPING",
  Canceled: "CANCELLED", Cancelled: "CANCELLED", Completed: "COMPLETED",
  PENDING: "PENDING", CONFIRMED: "CONFIRMED", SHIPPING: "SHIPPING",
  CANCELLED: "CANCELLED", COMPLETED: "COMPLETED",
};
export const ORDER_STATUS_MAP: Record<string | number, string> = { ...ORDER_INT_MAP, ...ORDER_STR_MAP } as any;

export const ORDER_STATUS_TO_INT: Record<string, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPING: 2,
  CANCELLED: 3,
  COMPLETED: 4,
};

const PAYMENT_INT_MAP: Record<number, string> = {
  0: "PENDING", 1: "SUCCESS", 2: "FAILED", 3: "REFUNDED",
};
const PAYMENT_STR_MAP: Record<string, string> = {
  Pending: "PENDING", Success: "SUCCESS", Failed: "FAILED", Refunded: "REFUNDED",
  PENDING: "PENDING", SUCCESS: "SUCCESS", FAILED: "FAILED", REFUNDED: "REFUNDED",
};
export const PAYMENT_STATUS_MAP: Record<string | number, string> = { ...PAYMENT_INT_MAP, ...PAYMENT_STR_MAP } as any;

export const PAYMENT_STATUS_TO_INT: Record<string, number> = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
  REFUNDED: 3,
};

const PRODUCT_INT_MAP: Record<number, string> = {
  0: "DRAFT", 1: "ACTIVE", 2: "INACTIVE", 3: "OUT_OF_STOCK",
};
const PRODUCT_STR_MAP: Record<string, string> = {
  Draft: "DRAFT", Published: "ACTIVE", Inactive: "INACTIVE", OutOfStock: "OUT_OF_STOCK",
  DRAFT: "DRAFT", ACTIVE: "ACTIVE", INACTIVE: "INACTIVE", OUT_OF_STOCK: "OUT_OF_STOCK",
};
export const PRODUCT_STATUS_MAP: Record<string | number, string> = { ...PRODUCT_INT_MAP, ...PRODUCT_STR_MAP } as any;

export const PRODUCT_STATUS_TO_INT: Record<string, number> = {
  DRAFT: 0,
  ACTIVE: 1,
  INACTIVE: 2,
  OUT_OF_STOCK: 3,
};

// ============================================================================
// Dashboard API
// ============================================================================

export const dashboardApi = {
  getDashboard: async (): Promise<SellerDashboardResponseDto> => {
    return apiCall<SellerDashboardResponseDto>("/dashboard/seller");
  },

  // getRevenueTrends: async (): Promise<{ date: string; revenue: number }[]> => {
  //   return apiCall<{ date: string; revenue: number }[]>(
  //     "/dashboard/revenue-trends",
  //   );
  // },

  // getOrderStats: async (): Promise<
  //   { status: string; count: number; color: string }[]
  // > => {
  //   return apiCall<{ status: string; count: number; color: string }[]>(
  //     "/dashboard/order-stats",
  //   );
  // },

  // getUnreadCounts: async (): Promise<{
  //   notifications: number;
  //   messages: number;
  // }> => {
  //   return apiCall<{ notifications: number; messages: number }>(
  //     "/dashboard/unread-counts",
  //   );
  // },
};

// ============================================================================
// Brand API
// ============================================================================

export const brandApi = {
  search: async (params?: BrandQueryParams): Promise<any> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<any>(
      `/brand/search/brand${queryString ? `?${queryString}` : ""}`,
    );
  },

  getById: async (id: string): Promise<any> => {
    return apiCall<any>(`/brand/${id}`);
  },

  create: async (data: { name: string }): Promise<any> => {
    return apiCall<any>("/brand", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: { name: string }): Promise<any> => {
    return apiCall<any>(`/brand/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/brand/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Category API
// ============================================================================

export const categoryApi = {
  getAll: async (): Promise<any> => {
    return apiCall<any>("/category");
  },

  getById: async (id: string): Promise<any> => {
    return apiCall<any>(`/category/${id}`);
  },

  create: async (data: {
    name: string;
    parentCategoryId?: string | null;
  }): Promise<any> => {
    return apiCall<any>("/category", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: { name: string; parentCategoryId?: string | null },
  ): Promise<any> => {
    return apiCall<any>(`/category/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/category/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Product API
// ============================================================================

function toSlug(str: string): string {
  if (!str) return "";
  let slug = str.toLowerCase();

  slug = slug.replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a");
  slug = slug.replace(/[èéẹẻẽêềếệểễ]/g, "e");
  slug = slug.replace(/[ìíịỉĩ]/g, "i");
  slug = slug.replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o");
  slug = slug.replace(/[ùúụủũưừứựửữ]/g, "u");
  slug = slug.replace(/[ỳýỵỷỹ]/g, "y");
  slug = slug.replace(/đ/g, "d");

  slug = slug.replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  return slug;
}

export const productApi = {
  getAll: async (
    params?: ProductQueryParams,
  ): Promise<GetAllProductResponseDto> => {
    const query = new URLSearchParams();
    if (params?.name) query.set("Keyword", params.name);
    if (params?.brandIds?.[0]) query.set("BrandId", params.brandIds[0]);
    if (params?.categories?.[0]) query.set("CategoryId", params.categories[0]);
    if (params?.status) {
      const intStatus = PRODUCT_STATUS_TO_INT[params.status.toUpperCase()];
      if (intStatus !== undefined) {
        query.set("Status", String(intStatus));
      }
    }
    if (params?.minPrice !== undefined)
      query.set("MinPrice", String(params.minPrice));
    if (params?.maxPrice !== undefined)
      query.set("MaxPrice", String(params.maxPrice));
    if (params?.sortBy) query.set("SortBy", params.sortBy);
    if (params?.page !== undefined) query.set("Page", String(params.page));
    if (params?.limit !== undefined) query.set("Limit", String(params.limit));

    const response = await apiCall<any>(
      `/product/admin/search${query.toString() ? `?${query.toString()}` : ""}`,
    );

    if (Array.isArray(response)) {
      return response.map((p: any) => ({
        ...p,
        status: PRODUCT_STATUS_MAP[p.status] || p.status || "ACTIVE",
      })) as any;
    }

    const payload = response?.data || response;
    const productsList = payload?.products || payload?.items || payload?.data || [];
    const normalizedProducts = (Array.isArray(productsList) ? productsList : []).map((p: any) => ({
      ...p,
      status: PRODUCT_STATUS_MAP[p.status] || p.status || "ACTIVE",
    }));

    if (payload?.products) payload.products = normalizedProducts;
    else if (payload?.items) payload.items = normalizedProducts;
    else if (payload?.data) payload.data = normalizedProducts;

    return response;
  },

  getById: async (id: string): Promise<GetProductByIdResponseDto> => {
    const response = await apiCall<any>(`/product/${id}`);
    const product = response?.data || response;
    if (product) {
      product.status = PRODUCT_STATUS_MAP[product.status] || product.status || "ACTIVE";
    }
    return response;
  },

  create: async (
    data: CreateProductDto,
  ): Promise<GetProductByIdResponseDto> => {
    const attributes = Array.isArray(data.attributes)
      ? Object.fromEntries(
        data.attributes
          .filter((attribute) => attribute?.name)
          .map((attribute) => [attribute.name, attribute.value || ""]),
      )
      : data.attributes;

    const variants = Array.isArray(data.variants)
      ? data.variants.map((variant) => ({
        key: variant.value,
        values: variant.options || [],
      }))
      : [];

    const statusVal = typeof data.status === "string" ? PRODUCT_STATUS_TO_INT[data.status.toUpperCase()] ?? data.status : data.status;

    return apiCall<GetProductByIdResponseDto>("/product", {
      method: "POST",
      body: JSON.stringify({
        name: data.name,
        slug: toSlug(data.name || ""),
        description: data.description,
        basePrice: data.basePrice,
        virtualPrice: data.virtualPrice,
        stock: data.stock ?? (data.skus?.reduce((sum, sku) => sum + (sku.stock || 0), 0) || 0),
        imageUrls: data.images || [],
        attributes,
        brandId: data.brandId || null,
        categoryIds: data.categories || [],
        status: statusVal,
        variants,
      }),
    });
  },

  update: async (
    data: UpdateProductDto,
  ): Promise<GetProductByIdResponseDto> => {
    const attributes = Array.isArray(data.attributes)
      ? Object.fromEntries(
        data.attributes
          .filter((attribute) => attribute?.name)
          .map((attribute) => [attribute.name, attribute.value || ""]),
      )
      : data.attributes;

    const variants = Array.isArray(data.variants)
      ? data.variants.map((variant) => ({
        key: variant.value,
        values: variant.options || [],
      }))
      : [];

    const statusVal = typeof data.status === "string" ? PRODUCT_STATUS_TO_INT[data.status.toUpperCase()] ?? data.status : data.status;

    return apiCall<GetProductByIdResponseDto>(`/product/${data.id}`, {
      method: "PUT",
      body: JSON.stringify({
        name: data.name,
        slug: toSlug(data.name || ""),
        description: data.description,
        basePrice: data.basePrice,
        virtualPrice: data.virtualPrice,
        imageUrls: data.images || [],
        attributes,
        brandId: data.brandId || null,
        categoryIds: data.categories || [],
        status: statusVal,
        variants,
        stock: data.stock,
      }),
    });
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/product/${id}`, {
      method: "DELETE",
    });
  },

  updateStatus: async (id: string, status: string | number): Promise<any> => {
    const statusVal = typeof status === "string" ? PRODUCT_STATUS_TO_INT[status.toUpperCase()] ?? status : status;
    return apiCall<any>(`/product/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: statusVal }),
    });
  },
};

// ============================================================================
// SKU API
// ============================================================================

export const skuApi = {
  createSku: async (data: any): Promise<any> => {
    return apiCall<any>("/sku", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateSku: async (id: string, data: any): Promise<any> => {
    return apiCall<any>(`/sku/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteSku: async (id: string): Promise<any> => {
    return apiCall<any>(`/sku/${id}`, {
      method: "DELETE",
    });
  },

  addSkusToProduct: async (productId: string, data: { variants: any[], stock: number }): Promise<any> => {
    return apiCall<any>(`/sku/products/${productId}/skus`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// Order API
// ============================================================================

export const orderApi = {
  getAll: async (
    params?: OrderQueryParams,
  ): Promise<GetAllOrderResponseDto> => {
    const queryParams: Record<string, string> = {};

    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.limit !== undefined) queryParams.limit = String(params.limit);

    if (params?.status) {
      const intStatus = ORDER_STATUS_TO_INT[params.status.toUpperCase()];
      if (intStatus !== undefined) {
        queryParams.status = String(intStatus);
      }
    }

    if (params?.paymentStatus) {
      const intPayment = PAYMENT_STATUS_TO_INT[(params.paymentStatus as string).toUpperCase()];
      if (intPayment !== undefined) {
        queryParams.paymentStatus = String(intPayment);
      }
    }

    if (params?.fromDate) queryParams.fromDate = params.fromDate;
    if (params?.toDate) queryParams.toDate = params.toDate;

    const queryString = new URLSearchParams(queryParams).toString();

    // Backend returns Shared_PageResult directly (not wrapped in data)
    const response = await apiCall<any>(
      `/order${queryString ? `?${queryString}` : ""}`,
    );

    // Normalize: backend PageResult has { items, totalItems, page, limit, totalPages }
    // But it might also be wrapped in { data: { items: [...] } }
    const payload = response?.data || response;
    const ordersList: any[] = payload?.items || payload?.orders || payload?.data || [];

    const normalizeOrder = (o: any) => ({
      ...o,
      status: ORDER_STATUS_MAP[o.status] || o.status || "PENDING",
      paymentStatus: PAYMENT_STATUS_MAP[o.paymentStatus] || o.paymentStatus,
      // Friendly display fields
      grandTotal: o.grandTotal ?? o.totalPrice ?? 0,
    });

    if (Array.isArray(response)) {
      return {
        items: response.map(normalizeOrder),
        totalItems: response.length,
        page: 1,
        limit: response.length,
        totalPages: 1,
      };
    }

    const normalized = (Array.isArray(ordersList) ? ordersList : []).map(normalizeOrder);

    return {
      items: normalized,
      totalItems: payload?.totalItems ?? normalized.length,
      page: payload?.page ?? 1,
      limit: payload?.limit ?? 10,
      totalPages: payload?.totalPages ?? 1,
    };
  },

  getById: async (orderId: string): Promise<GetOrderByIdResponseDto> => {
    const response = await apiCall<any>(`/order/${orderId}`);
    const order: any = response?.data || response;
    if (order) {
      order.status = ORDER_STATUS_MAP[order.status] || order.status || "PENDING";
      order.paymentStatus = PAYMENT_STATUS_MAP[order.paymentStatus] || order.paymentStatus;
      // Flatten receiver
      if (order.receiver) {
        order.receiverName = order.receiver.name ?? order.receiverName;
        order.receiverPhone = order.receiver.phone ?? order.receiverPhone;
        order.receiverAddress = order.receiver.address ?? order.receiverAddress;
      }
      // Alias items -> itemsSnapshot
      if (order.items && !order.itemsSnapshot) {
        order.itemsSnapshot = order.items.map((item: any) => ({
          ...item,
          price: item.unitPrice ?? item.price ?? 0,
        }));
      }
    }
    return response?.data ? response : { data: order };
  },

  update: async (data: UpdateOrderDto): Promise<GetOrderByIdResponseDto> => {
    const statusVal =
      typeof data.status === "string"
        ? ORDER_STATUS_TO_INT[data.status.toUpperCase()] ?? data.status
        : data.status;
    // Seller PATCH /order/{id} - body only has { status: integer }
    return apiCall<GetOrderByIdResponseDto>(`/order/${data.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: statusVal }),
    });
  },

  delete: async (orderId: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/order/${orderId}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Notification API
// ============================================================================

export const notificationApi = {
  // NOTE: There is no generic GET /notification endpoint in the backend.
  // Use getUserNotifications(userId) when userId is available.
  getAll: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<GetAllNotificationResponseDto> => {
    if (params?.userId) {
      const qs = new URLSearchParams(
        Object.entries({ take: params.limit || 50 })
          .filter(([_, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString();
      return apiCall<GetAllNotificationResponseDto>(
        `/notification/user/${encodeURIComponent(params.userId)}${qs ? `?${qs}` : ""}`,
      );
    }
    // No userId: return empty result to avoid 404
    return { data: { page: 1, limit: 50, totalItems: 0, totalPages: 0, notifications: [] } } as any;
  },

  update: async (
    data: UpdateNotificationDto,
  ): Promise<UpdateNotificationResponseDto> => {
    // If caller intends to mark a single notification as read, backend exposes
    // POST /notification/{notificationId}/mark-as-read
    if (data?.id && data?.isRead === true) {
      return apiCall<UpdateNotificationResponseDto>(
        `/notification/${data.id}/mark-as-read`,
        {
          method: "POST",
        },
      );
    }

    // Fallback to generic update
    return apiCall<UpdateNotificationResponseDto>("/notification", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/notification/${id}`, {
      method: "DELETE",
    });
  },

  // SSE connection for real-time notifications
  // Accept optional userId to match backend `/notification/subscribe?userId=`
  subscribeSSE: (
    onMessage: (notification: NotificationItem) => void,
    userId?: string,
  ) => {
    const directUrl = userId
      ? `${BACKEND_API_URL}/notification/subscribe?userId=${encodeURIComponent(
        userId,
      )}`
      : `${BACKEND_API_URL}/notification/subscribe`;

    const proxyUrl = userId
      ? `/api/notification/subscribe?userId=${encodeURIComponent(userId)}`
      : `/api/notification/subscribe`;

    let eventSource: EventSource | null = null;
    let hasRetriedViaProxy = false;
    let isConnected = false;

    const attachHandlers = (source: EventSource) => {
      source.onopen = () => {
        isConnected = true;
      };

      source.onmessage = (event) => {
        try {
          if (!event.data || event.data.includes("keep-alive")) return;
          const notification = JSON.parse(event.data);
          onMessage(notification);
        } catch (e) {
          // Ignore parse errors from keep-alive or malformed data
        }
      };

      source.onerror = (e) => {
        console.error("SSE connection error:", e);

        // If the direct backend SSE fails before connecting, try the same-origin proxy path.
        if (!isConnected && !hasRetriedViaProxy && eventSource === source) {
          hasRetriedViaProxy = true;
          source.close();
          eventSource = new EventSource(proxyUrl, {
            withCredentials: true,
          } as any);
          attachHandlers(eventSource);
        }
      };
    };

    eventSource = new EventSource(directUrl, { withCredentials: true } as any);
    attachHandlers(eventSource);

    return eventSource;
  },

  // Get unread notifications for a user
  getUnread: async (userId: string): Promise<GetAllNotificationResponseDto> => {
    return apiCall<GetAllNotificationResponseDto>(
      `/notification/unread?userId=${encodeURIComponent(userId)}`,
    );
  },

  // Get paginated notifications for a specific user
  getUserNotifications: async (
    userId: string,
    params?: { take?: number; limit?: number },
  ): Promise<GetAllNotificationResponseDto> => {
    const qs = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<GetAllNotificationResponseDto>(
      `/notification/user/${encodeURIComponent(userId)}${qs ? `?${qs}` : ""}`,
    );
  },
};

// ============================================================================
// Media API
// ============================================================================

export const mediaApi = {
  upload: async (data: {
    file?: File;
    files?: File[];
    resourceType?: string;
    objectId?: string;
    contentType?: string;
    mediaType?: MediaType;
  }): Promise<MediaItem | any> => {
    const formData = new FormData();
    if (data.files && data.files.length > 0) {
      data.files.forEach((f) => formData.append("Files", f));
    } else if (data.file) {
      formData.append("Files", data.file);
    }
    
    if (data.resourceType) formData.append("ResourceType", data.resourceType);
    if (data.mediaType !== undefined) {
      formData.append("MediaType", String(data.mediaType));
    }

    return apiCall<MediaItem | any>("/media/upload", {
      method: "POST",
      body: formData,
    });
  },

  generatePresignedUploadUrl: async (data: {
    resourceType?: string;
    objectId?: string;
    fileName?: string;
    contentType?: string;
    mediaType?: MediaType;
  }): Promise<any> => {
    return apiCall<any>("/media/presigned-upload", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getUrlById: async (id: string, size?: string): Promise<any> => {
    const query = size ? `?size=${encodeURIComponent(size)}` : "";
    return apiCall<any>(`/media/${id}/url${query}`);
  },

  getUrlByPath: async (path: string, size?: string): Promise<any> => {
    const query = new URLSearchParams();
    query.set("path", path);
    if (size) query.set("size", size);
    return apiCall<any>(`/media/url?${query.toString()}`);
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/media/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Profile / Account / Bank Account API
// ============================================================================

export const profileApi = {
  getMe: async (): Promise<any> => {
    return apiCall<any>("/account/me");
  },

  createProfile: async (accountId: string, data: any): Promise<any> => {
    return apiCall<any>(`/profile?accountId=${encodeURIComponent(accountId)}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateProfile: async (accountId: string, data: any): Promise<any> => {
    return apiCall<any>(`/profile/${accountId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  getAddresses: async (profileId: string): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/address`);
  },

  getDefaultAddress: async (profileId: string): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/address/default`);
  },

  createAddress: async (profileId: string, data: any): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/address`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateAddress: async (
    profileId: string,
    id: string,
    data: any,
  ): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/address/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  deleteAddress: async (
    profileId: string,
    id: string,
  ): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(
      `/profile/${profileId}/address/${id}`,
      {
        method: "DELETE",
      },
    );
  },
};

export const bankAccountApi = {
  getAll: async (profileId: string): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/bankaccount`);
  },

  getById: async (profileId: string, id: string): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/bankaccount/${id}`);
  },

  create: async (profileId: string, data: any): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/bankaccount`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (profileId: string, id: string, data: any): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/bankaccount/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (
    profileId: string,
    id: string,
  ): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(
      `/profile/${profileId}/bankaccount/${id}`,
      {
        method: "DELETE",
      },
    );
  },
};

// ============================================================================
// Chat API
// ============================================================================

export const chatApi = {
  getMessages: async (params?: {
    conversationId?: string;
    page?: number;
    limit?: number;
  }): Promise<GetAllMessagesResponseDto> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<GetAllMessagesResponseDto>(
      `/chat/messages${queryString ? `?${queryString}` : ""}`,
    );
  },

  getConversations: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<GetAllConversationsResponseDto> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<GetAllConversationsResponseDto>(
      `/chat/conversations${queryString ? `?${queryString}` : ""}`,
    );
  },

  createConversation: async (
    data: CreateConversationDto,
  ): Promise<CreateConversationResponseDto> => {
    return apiCall<CreateConversationResponseDto>("/chat/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  sendMessage: async (
    conversationId: string,
    content: string,
  ): Promise<ChatMessage> => {
    const response = await apiCall<any>("/chat/messages", {
      method: "POST",
      body: JSON.stringify({ conversationId, content, type: "TEXT" }),
    });

    // Validate response structure
    if (!response) {
      throw new Error("Invalid message response: response is null/undefined");
    }

    // Handle wrapped response {data: ChatMessage}
    if (response.data && typeof response.data === "object") {
      return response.data;
    }

    // Handle direct ChatMessage response
    if (response.id && response.conversationId) {
      return response;
    }

    console.error("[sendMessage] Unexpected response shape:", response);
    throw new Error("Invalid message response structure");
  },

  // Socket.IO connection for real-time chat messages
  connectSocketIO: (
    conversationId: string,
    onMessage: (message: ChatMessage) => void,
    onConnect?: () => void,
    onDisconnect?: (reason: string) => void,
  ) => {
    // Dynamically import socket.io-client
    return import("socket.io-client").then(({ io }) => {
      const socketOptions = {
        withCredentials: true,
        transports: ["websocket", "polling"],
        query: {
          conversationId: conversationId,
        },
      };

      // Connect to /message namespace (using SOCKET_IO_URL without /api/v1)
      const socketUrl = `${SOCKET_IO_URL}/message`;
      const socket = io(socketUrl, socketOptions);

      socket.on("connect", () => {
        onConnect?.();
      });

      socket.on("disconnect", (reason) => {
        onDisconnect?.(reason);
      });

      socket.on("connect_error", (error) => {
        console.error("[Chat] Socket.IO connection error:", error);
      });

      // Listen for ANY event to debug what server is sending
      socket.onAny((eventName, ...args) => {
        console.log(`[Chat] 📡 Received event: "${eventName}"`, args);
      });

      // Listen for newMessage event
      socket.on("newMessage", (data: ChatMessage) => {
        onMessage(data);
      });

      // Also try listening to other common event names in case server uses different name
      socket.on("message", (data: any) => {
        console.log(
          "[Chat] ⚠️ 'message' event received (should be 'newMessage'):",
          data,
        );
      });

      socket.on("chat:send", (data: any) => {
        console.log(
          "[Chat] ⚠️ 'chat:send' event received (should be 'newMessage'):",
          data,
        );
      });

      return socket;
    });
  },

  // Send message via Socket.IO
  sendMessageViaSocket: (
    socket: any,
    conversationId: string,
    content: string,
    _onSuccess?: (message: ChatMessage) => void,
    onError?: (error: any) => void,
  ) => {
    if (!socket || !socket.connected) {
      throw new Error("Socket is not connected");
    }

    // Backend reads seller identity from the bearer token in the socket session.
    const message = {
      conversationId,
      content,
      type: "TEXT",
    };

    // Emit message (without ack callback - server may not support it)
    socket.emit("sendMessage", message);

    // Set timeout to detect if server doesn't respond
    const timeoutId = setTimeout(() => {
      console.error(
        "[Chat] ⏰ TIMEOUT: No newMessage event received after 5 seconds",
      );
      console.error("[Chat] 🔍 Possible issues:");
      console.error("  - Server not emitting 'newMessage' event");
      console.error("  - Client not in correct room");
      console.error("  - Event name mismatch");
      onError?.(new Error("Timeout waiting for message confirmation"));
    }, 5000);

    // Success will be handled by newMessage listener
    // Store timeout ID to clear it when message arrives
    (socket as any)._messageTimeoutId = timeoutId;
  },
};

// ============================================================================
// Video API
// ============================================================================

export const videoApi = {
  getAll: async (
    params?: VideoQueryParams,
  ): Promise<GetAllVideosResponseDto> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<GetAllVideosResponseDto>(
      `/video${queryString ? `?${queryString}` : ""}`,
    );
  },

  getById: async (id: string): Promise<GetVideoByIdResponseDto> => {
    return apiCall<GetVideoByIdResponseDto>(`/video/${id}`);
  },

  upload: async (
    data: CreateVideoDto,
    onProgress?: (progress: number) => void,
  ): Promise<VideoItem> => {
    // Real API call using TUS protocol for resumable uploads
    const TUS_ENDPOINT = import.meta.env.VITE_UPLOAD_URL;

    if (!TUS_ENDPOINT) {
      throw new Error(
        "TUS endpoint not configured. Please set VITE_UPLOAD_URL in .env file",
      );
    }

    return new Promise((resolve, reject) => {
      // Dynamically import tus-js-client
      import("tus-js-client")
        .then(({ Upload }) => {
          const upload = new Upload(data.file, {
            endpoint: TUS_ENDPOINT,
            metadata: {
              filename: data.file.name,
              filetype: data.file.type,
              title: data.title,
              description: data.description || "",
            },
            onBeforeRequest: function (req) {
              // Get underlying XMLHttpRequest object
              const xhr = req.getUnderlyingObject();
              // Enable credentials to send cookies with request
              xhr.withCredentials = true;
            },
            retryDelays: [0, 1000, 3000, 5000],
            onProgress: (uploaded, total) => {
              const progress = Math.floor((uploaded / total) * 100);
              onProgress?.(progress);
            },
            onSuccess: () => {
              // Create response object matching GetAllVideoResponseDto
              const videoResponse: VideoItem = {
                id: `video-${Date.now()}`,
                title: data.title,
                description: data.description,
                url: upload.url || "",
                thumbnailUrl: "",
                duration: 0,
                status: "UPLOADED",
                uploadedBy: "current-seller",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };

              console.log("Upload done!", upload.url);
              resolve(videoResponse);
            },
            onError: (error) => {
              console.error("Upload error:", error);
              reject(new Error(error.message || "Upload failed"));
            },
          });

          upload.start();
        })
        .catch((error) => {
          console.error("Failed to load tus-js-client:", error);
          reject(new Error("Failed to initialize upload client"));
        });
    });
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/video/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Review API
// ============================================================================

export const reviewApi = {
  getAll: async (
    params?: ReviewQueryParams,
  ): Promise<GetAllReviewResponseDto> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<GetAllReviewResponseDto>(
      `/review${queryString ? `?${queryString}` : ""}`,
    );
  },

  createReply: async (
    data: CreateReplyDto,
  ): Promise<GetAllReviewResponseDto> => {
    return apiCall<GetAllReviewResponseDto>("/reply", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateReply: async (
    data: UpdateReplyDto,
  ): Promise<GetAllReviewResponseDto> => {
    return apiCall<GetAllReviewResponseDto>("/reply", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  deleteReply: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/reply/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Report API (uses USER API endpoint)
// ============================================================================

export const reportApi = {
  create: async (data: CreateReportDto): Promise<GetReportResponseDto> => {
    return userApiCall<GetReportResponseDto>("/report", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// Auth API (uses USER API endpoint)
// ============================================================================

export const authApi = {
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return userApiCall<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};


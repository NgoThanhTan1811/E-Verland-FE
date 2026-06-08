import type {
  DashboardResponseDto,
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
  GetProvincesResponseDto,
  GetDistrictsResponseDto,
  GetWardsResponseDto,
  GetAllCategoriesResponseDto,
  GetCategoryByIdResponseDto,
  GetAllBrandsResponseDto,
  GetBrandByIdResponseDto,
} from "../types";

// Normalize URL by removing trailing slash
const normalizeUrl = (url: string) => url.replace(/\/$/, "");

// Get API URLs from environment variables
const ADMIN_API_URL = normalizeUrl(
  import.meta.env.VITE_ADMIN_URL || "http://localhost:8080/api",
);

// Socket.IO URL (without /api path since Socket.IO is at root level)
const SOCKET_IO_URL = normalizeUrl(
  import.meta.env.VITE_SOCKET_URL ||
    ADMIN_API_URL.replace(/\/api$/, "") ||
    "http://localhost:8080",
);

// Helper function for API calls to seller endpoint
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${ADMIN_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include", // Include cookies for auth
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }

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
  const response = await fetch(`${ADMIN_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/login";
      throw new Error("Session expired. Please log in again.");
    }

    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "API request failed");
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

// ============================================================================
// Dashboard API
// ============================================================================

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardResponseDto> => {
    return apiCall<DashboardResponseDto>("/dashboard/admin");
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
// Product API
// ============================================================================

export const productApi = {
  getAll: async (
    params?: ProductQueryParams,
  ): Promise<GetAllProductResponseDto> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<GetAllProductResponseDto>(
      `/product/admin/search${queryString ? `?${queryString}` : ""}`,
    );
  },

  getById: async (id: string): Promise<GetProductByIdResponseDto> => {
    return apiCall<GetProductByIdResponseDto>(`/product/${id}`);
  },

  create: async (
    data: CreateProductDto,
  ): Promise<GetProductByIdResponseDto> => {
    return apiCall<GetProductByIdResponseDto>("/product", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (
    data: UpdateProductDto,
  ): Promise<GetProductByIdResponseDto> => {
    return apiCall<GetProductByIdResponseDto>("/product", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string, reason: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/admin/products/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ reason }),
    });
  },

  hide: async (id: string, reason: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/admin/products/${id}/hide`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    });
  },

  changeStatus: async (id: string, status: string): Promise<any> => {
    return apiCall<any>(`/product/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  restore: async (id: string, reason: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/admin/products/${id}/restore`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
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
    const queryParams: any = { ...params };
    if (queryParams.startDate) {
      queryParams.fromDate = queryParams.startDate;
      delete queryParams.startDate;
    }
    if (queryParams.endDate) {
      queryParams.toDate = queryParams.endDate;
      delete queryParams.endDate;
    }

    const queryString = new URLSearchParams(
      Object.entries(queryParams)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<GetAllOrderResponseDto>(
      `/order/admin/order${queryString ? `?${queryString}` : ""}`,
    );
  },

  getById: async (orderId: string): Promise<GetOrderByIdResponseDto> => {
    return apiCall<GetOrderByIdResponseDto>(`/order/${orderId}`);
  },

  update: async (data: UpdateOrderDto): Promise<GetOrderByIdResponseDto> => {
    return apiCall<GetOrderByIdResponseDto>(`/order/admin/${data.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: data.status }),
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
  getAll: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<GetAllNotificationResponseDto> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<GetAllNotificationResponseDto>(
      `/notification${queryString ? `?${queryString}` : ""}`,
    );
  },

  update: async (
    data: UpdateNotificationDto,
  ): Promise<UpdateNotificationResponseDto> => {
    return apiCall<UpdateNotificationResponseDto>("/notification", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  send: async (data: any): Promise<any> => {
    return apiCall<any>("/notification/send", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  broadcast: async (data: any): Promise<any> => {
    return apiCall<any>("/notification/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getConnectedUsers: async (): Promise<any> => {
    return apiCall<any>("/notification/connected-users", {
      method: "GET",
    });
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/notification/${id}`, {
      method: "DELETE",
    });
  },

  // SSE connection for real-time notifications
  subscribeSSE: (onMessage: (notification: NotificationItem) => void) => {
    const eventSource = new EventSource(
      `${ADMIN_API_URL}/notification/sse?stream=true`,
      {
        withCredentials: true,
      },
    );

    eventSource.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      onMessage(notification);
    };

    return eventSource;
  },
};

// ============================================================================
// Chat API
// ============================================================================

export const chatApi = {
  getMessages: async (params: {
    conversationId: string;
    page?: number;
    limit?: number;
  }): Promise<GetAllMessagesResponseDto> => {
    // Build query string with correct order: page, limit, conversationId
    const searchParams = new URLSearchParams();
    if (params.page !== undefined) {
      searchParams.append("page", String(params.page));
    }
    if (params.limit !== undefined) {
      searchParams.append("limit", String(params.limit));
    }
    searchParams.append("conversationId", params.conversationId);

    const queryString = searchParams.toString();

    return apiCall<GetAllMessagesResponseDto>(`/chat/message?${queryString}`);
  },

  getConversations: async (
    userId: string,
    params?: {
      page?: number;
      limit?: number;
    }
  ): Promise<GetAllConversationsResponseDto> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<GetAllConversationsResponseDto>(
      `/chat/conversations/user/${userId}${queryString ? `?${queryString}` : ""}`,
    );
  },

  createConversation: async (
    data: CreateConversationDto,
  ): Promise<CreateConversationResponseDto> => {
    return apiCall<CreateConversationResponseDto>("/chat/conversation", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  sendMessage: async (
    conversationId: string,
    content: string,
  ): Promise<ChatMessage> => {
    const response = await apiCall<any>("/chat/message", {
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
      const socketOptions: any = {
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
    onSuccess?: (message: ChatMessage) => void,
    onError?: (error: any) => void,
  ) => {
    if (!socket || !socket.connected) {
      throw new Error("Socket is not connected");
    }

    // Backend extracts seller info from cookie (withCredentials: true)
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

    // Helper to clear timeout when message is confirmed
    (socket as any)._clearMessageTimeout = () => {
      if ((socket as any)._messageTimeoutId) {
        clearTimeout((socket as any)._messageTimeoutId);
        (socket as any)._messageTimeoutId = null;
      }
    };
  },
};

// ============================================================================
// Video API
// ============================================================================

export const mediaApi = {
  upload: async (data: any): Promise<any> => {
    const formData = new FormData();
    formData.append("resourceType", data.resourceType);
    formData.append("objectId", data.objectId);
    if (data.contentType) formData.append("contentType", data.contentType);
    formData.append("mediaType", data.mediaType.toString());
    formData.append("file", data.file);

    const url = ADMIN_API_URL;
    const response = await fetch(`${url}/media/upload`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    
    if (!response.ok) {
        throw new Error("Upload failed");
    }
    return response.json();
  },

  generatePresignedUploadUrl: async (data: any): Promise<any> => {
    return apiCall<any>("/media/presigned-upload", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getUrlById: async (id: string): Promise<any> => {
    return apiCall<any>(`/media/${id}/url`);
  },

  getUrlByPath: async (data: any): Promise<any> => {
    const queryString = new URLSearchParams(data).toString();
    return apiCall<any>(`/media/url?${queryString}`);
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/media/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// User API
// ============================================================================

export const userApi = {
  getAll: async (params?: any): Promise<any> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<any>(
      `/account${queryString ? `?${queryString}` : ""}`,
    );
  },

  getById: async (id: string): Promise<any> => {
    return apiCall<any>(`/account/${id}`);
  },

  create: async (data: any): Promise<any> => {
    return apiCall<any>("/account", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any): Promise<any> => {
    return apiCall<any>(`/account/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/account/${id}`, {
      method: "DELETE",
    });
  },

  getByUsername: async (username: string): Promise<any> => {
    return apiCall<any>(`/account/username/${encodeURIComponent(username)}`);
  },

  getByEmail: async (email: string): Promise<any> => {
    return apiCall<any>(`/account/email/${encodeURIComponent(email)}`);
  },

  resolveUserId: async (input: string): Promise<string> => {
    const query = input.trim();
    if (!query) throw new Error("Empty user identifier");

    const getIdFromAcc = (acc: any) => {
      if (!acc) return null;
      if (acc.id) return acc.id;
      if (acc.Id) return acc.Id;
      if (acc.data?.id) return acc.data.id;
      if (acc.data?.Id) return acc.data.Id;
      return null;
    };

    if (query.includes("@")) {
      try {
        const acc = await userApi.getByEmail(query);
        const id = getIdFromAcc(acc);
        if (id) return id;
        throw new Error("Missing ID in response: " + JSON.stringify(acc).substring(0, 50));
      } catch (e: any) {
        throw new Error(`User not found by email: ${e.message}`);
      }
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query)) {
      try {
        const acc = await userApi.getByUsername(query);
        const id = getIdFromAcc(acc);
        if (id) return id;
        throw new Error("Missing ID in response: " + JSON.stringify(acc).substring(0, 50));
      } catch (e: any) {
        throw new Error(`User not found by username: ${e.message}`);
      }
    }

    return query;
  },
};

export const profileApi = {
  getByAccount: async (accountId: string): Promise<any> => {
    return apiCall<any>(`/profile/account/${accountId}`);
  },
  create: async (accountId: string, data: any): Promise<any> => {
    return apiCall<any>(`/profile?accountId=${accountId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (accountId: string, data: any): Promise<any> => {
    return apiCall<any>(`/profile/${accountId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
};

export const addressApi = {
  getByProfile: async (profileId: string): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/address`);
  },
  create: async (profileId: string, data: any): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/address`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  update: async (profileId: string, id: string, data: any): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/address/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },
  delete: async (profileId: string, id: string): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/address/${id}`, {
      method: "DELETE",
    });
  },
};

export const bankApi = {
  getByProfile: async (profileId: string): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/bankaccount`);
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
  delete: async (profileId: string, id: string): Promise<any> => {
    return apiCall<any>(`/profile/${profileId}/bankaccount/${id}`, {
      method: "DELETE",
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
  
  logout: async (): Promise<any> => {
    return userApiCall<any>("/auth/logout", {
      method: "POST",
    });
  },
};

// ============================================================================
// Location API (uses USER API endpoint)
// ============================================================================

export const locationApi = {
  getProvinces: async (): Promise<GetProvincesResponseDto> => {
    return userApiCall<GetProvincesResponseDto>("/location/provinces");
  },

  getDistricts: async (
    provinceId: number,
  ): Promise<GetDistrictsResponseDto> => {
    return userApiCall<GetDistrictsResponseDto>(
      `/location/districts/${provinceId}`,
    );
  },

  getWards: async (districtId: number): Promise<GetWardsResponseDto> => {
    return userApiCall<GetWardsResponseDto>(`/location/wards/${districtId}`);
  },
};

// ============================================================================
// Category API (uses USER API endpoint)
// ============================================================================

export const categoryApi = {
  getAll: async (params?: {
    parentCategoryId?: string;
  }): Promise<GetAllCategoriesResponseDto> => {
    const queryParams = new URLSearchParams();
    if (params?.parentCategoryId) {
      queryParams.append("parentCategoryId", params.parentCategoryId);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/category?${queryString}` : "/category";

    return userApiCall<GetAllCategoriesResponseDto>(endpoint);
  },

  getById: async (id: string): Promise<GetCategoryByIdResponseDto> => {
    return userApiCall<GetCategoryByIdResponseDto>(`/category/${id}`);
  },

  create: async (data: any): Promise<any> => {
    return userApiCall<any>("/category", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any): Promise<any> => {
    return userApiCall<any>(`/category/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<any> => {
    return userApiCall<any>(`/category/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Brand API (uses USER API endpoint)
// ============================================================================

export const brandApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<GetAllBrandsResponseDto> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/brand/search/brand?${queryString}` : "/brand/search/brand";

    return userApiCall<GetAllBrandsResponseDto>(endpoint);
  },

  getById: async (id: string): Promise<GetBrandByIdResponseDto> => {
    return userApiCall<GetBrandByIdResponseDto>(`/brand/${id}`);
  },

  create: async (data: any): Promise<any> => {
    return userApiCall<any>("/brand", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any): Promise<any> => {
    return userApiCall<any>(`/brand/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<any> => {
    return userApiCall<any>(`/brand/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================================================
// Sku API
// ============================================================================

export const skuApi = {
  create: async (data: any): Promise<any> => {
    return apiCall<any>("/sku", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  
  update: async (id: string, data: any): Promise<any> => {
    return apiCall<any>(`/sku/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  
  addSkusToProduct: async (productId: string, variants: any[], stock: number): Promise<any> => {
    return apiCall<any>(`/sku/products/${productId}/skus`, {
      method: "POST",
      body: JSON.stringify({ variants, stock }),
    });
  },
  
  delete: async (id: string): Promise<any> => {
    return apiCall<any>(`/sku/${id}`, {
      method: "DELETE",
    });
  },
  
  getById: async (id: string): Promise<any> => {
    return apiCall<any>(`/sku/${id}`);
  },
  
  getAll: async (params?: any): Promise<any> => {
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<any>(
      `/sku/admin/search${queryString ? `?${queryString}` : ""}`,
    );
  },
};

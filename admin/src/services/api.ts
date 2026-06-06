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
const SELLER_API_URL = normalizeUrl(
  import.meta.env.VITE_SELLER_URL || "http://localhost:3000/api/v1",
);
const USER_API_URL = normalizeUrl(
  import.meta.env.VITE_USER_URL || "http://localhost:3000/api/v1",
);

// Socket.IO URL (without /api/v1 path since Socket.IO is at root level)
const SOCKET_IO_URL = normalizeUrl(
  import.meta.env.VITE_SOCKET_URL ||
    SELLER_API_URL.replace(/\/api\/v1$/, "") ||
    "http://localhost:3000",
);

// Helper function to get access token from cookies
function getAccessTokenFromCookies(): string | null {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "accessToken") {
      return value;
    }
  }
  return null;
}

// Helper function for API calls to seller endpoint
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${SELLER_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include", // Include cookies for auth
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
  const response = await fetch(`${USER_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
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

// ============================================================================
// Dashboard API
// ============================================================================

export const dashboardApi = {
  getDashboard: async (): Promise<DashboardResponseDto> => {
    return apiCall<DashboardResponseDto>("/dashboard");
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
      `/product${queryString ? `?${queryString}` : ""}`,
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

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/product/${id}`, {
      method: "DELETE",
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
    const queryString = new URLSearchParams(
      Object.entries(params || {})
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiCall<GetAllOrderResponseDto>(
      `/order${queryString ? `?${queryString}` : ""}`,
    );
  },

  getById: async (orderId: string): Promise<GetOrderByIdResponseDto> => {
    return apiCall<GetOrderByIdResponseDto>(`/order/${orderId}`);
  },

  update: async (data: UpdateOrderDto): Promise<GetOrderByIdResponseDto> => {
    return apiCall<GetOrderByIdResponseDto>("/order", {
      method: "PUT",
      body: JSON.stringify(data),
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

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall<{ success: boolean }>(`/notification/${id}`, {
      method: "DELETE",
    });
  },

  // SSE connection for real-time notifications
  subscribeSSE: (onMessage: (notification: NotificationItem) => void) => {
    const eventSource = new EventSource(
      `${SELLER_API_URL}/notification/sse?stream=true`,
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
      `/chat/conversation${queryString ? `?${queryString}` : ""}`,
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
      // Get access token from cookies for authentication
      const accessToken = getAccessTokenFromCookies();

      const socketOptions: any = {
        withCredentials: true,
        transports: ["websocket", "polling"],
        query: {
          conversationId: conversationId,
        },
      };

      // Add authentication if token is available
      if (
        accessToken &&
        accessToken !== "undefined" &&
        accessToken.trim() !== ""
      ) {
        socketOptions.auth = { token: accessToken };
        socketOptions.extraHeaders = {
          Authorization: `Bearer ${accessToken}`,
        };
      }

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
    const endpoint = queryString ? `/brand?${queryString}` : "/brand";

    return userApiCall<GetAllBrandsResponseDto>(endpoint);
  },

  getById: async (id: string): Promise<GetBrandByIdResponseDto> => {
    return userApiCall<GetBrandByIdResponseDto>(`/brand/${id}`);
  },
};

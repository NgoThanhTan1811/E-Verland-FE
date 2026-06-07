import { apiRequest } from "./api-client";

export interface CreateOrderRequest {
  receiver: {
    name?: string;
    phone?: string;
    address?: string;
  };
  paymentMethod: number;
  voucherCode?: number | null;
  items: Array<{
    productId: string;
    skuId: string;
    quantity: number;
  }>;
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  skuId: string;
  quantity: number;
  price: number;
  productName?: string;
  productImage?: string;
  skuValue?: string;
}

export interface OrderResponse {
  id: string;
  code: string;
  userId: string;
  status: number;
  paymentStatus: number;
  paymentMethod: number;
  totalPrice: number;
  discount: number;
  grandTotal: number;
  receiver?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt?: string;
}

export interface OrderListParams {
  userId: string;
  status?: string;
  paymentStatus?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

export interface OrderListResponse {
  items: OrderResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const orderService = {
  createOrder: (userId: string, data: CreateOrderRequest) =>
    apiRequest<OrderResponse>(`/Order?userId=${userId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getOrders: (params: OrderListParams) => {
    const query = new URLSearchParams({ userId: params.userId });
    if (params.status) query.set("status", params.status);
    if (params.paymentStatus) query.set("paymentStatus", params.paymentStatus);
    if (params.fromDate) query.set("fromDate", params.fromDate);
    if (params.toDate) query.set("toDate", params.toDate);
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    return apiRequest<OrderListResponse>(`/Order?${query.toString()}`);
  },

  getOrder: (id: string) => apiRequest<OrderResponse>(`/Order/${id}`),

  cancelOrder: (id: string, userId: string) =>
    apiRequest<void>(`/Order/${id}?userId=${userId}`, { method: "DELETE" }),
};

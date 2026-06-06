import { apiRequest } from "./api-client";

export interface PaymentOrderItemRequest {
  skuId: string;
  quantity: number;
}

export interface PaymentInitiateRequest {
  orderId: string;
  userId: string;
  amount: number;
  method: number; // 0 = OnlineBanking, 1 = COD (integer enum theo backend)
  items?: PaymentOrderItemRequest[];
}

export interface PaymentInitiateResponse {
  id: string;
  code?: string;
  status: string;
  paymentUrl?: string;
}

export interface PaymentOverviewResponse {
  id: string;
  code?: string;
  orderId: string;
  amount: number;
  method: number;
  status: number;
  createdAt: string;
}

export interface PaymentResponse {
  id: string;
  code?: string;
  orderId: string;
  userId: string;
  amount: number;
  method: number;
  status: number;
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentUpdateStatusRequest {
  status: number;
}

export const paymentService = {
  initiatePayment: (data: PaymentInitiateRequest) =>
    apiRequest<PaymentInitiateResponse>("/payment", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPayment: (id: string) => apiRequest<PaymentResponse>(`/payment/${id}`),

  getPaymentByOrder: (orderId: string) =>
    apiRequest<PaymentResponse>(`/payment/payment-order/${orderId}`),

  getPaymentByCode: (code: string) =>
    apiRequest<PaymentResponse>(`/payment/payment-code/${code}`),

  getPaymentsByUser: (userId: string) =>
    apiRequest<PaymentOverviewResponse[]>(`/payment/payment-user/${userId}`),

  updatePaymentStatus: (id: string, data: PaymentUpdateStatusRequest) =>
    apiRequest<PaymentResponse>(`/payment/payment:${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

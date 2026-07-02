import { apiRequest } from "./api-client";

export interface CalculateShippingFeeRequest {
  toDistrictId: number;
  toWardCode?: string;
  fromDistrictId?: number;
  fromWardCode?: string;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  serviceId?: number;
  serviceTypeId?: number;
  insuranceValue?: number;
}

export interface ShippingFeeResponse {
  total: number;
  serviceFee?: number;
  insuranceFee?: number;
  pickStationFee?: number;
  couponValue?: number;
  r2SFee?: number;
  documentReturn?: number;
  doubleCheck?: number;
  codFee?: number;
  pickRemoteAreasFee?: number;
  deliverRemoteAreasFee?: number;
  codFailedFee?: number;
}

export interface ShippingAddressRequest {
  name?: string;
  phone?: string;
  address?: string;
  districtId: number;
  wardCode?: string;
  wardName?: string;
  districtName?: string;
  provinceName?: string;
}

export interface ShippingDimensionsRequest {
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface ShippingItemRequest {
  name?: string;
  code?: string;
  quantity: number;
  price?: number;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
}

export interface CreateShippingDraftRequest {
  orderId: string;
  userId: string;
  clientOrderCode?: string;
  toAddress: ShippingAddressRequest;
  dimensions: ShippingDimensionsRequest;
  items?: ShippingItemRequest[];
  serviceId?: number;
  serviceTypeId?: number;
  paymentTypeId?: number;
  codAmount?: number;
  insuranceValue?: number;
  note?: string;
  requiredNote?: string;
}

export interface ShippingOrderResponse {
  id: string;
  orderId: string;
  provider?: string;
  providerOrderCode?: string;
  clientOrderCode?: string;
  status: number;
  providerStatus?: string;
  totalFee: number;
  expectedDeliveryTime?: string;
  createdAt: string;
  updatedAt?: string;
}

export const shippingService = {
  calculateFee: (data: CalculateShippingFeeRequest) =>
    apiRequest<ShippingFeeResponse>("/shipping/fee", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createDraft: (data: CreateShippingDraftRequest) =>
    apiRequest<ShippingOrderResponse>("/shipping/draft", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getShippingByOrder: (orderId: string) =>
    apiRequest<ShippingOrderResponse>(`/shipping/order/${orderId}`),

  getShipping: (id: string) =>
    apiRequest<ShippingOrderResponse>(`/shipping/${id}`),

  activate: (orderId: string) =>
    apiRequest<ShippingOrderResponse>(`/shipping/activate/${orderId}`, {
      method: "POST",
    }),

  cancel: (orderId: string) =>
    apiRequest<ShippingOrderResponse>(`/shipping/cancel/${orderId}`, {
      method: "POST",
    }),
};

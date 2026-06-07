import { apiRequest } from "./api-client";

export interface CartItemResponse {
  id: string;
  productId: string;
  skuId: string;
  quantity: number;
  productName: string;
  productImage?: string;
  skuValue: string;
  price: number;
}

export interface CartResponse {
  id: string;
  userId: string;
  items: CartItemResponse[];
}

export interface AddToCartRequest {
  productId: string;
  skuId: string;
  quantity: number;
  productName: string;
  productImage?: string;
  skuValue: string;
}

export const cartService = {
  getCart: (userId: string) => apiRequest<CartResponse>(`/Cart/user/${userId}`),

  addItem: (userId: string, data: AddToCartRequest) =>
    apiRequest<CartItemResponse>(`/Cart/user/${userId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateItem: (cartItemId: string, quantity: number) =>
    apiRequest<CartItemResponse>(`/Cart/items/${cartItemId}`, {
      method: "PUT",
      body: JSON.stringify({ cartItemId, quantity }),
    }),

  removeItem: (cartItemId: string) =>
    apiRequest<void>(`/Cart/items/${cartItemId}`, { method: "DELETE" }),
};

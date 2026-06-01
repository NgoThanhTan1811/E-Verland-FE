// Domain types for E-Verland Customer frontend

export interface User {
  id: string;
  email: string;
  username?: string;
  role?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  gender?: number;
  dateOfBirth?: string;
  bio?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brand?: Brand;
  brandId?: string;
  sellerId?: string;
  sellerName?: string;
  category?: Category;
  categoryId?: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
  stock?: number;
  images: string[];
  skus?: Sku[];
  status?: number;
  isFavorite?: boolean;
}

export interface Sku {
  id: string;
  productId: string;
  skuCode?: string;
  skuValue: string;
  price: number;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  skuId: string;
  quantity: number;
  productName: string;
  productImage?: string;
  skuValue: string;
  price: number;
}

export interface Address {
  id: string;
  profileId: string;
  label: number;
  city?: string;
  province?: string;
  district?: string;
  ward?: string;
  provinceId?: number;
  districtId?: number;
  wardCode?: string;
  street?: string;
  detail?: string;
  isDefault: boolean;
}

export interface BankAccount {
  id: string;
  profileId: string;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Shipping"
  | "Completed"
  | "Canceled";
export type PaymentStatus = "Pending" | "Processing" | "Success" | "Failed";
export type PaymentMethod = "COD" | "OnlineBanking";

export interface Order {
  id: string;
  code: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalPrice: number;
  discount: number;
  grandTotal: number;
  receiver?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  items: OrderItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  skuId: string;
  quantity: number;
  price: number;
  productName?: string;
  productImage?: string;
  skuValue?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: "order" | "promotion" | "system";
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: "customer" | "seller" | "system";
  content: string;
  timestamp: string;
  isRead?: boolean;
}

export interface Conversation {
  id: string;
  customerId: string;
  sellerId: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  messages?: ChatMessage[];
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  order: number;
}

export interface FilterState {
  keyword?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  page: number;
  limit: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Status mapping helpers
export const OrderStatusMap: Record<number, OrderStatus> = {
  0: "Pending",
  1: "Confirmed",
  2: "Shipping",
  3: "Canceled",
  4: "Completed",
};

export const PaymentStatusMap: Record<number, PaymentStatus> = {
  0: "Pending",
  1: "Processing",
  2: "Success",
  3: "Failed",
};

export const PaymentMethodMap: Record<number, PaymentMethod> = {
  0: "OnlineBanking",
  1: "COD",
};

export const AddressLabelMap: Record<number, string> = {
  0: "Nhà riêng",
  1: "Văn phòng",
  2: "Khác",
};

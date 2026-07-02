// Common types for E-Verland Customer

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  stock: number;
  images: string[];
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  isFavorite?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  options: VariantOption[];
}

export interface VariantOption {
  id: string;
  value: string;
  stock: number;
  priceAdjustment?: number;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedVariants: { [key: string]: string };
  price: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  note?: string;
  createdAt: string;
  updatedAt: string;
  timeline: OrderTimeline[];
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  selectedVariants: { [key: string]: string };
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'shipping' 
  | 'completed' 
  | 'canceled';

export type PaymentMethod = 'cod' | 'online_banking' | 'e_wallet';

export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface OrderTimeline {
  status: OrderStatus;
  timestamp: string;
  description: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatar?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'promotion' | 'system';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'customer' | 'admin' | 'system';
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  adminId?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  productCount: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
}

export interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  order: number;
}

export interface FilterOptions {
  categories: string[];
  brands: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
}

export interface SortOption {
  value: string;
  label: string;
}

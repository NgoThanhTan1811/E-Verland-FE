// ============================================================================
// API DTOs - Exact match with backend schemas
// ============================================================================

// Common Types
export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Shipping"
  | "Canceled"
  | "Completed";

export type ProductStatus =
  | "Draft"
  | "Published"
  | "Inactive"
  | "OutOfStock";

export type MediaType = "Image" | "Video";
export type MediaFileStatus = "Pending" | "Confirmed" | "Orphan";
export type MediaResourceType = "Products" | "Avatars" | "Shops" | "Reviews";

// Dashboard DTOs
export interface DashboardData {
  orders: {
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    totalRevenue: number;
  };
  products: {
    totalProducts: number;
  };
  ledger?: {
    platformCash: number;
    customerLiability: number;
    sellerPending: number;
    sellerAvailable: number;
  };
}

export interface DashboardResponseDto {
  data: DashboardData;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

// Product DTOs
export interface ProductVariant {
  value: string;
  options: string[];
}

export interface ProductSku {
  id: string;
  value: string;
  price: number;
  stock: number;
  image: string;
}

export interface CreateProductSku {
  value: string;
  price: number;
  stock: number;
  image: string;
}

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  logo: string;
  level?: number;
  parentCategoryId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Brand DTOs
export interface Brand {
  id: string;
  name: string;
  logo: string;
  soldCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetAllBrandsData {
  brands: Brand[];
  page?: number;
  limit?: number;
  totalItems?: number;
  totalPages?: number;
}

export interface GetAllBrandsResponseDto {
  data: GetAllBrandsData;
}

export interface GetBrandByIdResponseDto {
  data: Brand;
}

// Category DTOs
export interface GetAllCategoriesData {
  categories: ProductCategory[];
}

export interface GetAllCategoriesResponseDto {
  data: GetAllCategoriesData;
}

export interface GetCategoryByIdResponseDto {
  data: ProductCategory;
}

// Product list item (from GetProducts)
export interface ProductListItem {
  id: string;
  name: string;
  basePrice: number;
  virtualPrice: number;
  images: string[];
  status: ProductStatus;
  averageRate: number;
  soldCount: number;
}

export interface GetAllProductsData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  products: ProductListItem[];
}

export interface GetAllProductResponseDto {
  data: GetAllProductsData;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

// Product detail (from GetProductById)
export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  provinceId: number;
  provinceName: string;
  districtId: number;
  districtName: string;
  wardId: number;
  wardName: string;
  brandId?: string;
  brandName?: string;
  brandLogo?: string;
  categoryIds: string[];
  categories: ProductCategory[];
  basePrice: number;
  virtualPrice: number;
  minPrice: number;
  maxPrice: number;
  totalStock: number;
  isAvailable: boolean;
  images: string[];
  sizeGuide: string;
  variants: ProductVariant[];
  attributes: ProductAttribute[];
  skus: ProductSku[];
  reviewIds: string[];
  ratingCount: number;
  averageRate: number;
  soldCount: number;
  viewCount: number;
  likeCount: number;
  shopId: string;
  status: ProductStatus;
  isApproved: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetProductByIdResponseDto {
  data: ProductDetail;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

export interface CreateProductDto {
  name: string;
  basePrice: number;
  virtualPrice: number;
  brandId?: string;
  images: string[];
  variants: ProductVariant[];
  createdById?: string;
  description?: string;
  sizeGuide?: string;
  provinceId?: number;
  provinceName?: string;
  districtId?: number;
  districtName?: string;
  wardId?: number;
  wardName?: string;
  status: ProductStatus;
  categories: string[];
  skus: CreateProductSku[];
  attributes: ProductAttribute[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  id: string;
  updatedById?: string;
}

// Order DTOs
export interface OrderListItem {
  id: string;
  code: string;
  shopId: string;
  shopName: string;
  status: string;
  itemTotal: number;
  grandTotal: number;
  firstProductImage: string;
  firstProductName: string;
  createdAt: string;
}

export interface GetAllOrdersData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  orders: OrderListItem[];
}

export interface GetAllOrderResponseDto {
  data: GetAllOrdersData;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

export interface OrderReceiver {
  name: string;
  phone: string;
  address: string;
}

export interface OrderTimeline {
  status: string;
  at: string;
}

export interface OrderItemSnapshot {
  id: string;
  productId: string;
  productImage: string;
  productName: string;
  skuValue: string;
  quantity: number;
  price: number;
}

export type PaymentMethod = "OnlineBanking" | "COD";
export type PaymentStatus = "Pending" | "Success" | "Failed" | "Refunded";

export interface OrderDetail {
  id: string;
  code: string;
  userId: string;
  shopId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId: string;
  itemTotal: number;
  shippingFee: number;
  discount: number;
  grandTotal: number;
  receiver: OrderReceiver;
  timeline: OrderTimeline[];
  createdAt: string;
  updatedAt: string;
  shopName: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  itemsSnapshot: OrderItemSnapshot[];
  firstProductName: string;
  firstProductImage: string;
}

export interface GetOrderByIdResponseDto {
  data: OrderDetail;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

export interface UpdateOrderDto {
  id: string;
  status: OrderStatus;
  notes?: string;
}

// Notification DTOs
export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string;
  link: string;
  image: string;
  metadata: {
    orderId?: string;
    articleId?: string;
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllNotificationsData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  notifications: NotificationItem[];
}

export interface GetAllNotificationResponseDto {
  data: GetAllNotificationsData;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

export interface UpdateNotificationDto {
  id: string;
  isRead: boolean;
}

export interface UpdateNotificationResponseDto {
  data: NotificationItem;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

// Chat DTOs
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: string;
  metadata?: string;
  createdAt: string;
}

export interface GetAllMessagesData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  messages: ChatMessage[];
}

export interface GetAllMessagesResponseDto {
  data: GetAllMessagesData;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

export interface ConversationReadStatus {
  isRead: boolean;
  lastSeenMessageId: string;
  deletedAt?: string;
}

export interface ConversationParticipant {
  id: string;
  username: string;
  avatar: string;
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  lastMessageId?: string;
  lastMessageContent?: string;
  lastMessageAt?: string;
  lastSenderId?: string;
  readStatus: Record<string, ConversationReadStatus>;
  participants?: ConversationParticipant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GetAllConversationsData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  conversations: ChatConversation[];
}

export interface GetAllConversationsResponseDto {
  data: GetAllConversationsData;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

export interface CreateConversationDto {
  participantIds: string[];
}

export interface CreateConversationResponseDto {
  data: ChatConversation;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

// Video DTOs
export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  status: MediaFileStatus;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllVideosData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  videos: VideoItem[];
}

export interface GetAllVideosResponseDto {
  data: GetAllVideosData;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

export interface GetVideoByIdResponseDto {
  data: VideoItem;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

export interface CreateVideoDto {
  title: string;
  description?: string;
  file: File;
}

// Review DTOs
export interface ReviewReply {
  id: string;
  reviewId: string;
  shopId: string;
  content: string;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  productId: string;
  username: string;
  userId: string;
  avatar: string;
  rating: number;
  content: string;
  medias?: string[];
  reply?: ReviewReply;
}

export interface ReviewRating {
  productId: string;
  averageRating: number;
  totalReviews: number;
  oneStarCount: number;
  twoStarCount: number;
  threeStarCount: number;
  fourStarCount: number;
  fiveStarCount: number;
}

export interface GetAllReviewsData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  reviews: ReviewItem[];
  rating?: ReviewRating;
}

export interface GetAllReviewResponseDto {
  data: GetAllReviewsData;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

export interface CreateReplyDto {
  reviewId: string;
  content: string;
}

export interface UpdateReplyDto {
  id: string;
  content: string;
}

// Report DTOs
export interface CreateReportDto {
  targetId: string;
  targetType: string;
  category: string;
  title: string;
  description: string;
}

export interface GetReportResponseDto {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetId: string;
  targetType: string;
  category: string;
  title: string;
  description: string;
  status: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Wrappers
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Query Parameters
export interface ProductQueryParams {
  page?: number;
  limit?: number;
  name?: string;
  status?: ProductStatus;
  brandIds?: string[];
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  provinceId?: number;
  orderBy?: "asc" | "desc";
  sortBy?: "price" | "createdAt" | "sale";
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  paymentId?: string;
  code?: string;
  status?: OrderStatus;
  paymentStatus?: string;
  paymentMethod?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface VideoQueryParams {
  page?: number;
  limit?: number;
  status?: MediaFileStatus;
  title?: string;
}

export interface ReviewQueryParams {
  page?: number;
  limit?: number;
  productId?: string;
  rating?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Location DTOs
export interface Province {
  id: number;
  name: string;
}

export interface District {
  id: number;
  name: string;
  provinceId: number;
}

export interface Ward {
  id: number;
  name: string;
  districtId: number;
  provinceId: number;
}

export interface GetProvincesResponseDto {
  data: Province[];
}

export interface GetDistrictsResponseDto {
  data: District[];
}

export interface GetWardsResponseDto {
  data: Ward[];
}

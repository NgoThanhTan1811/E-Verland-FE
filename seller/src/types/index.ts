// ============================================================================
// API DTOs - Exact match with backend schemas
// ============================================================================

// Common Types
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED"

export type ProductStatus = "Draft" | "Published" | "Inactive" | "OutOfStock";

export type VideoStatus =
  | "UPLOADING"
  | "UPLOADED"
  | "PROCESSING"
  | "READY"
  | "FAILED"
  | "DELETED";

export type ReportStatus = "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED";

export type ReportCategory =
  | "SPAM"
  | "INAPPROPRIATE"
  | "SCAM"
  | "COPYRIGHT"
  | "OTHER";

export type TargetType = "PRODUCT" | "REVIEW" | "USER" | "ORDER";

export type NotificationType =
  | "ORDER_UPDATE"
  | "PROMOTION"
  | "WALLET_UPDATE"
  | "TRUST_ME_BRO_UPDATE";

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
}

export interface DashboardResponseDto {
  data: DashboardData;
  message: string;
  statusCode: number;
  processId: string;
  duration: string;
}

export interface TopProductMetricDto {
  productId: string;
  productName?: string;
  soldCount: number;
  revenue: number;
}

export interface SellerDashboardDto {
  sellerId: string;
  totalOrdersByStatus?: Record<string, number>;
  totalRevenue: number;
  topProducts?: TopProductMetricDto[];
  generatedAtUtc: string;
}

export interface SellerDashboardResponseDto {
  data: SellerDashboardDto;
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
  id?: string;
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
  parentCategoryId?: string;
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
  districtId: number;
  wardId: number;
  brandId?: string;
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
  images?: string[];
  variants: ProductVariant[];
  createdById?: string;
  description?: string;
  sizeGuide?: string;
  provinceId?: number;
  districtId?: number;
  wardId?: number;
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
// Maps to backend Order_OrderOverviewResponseDto
export interface OrderListItem {
  id: string;
  code?: string;
  userId: string;
  status: string; // integer from backend, normalized by api.ts
  paymentStatus?: number | string;
  paymentMethod?: number | string;
  totalPrice: number;  // backend field name
  grandTotal: number;
  discount?: number;
  createdAt: string;
  // Friendly display fields (may not exist in backend response)
  shopId?: string;
  shopName?: string;
  firstProductImage?: string;
  firstProductName?: string;
}

export interface GetAllOrdersData {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  items: OrderListItem[]; // backend uses 'items'
}

export interface GetAllOrderResponseDto {
  items?: OrderListItem[];
  totalItems?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  // wrapped response fallback
  data?: GetAllOrdersData;
}

export interface OrderReceiver {
  name?: string;
  phone?: string;
  address?: string;
}

export interface OrderTimeline {
  status: string;
  at: string;
}

// Maps to backend Order_OrderItemResponseDto
export interface OrderItemSnapshot {
  id: string;
  productId: string;
  skuId?: string;
  productName?: string;
  productImage?: string;
  skuValue?: string;
  quantity: number;
  unitPrice: number;   // backend field
  price?: number;      // alias for unitPrice
  totalPrice?: number;
}

export type PaymentMethod = 0 | 1 | "COD" | "BANK_TRANSFER" | "E_WALLET";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";

// Maps to backend Order_OrderDetailResponseDto
export interface OrderDetail {
  id: string;
  code?: string;
  userId: string;
  shopId?: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus | number;
  paymentId?: string;
  totalPrice?: number;    // backend field
  itemTotal?: number;     // alias
  shippingFee?: number;
  discount?: number;
  grandTotal: number;
  receiver?: OrderReceiver; // nested object from backend
  timeline?: OrderTimeline[];
  createdAt: string;
  updatedAt?: string;
  shopName?: string;
  // Flattened receiver fields (may be derived)
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  items?: OrderItemSnapshot[];  // backend field name
  itemsSnapshot?: OrderItemSnapshot[]; // alias
  firstProductName?: string;
  firstProductImage?: string;
}

export interface GetOrderByIdResponseDto {
  data?: OrderDetail;
  // Direct fields (backend may return flat structure)
  id?: string;
  code?: string;
  status?: OrderStatus;
  grandTotal?: number;
}

export interface UpdateOrderDto {
  id: string;
  status: OrderStatus;
  notes?: string;
}

// Notification DTOs
export interface NotificationItem {
  id: string;
  userId?: string;
  type?: NotificationType;
  title: string;
  description?: string;
  link?: string;
  image?: string;
  metadata?: {
    orderId?: string;
    articleId?: string;
  };
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GetAllNotificationsData {
  page?: number;
  limit?: number;
  totalItems?: number;
  totalPages?: number;
  notifications?: NotificationItem[];
  items?: NotificationItem[];
}

export interface GetAllNotificationResponseDto {
  data?: GetAllNotificationsData;
  // Direct flat list (some endpoints may return directly)
  notifications?: NotificationItem[];
  items?: NotificationItem[];
  message?: string;
  statusCode?: number;
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
export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "FILE";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
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
  status: VideoStatus;
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
  targetType: TargetType;
  category: ReportCategory;
  title: string;
  description: string;
}

export interface GetReportResponseDto {
  id: string;
  reporterId: string;
  reporterName?: string;
  targetId: string;
  targetType: TargetType;
  category: ReportCategory;
  title: string;
  description: string;
  status: ReportStatus;
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
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fromDate?: string;
  toDate?: string;
  userId?: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface VideoQueryParams {
  page?: number;
  limit?: number;
  status?: VideoStatus;
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

export interface BrandItem {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  parentCategoryId?: string | null;
  parentCategoryName?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type MediaType = 0 | 1;

export interface MediaItem {
  id: string;
  url?: string;
  path?: string;
  fileName?: string;
  contentType?: string;
  resourceType?: string;
  objectId?: string;
  mediaType?: MediaType;
  createdAt?: string;
}

export interface BrandQueryParams {
  Keyword?: string;
  Page?: number;
  Limit?: number;
}

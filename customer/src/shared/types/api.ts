// API DTOs for E-Verland Customer - matching the backend API

// ============================================
// AUTH DTOs
// ============================================

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  user?: {
    id: string;
    email?: string;
    username?: string;
    role?: string;
  };
}

export interface RegisterWithOtpRequestDto {
  email: string;
  otpCode: string;
  username: string;
  password: string;
}

export interface SendOtpRequestDto {
  email: string;
}

export interface VerifyOtpRequestDto {
  email: string;
  otpCode: string;
}

export interface ChangePasswordRequestDto {
  oldPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequestOtpDto {
  email: string;
}

export interface ForgotPasswordVerifyOtpDto {
  email: string;
  otpCode: string;
}

export interface ForgotPasswordResetDto {
  email: string;
  otpCode: string;
  newPassword: string;
}

// ============================================
// PROFILE DTOs
// ============================================

export interface UpdateProfileReqDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  gender?: number;
  bio?: string;
}

export interface ProfileResDto {
  id: string;
  accountId: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  phoneNumber?: string;
  gender?: number;
  avatarUrl?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// ADDRESS DTOs
// ============================================

export interface AddressReqDto {
  label?: number;
  city?: string;
  province?: string;
  district?: string;
  ward?: string;
  provinceId?: number;
  districtId?: number;
  wardCode?: string;
  street?: string;
  detail?: string;
  isDefault?: boolean;
}

export interface AddressResDto {
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
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// BANK ACCOUNT DTOs
// ============================================

export interface BankAccountReqDto {
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
}

export interface BankAccountResDto {
  id: string;
  profileId: string;
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// PRODUCT DTOs
// ============================================

export interface ProductSearchParams {
  keyword?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface ProductResDto {
  id: string;
  name: string;
  description?: string;
  brandId?: string;
  categoryId?: string;
  price: number;
  originalPrice?: number;
  images?: string[];
  status?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryResDto {
  id: string;
  name: string;
  description?: string;
  image?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BrandResDto {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SkuResDto {
  id: string;
  productId: string;
  skuValue: string;
  price: number;
  stock: number;
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// CART DTOs
// ============================================

export interface AddToCartRequestDto {
  productId: string;
  skuId: string;
  quantity: number;
  productName: string;
  productImage?: string;
  skuValue: string;
}

export interface UpdateCartItemRequestDto {
  cartItemId: string;
  quantity: number;
}

export interface CartItemResDto {
  id: string;
  cartId: string;
  productId: string;
  skuId: string;
  quantity: number;
  productName: string;
  productImage?: string;
  skuValue: string;
  price: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CartResDto {
  id: string;
  userId: string;
  items: CartItemResDto[];
  createdAt: string;
  updatedAt?: string;
}

// ============================================
// ORDER DTOs
// ============================================

export interface CreateOrderRequestDto {
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

export interface OrderResDto {
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
  items?: Array<{
    id: string;
    productId: string;
    skuId: string;
    quantity: number;
    price: number;
    productName?: string;
    productImage?: string;
    skuValue?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderQueryParams {
  userId: string;
  status?: number;
  paymentStatus?: number;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}

// ============================================
// PAYMENT DTOs
// ============================================

export interface PaymentOrderItemRequestDto {
  skuId: string;
  quantity: number;
}

export interface PaymentInitiateRequestDto {
  orderId: string;
  userId: string;
  amount: number;
  method: "COD" | "OnlineBanking";
  items?: PaymentOrderItemRequestDto[];
}

export interface PaymentInitiateResponseDto {
  id: string;
  code?: string;
  status: number;
  paymentUrl?: string;
}

export interface PaymentOverviewResDto {
  id: string;
  code?: string;
  orderId: string;
  amount: number;
  method: number;
  status: number;
  createdAt: string;
}

export interface PaymentResDto {
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

export interface PaymentUpdateStatusRequestDto {
  status: number;
}

// ============================================
// SHIPPING DTOs
// ============================================

export interface CalculateShippingFeeRequestDto {
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

export interface ShippingFeeResponseDto {
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

export interface ShippingAddressRequestDto {
  name?: string;
  phone?: string;
  address?: string;
  districtId: number;
  wardCode?: string;
  wardName?: string;
  districtName?: string;
  provinceName?: string;
}

export interface ShippingDimensionsRequestDto {
  weight: number;
  length: number;
  width: number;
  height: number;
}

export interface ShippingItemRequestDto {
  name?: string;
  code?: string;
  quantity: number;
  price?: number;
  weight: number;
  length?: number;
  width?: number;
  height?: number;
}

export interface CreateShippingDraftRequestDto {
  orderId: string;
  userId: string;
  clientOrderCode?: string;
  toAddress: ShippingAddressRequestDto;
  dimensions: ShippingDimensionsRequestDto;
  items?: ShippingItemRequestDto[];
  serviceId?: number;
  serviceTypeId?: number;
  paymentTypeId?: number;
  codAmount?: number;
  insuranceValue?: number;
  note?: string;
  requiredNote?: string;
}

export interface ShippingOrderResponseDto {
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

// ============================================
// NOTIFICATION DTOs
// ============================================

export interface NotificationResDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationStatusResDto {
  unreadCount: number;
}

// ============================================
// CHAT DTOs
// ============================================

export interface CreateConversationRequestDto {
  customerId: string;
  sellerId: string;
}

export interface AddMessageRequestDto {
  conversationId: string;
  senderId: string;
  content?: string;
}

export interface ConversationResDto {
  id: string;
  customerId: string;
  sellerId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MessageResDto {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  createdAt: string;
  updatedAt?: string;
}

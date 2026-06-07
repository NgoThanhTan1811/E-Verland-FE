// Constants for E-Verland Customer

export const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const DEFAULT_AVATAR_URL =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' fill='%23b3b3b3'/><circle cx='64' cy='48' r='26' fill='%23ffffff'/><path d='M20 118c6-26 32-38 44-38s38 12 44 38' fill='%23ffffff'/></svg>";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  OTP_VERIFICATION: "/otp-verification",
  CHANGE_PASSWORD: "/change-password",
  PRODUCTS: "/products",
  PRODUCT_DETAIL: "/products/:id",
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDER_SUCCESS: "/order/success/:orderId",
  MY_ORDERS: "/my-orders",
  ORDER_DETAIL: "/orders/:orderId",
  PAYMENT_RESULT: "/payment/result",
  PROFILE: "/profile",
  ADDRESSES: "/profile/addresses",
  BANK_ACCOUNT: "/profile/bank-account",
  NOTIFICATIONS: "/notifications",
  CHAT: "/chat",
} as const;

export const SORT_OPTIONS = [
  { value: "popular", label: "Phổ biến" },
  { value: "latest", label: "Mới nhất" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "rating", label: "Đánh giá cao nhất" },
];

export const ORDER_STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  completed: "Đã hoàn thành",
  canceled: "Đã hủy",
};

export const ORDER_STATUS_COLORS = {
  pending: "bg-warning/10 text-warning",
  confirmed: "bg-info/10 text-info",
  shipping: "bg-secondary/10 text-secondary",
  completed: "bg-success/10 text-success",
  canceled: "bg-error/10 text-error",
};

export const PAYMENT_METHOD_LABELS = {
  cod: "Thanh toán khi nhận hàng (COD)",
  online_banking: "Chuyển khoản qua ngân hàng",
};

export const PAYMENT_STATUS_LABELS = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
};

export const ITEMS_PER_PAGE = 20;

export const PROVINCES = [
  "Hà Nội",
  "Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
  "Cần Thơ",
  "An Giang",
  "Bà Rịa - Vũng Tàu",
  "Bắc Giang",
  "Bắc Kạn",
  "Bạc Liêu",
  "Bắc Ninh",
  "Bến Tre",
  "Bình Định",
  "Bình Dương",
  "Bình Phước",
  "Bình Thuận",
  "Cà Mau",
  "Cao Bằng",
  "Đắk Lắk",
  "Đắk Nông",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Giang",
  "Hà Nam",
  "Hà Tĩnh",
  "Hải Dương",
  "Hậu Giang",
  "Hòa Bình",
  "Hưng Yên",
  "Khánh Hòa",
  "Kiên Giang",
  "Kon Tum",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Long An",
  "Nam Định",
  "Nghệ An",
  "Ninh Bình",
  "Ninh Thuận",
  "Phú Thọ",
  "Phú Yên",
  "Quảng Bình",
  "Quảng Nam",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sóc Trăng",
  "Sơn La",
  "Tây Ninh",
  "Thái Bình",
  "Thái Nguyên",
  "Thanh Hóa",
  "Thừa Thiên Huế",
  "Tiền Giang",
  "Trà Vinh",
  "Tuyên Quang",
  "Vĩnh Long",
  "Vĩnh Phúc",
  "Yên Bái",
];

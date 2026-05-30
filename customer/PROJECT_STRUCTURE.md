# E-Verland Customer - Cấu trúc dự án

## Tổng quan

E-Verland Customer là một ứng dụng e-commerce hiện đại, được xây dựng với React, TypeScript, React Router, và Tailwind CSS. Dự án sử dụng kiến trúc feature-based để dễ dàng mở rộng và bảo trì.

## API Base URL

```
https://e-verland-czf8bbhqfyd3ecfb.southeastasia-01.azurewebsites.net
```

## Cấu trúc thư mục

```
src/
├── app/
│   ├── App.tsx                 # Component gốc của ứng dụng
│   ├── routes.tsx              # Cấu hình React Router
│   │
│   ├── shared/                 # Thành phần dùng chung
│   │   ├── components/         # UI components tái sử dụng
│   │   │   └── product-card.tsx
│   │   ├── ui/                 # Primitive UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── badge.tsx
│   │   ├── layouts/            # Layout components
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   └── main-layout.tsx
│   │   ├── types/              # TypeScript types
│   │   │   └── index.ts
│   │   ├── constants/          # Hằng số ứng dụng
│   │   │   └── index.ts
│   │   └── data/               # Mock data
│   │       └── mock-data.ts
│   │
│   └── features/               # Tính năng theo module
│       ├── home/               # Trang chủ
│       │   └── home-page.tsx
│       ├── auth/               # Xác thực
│       │   ├── login-page.tsx
│       │   ├── register-page.tsx
│       │   └── otp-verification-page.tsx
│       ├── product/            # Sản phẩm
│       │   ├── product-listing-page.tsx
│       │   └── product-detail-page.tsx
│       ├── cart/               # Giỏ hàng
│       │   └── cart-page.tsx
│       ├── checkout/           # Thanh toán
│       │   └── checkout-page.tsx
│       ├── order/              # Đơn hàng
│       │   ├── my-orders-page.tsx
│       │   ├── order-detail-page.tsx
│       │   └── order-success-page.tsx
│       ├── profile/            # Tài khoản
│       │   └── profile-page.tsx
│       ├── notification/       # Thông báo
│       │   └── notification-page.tsx
│       ├── chat/               # Hỗ trợ chat
│       │   └── chat-page.tsx
│       └── not-found-page.tsx  # Trang 404
│
└── styles/
    ├── theme.css               # Design system & tokens
    └── fonts.css               # Font imports
```

## Các tính năng chính

### 1. Home (Trang chủ)

- **Route**: `/`
- **Features**:
  - Hero banner với carousel
  - Danh mục nổi bật
  - Flash Sale section
  - Sản phẩm đề xuất
  - Deal banners
  - Footer đầy đủ

### 2. Auth (Xác thực)

- **Routes**:
  - `/login` - Đăng nhập
  - `/register` - Đăng ký
  - `/otp-verification` - Xác thực OTP
- **Features**:
  - Form validation
  - Hiển thị/ẩn mật khẩu
  - Gửi OTP qua email
  - Xác thực OTP trước khi tạo tài khoản
  - Đăng ký bằng OTP
  - Social login placeholders
  - Remember me checkbox

### 3. Product (Sản phẩm)

- **Routes**:
  - `/products` - Danh sách sản phẩm
  - `/products/:slug` - Chi tiết sản phẩm
- **Features**:
  - Lọc theo category, giá, rating
  - Sắp xếp sản phẩm
  - Grid/List view
  - Product gallery
  - Chọn variants (màu sắc, size)
  - Thêm vào giỏ hàng
  - Yêu thích sản phẩm
  - Sản phẩm liên quan

### 4. Cart (Giỏ hàng)

- **Route**: `/cart`
- **Features**:
  - Cập nhật số lượng
  - Xóa sản phẩm
  - Tính tổng tiền
  - Miễn phí ship từ 500k
  - Empty state

### 5. Checkout (Thanh toán)

- **Route**: `/checkout`
- **Features**:
  - Chọn địa chỉ giao hàng
  - Chọn phương thức thanh toán (COD, Online Banking)
  - Thanh toán online qua SePay (quét QR, redirect)
  - Ghi chú đơn hàng
  - Xem lại đơn hàng
  - Đặt hàng

### 6. Order (Đơn hàng)

- **Routes**:
  - `/my-orders` - Danh sách đơn hàng
  - `/orders/:orderId` - Chi tiết đơn hàng
  - `/order/success/:orderId` - Đặt hàng thành công
- **Features**:
  - Theo dõi trạng thái đơn hàng
  - Timeline đơn hàng
  - Hủy đơn hàng (nếu pending)
  - Mua lại
  - Empty state

### 7. Profile (Tài khoản)

- **Route**: `/profile`
- **Features**:
  - Thông tin tài khoản
  - Quick stats (đơn hàng)
  - Menu điều hướng đến các tính năng
  - Đăng xuất

### 8. Notification (Thông báo)

- **Route**: `/notifications`
- **Features**:
  - Danh sách thông báo
  - Filter: Tất cả / Chưa đọc
  - Đánh dấu đã đọc
  - Xóa thông báo
  - Icons theo loại (order, promotion, system)

### 9. Chat (Hỗ trợ)

- **Route**: `/chat`
- **Features**:
  - Chat 1-1 giữa người dùng và người bán
  - Gửi tin nhắn
  - Hiển thị timestamp
  - Câu hỏi thường gặp
  - Auto-reply simulation

### 10. 404 (Not Found)

- **Route**: `*` (catch all)
- **Features**:
  - Thông báo không tìm thấy trang
  - Quick links
  - Quay lại / Về trang chủ

## Design System

### Color Palette

- **Primary**: `#ff6b35` - Cam/đỏ thương mại điện tử
- **Secondary**: `#5b7abb` - Xanh dương
- **Success**: `#00ba88`
- **Warning**: `#ffa726`
- **Error**: `#ef4444`
- **Info**: `#3b82f6`
- **Neutral**: 50-900 grayscale

### Components

#### UI Components (`shared/ui/`)

- **Button**: 5 variants (primary, secondary, outline, ghost, danger), 3 sizes
- **Input**: Label, error, success states
- **Badge**: 6 color variants

#### Shared Components (`shared/components/`)

- **ProductCard**: Hiển thị sản phẩm với giá, rating, discount, favorite

#### Layouts (`shared/layouts/`)

- **Header**: Sticky header với search, cart, notifications, user menu
- **Footer**: Links, social media, contact info
- **MainLayout**: Wrapper cho tất cả pages

## Types (TypeScript)

Tất cả types được định nghĩa trong `/src/app/shared/types/index.ts`:

- **Product**: Sản phẩm với variants, attributes
- **CartItem**: Item trong giỏ hàng
- **Order**: Đơn hàng với items, timeline, shipping
- **User**: Thông tin người dùng
- **Address**: Địa chỉ giao hàng
- **Notification**: Thông báo
- **ChatMessage**: Tin nhắn chat
- **Category**: Danh mục
- **Brand**: Thương hiệu

## Constants

Định nghĩa trong `/src/app/shared/constants/index.ts`:

- **VITE_API_BASE_URL
  **: URL API backend
- **ROUTES**: Tất cả routes của app
- **SORT_OPTIONS**: Tùy chọn sắp xếp
- **ORDER_STATUS_LABELS**: Nhãn trạng thái đơn hàng
- **PAYMENT_METHOD_LABELS**: Nhãn phương thức thanh toán
- **PROVINCES**: Danh sách tỉnh/thành phố Việt Nam

## Mock Data

Mock data trong `/src/app/shared/data/mock-data.ts` bao gồm:

- **mockCategories**: 8 danh mục
- **mockBanners**: 3 banners
- **mockProducts**: 6 sản phẩm mẫu
- **mockOrder**: 1 đơn hàng mẫu

## Routing

Sử dụng React Router v7 với Data Mode:

```typescript
// src/app/routes.tsx
export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      // ... các routes khác
    ],
  },
]);
```

## State Management

Hiện tại sử dụng React `useState` và `useEffect` hooks. Có thể mở rộng với:

- Context API cho global state
- React Query cho data fetching
- Zustand/Redux cho complex state

## Next Steps - Tính năng mở rộng

### Authentication

- OTP verification page
- Forgot password flow
- Change password page
- Social login integration

### Profile

- Edit profile page
- Address management (CRUD)
- Bank account management
- Order history filters

### Products

- Advanced filtering
- Product comparison
- Recently viewed
- Wishlist page

### Payments

- Payment result page
- Online banking integration
- E-wallet integration
- Payment history

### Backend Integration

- Connect to API endpoints
- Error handling
- Loading states
- Success/error notifications (Toast)

### Performance

- Image optimization
- Lazy loading
- Code splitting
- SEO optimization

## Responsive Design

- **Desktop**: Full features, wide layout
- **Tablet**: Adaptive grid, sidebar collapse
- **Mobile**: Stacked layout, bottom navigation, drawer menus

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Notes

### Thêm tính năng mới

1. Tạo folder trong `features/` theo tên feature
2. Tạo components, pages trong folder đó
3. Thêm route trong `routes.tsx`
4. Thêm types nếu cần trong `shared/types/`
5. Thêm constants nếu cần trong `shared/constants/`

### Tạo component dùng chung

1. Tạo trong `shared/components/` hoặc `shared/ui/`
2. Export từ file đó
3. Import và sử dụng trong features

### Mock data

- Sử dụng mock data từ `shared/data/mock-data.ts`
- Khi integrate API, thay thế bằng API calls
- Giữ mock data để development và testing

---

**Ngày tạo**: 22/03/2026
**Version**: 1.0.0
**Tech Stack**: React 18, TypeScript, React Router 7, Tailwind CSS 4

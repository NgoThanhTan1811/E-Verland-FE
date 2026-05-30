Thiết kế một hệ thống giao diện E-Commerce phía khách hàng (customer-facing) hiện đại, tối ưu conversion, lấy cảm hứng UX từ Lazada và Shopee nhưng dùng visual riêng, sạch, chuyên nghiệp, dễ scale. Mục tiêu là tạo full UI/UX flow cho web responsive desktop trước, có cân nhắc mobile-first trong layout behavior.

Tên dự án: E-Verland Customer
Ngôn ngữ giao diện: Tiếng Việt
Phong cách: hiện đại, thân thiện, nhiều khoảng trắng, nổi bật CTA, card-based layout, e-commerce marketplace style
Design direction: tương tự Lazada/Shopee ở trải nghiệm mua sắm nhanh, banner sale, danh mục nổi bật, flash sale, recommendation, product card giàu thông tin, nhưng visual tinh gọn và cao cấp hơn.
Tech expectation for handoff: Typescript
Frontend architecture expectation: feature-based structure
Shared reusable components phải đặt trong folder shared/
API base URL: https://e-verland-czf8bbhqfyd3ecfb.southeastasia-01.azurewebsites.net

Hãy tạo:
1. Design system
2. Sitemap / information architecture
3. Full page UI
4. Component variants
5. Responsive rules
6. Developer handoff notes theo feature-based

====================
1) DESIGN SYSTEM
====================
Tạo một design system đầy đủ gồm:
- Color palette:
  - Primary: cam/đỏ thương mại điện tử nổi bật
  - Secondary: xanh dương hoặc tím nhẹ để cân bằng
  - Success, Warning, Error, Info
  - Neutral grayscale từ 50 đến 900
- Typography scale:
  - Display
  - H1, H2, H3
  - Body large, body medium, body small
  - Caption, label, button text
- 8pt spacing system
- Border radius: mềm, hiện đại
- Shadow system cho card, modal, dropdown
- Grid system cho desktop/tablet/mobile
- Icon style đồng nhất
- Button variants:
  - Primary
  - Secondary
  - Outline
  - Ghost
  - Danger
  - Disabled
  - Loading
- Form controls:
  - Input
  - Password input
  - Search input
  - Select
  - Radio
  - Checkbox
  - Quantity stepper
  - OTP input
  - Textarea
  - Address picker
- Feedback states:
  - Empty state
  - Loading skeleton
  - Error state
  - Success state
  - Toast notification
- Product UI patterns:
  - Product card
  - SKU selector (color/size)
  - Rating display
  - Price / sale / original price
  - Discount badge
  - Stock status
  - Favorite / wishlist icon
- Navigation components:
  - Top header
  - Mega menu / category menu
  - Breadcrumb
  - Pagination
  - Tabs
  - Filter chips
  - Sort dropdown
- Overlay components:
  - Drawer cart
  - Modal
  - Confirm dialog
  - Voucher popup
  - Chat widget
  - Notification panel

====================
2) INFORMATION ARCHITECTURE
====================
Tạo kiến trúc màn hình theo feature-based cho customer app với các feature sau:

A. home
- Trang chủ
- Hero banner
- Flash sale
- Danh mục nổi bật
- Sản phẩm đề xuất
- Brand spotlight
- Deal banner
- Recently viewed
- Footer đầy đủ

B. auth
- Đăng nhập
- Đăng ký
- Xác thực OTP email
- Quên mật khẩu
- Đặt lại mật khẩu
- Đổi mật khẩu

C. product-listing
- Danh sách sản phẩm
- Grid/list view
- Search
- Filter theo category, brand, price range, rating, stock status
- Sort theo phổ biến, mới nhất, giá tăng/giảm
- Promo badges
- Infinite scroll hoặc pagination

D. product-detail
- Gallery ảnh
- Tên sản phẩm
- Brand
- Category breadcrumb
- Giá, giá gốc, % giảm
- Rating + review summary
- Chọn SKU/variant (màu, size, option values)
- Tồn kho
- Mô tả
- Thuộc tính sản phẩm
- Chính sách vận chuyển
- Gợi ý sản phẩm liên quan
- CTA: Thêm vào giỏ hàng, Mua ngay, Chat với shop/admin

E. cart
- Giỏ hàng
- Cập nhật số lượng
- Xóa sản phẩm
- Chọn SKU
- Tính tạm tính
- Áp voucher placeholder
- CTA thanh toán
- Empty cart state

F. checkout
- Chọn / thêm địa chỉ nhận hàng
- Chọn phương thức thanh toán
- Online Banking
- COD
- Tóm tắt đơn hàng
- Phí vận chuyển
- Ghi chú đơn hàng
- Xác nhận đặt hàng

G. order
- Đặt hàng thành công
- Danh sách đơn hàng của tôi
- Chi tiết đơn hàng
- Trạng thái đơn hàng:
  Pending, Confirmed, Shipping, Completed, Canceled
- Tracking timeline
- Hành động:
  xem chi tiết, hủy đơn nếu hợp lệ, mua lại

H. payment
- Trạng thái thanh toán
- Thành công / thất bại / đang xử lý
- Retry payment
- Payment history ngắn gọn nếu cần

I. profile
- Tài khoản của tôi
- Hồ sơ cá nhân
- Avatar
- Danh sách địa chỉ
- Thêm / sửa / xóa địa chỉ
- Đặt địa chỉ mặc định
- Tài khoản ngân hàng
- Đổi mật khẩu
- Cài đặt tài khoản cơ bản

J. notification
- Notification center
- Danh sách thông báo
- Unread / all
- Đánh dấu đã đọc
- Realtime notification dropdown/panel

K. chat
- Chat 1-1 giữa user và admin/support
- Danh sách hội thoại
- Khung chat
- Message input
- Timestamp
- Trạng thái đọc cơ bản
- Empty conversation state

L. shared experiences
- Header với search, account, cart, notification
- Footer
- Breadcrumbs
- Global modal
- Toast
- Skeleton
- Error boundary style screen

====================
3) PAGE LIST CẦN THIẾT KẾ
====================
Hãy tạo đầy đủ các màn sau, mỗi màn có desktop frame riêng:
- Home page
- Login page
- Register page
- OTP verification page
- Forgot password page
- Reset password page
- Product listing page
- Product detail page
- Cart page
- Checkout page
- Order success page
- My orders page
- Order detail page
- Payment result page
- My profile page
- Address management page
- Bank account page
- Change password page
- Notification center page
- Chat page
- 404 page
- Empty states page
- Loading states page

====================
4) UX YÊU CẦU
====================
Áp dụng UX pattern kiểu marketplace:
- Header sticky
- Search bar lớn, ưu tiên hành vi mua sắm
- Banner khuyến mãi nổi bật nhưng không rối
- Product card tối ưu click-through
- CTA “Mua ngay” và “Thêm vào giỏ” rõ ràng
- Hiển thị variant trực quan
- Filter dễ dùng
- Checkout ít bước, rõ thông tin
- Order tracking dễ hiểu
- Notification và chat dễ tiếp cận
- Tối ưu trust signals: rating, sold count, badge, stock, payment methods, shipping info

====================
5) COMPONENT VARIANTS CẦN TẠO
====================
Tạo variants/state cho:
- Product card: default / hover / sale / out of stock
- Button: default / hover / pressed / disabled / loading
- Input: default / focus / error / success / disabled
- Cart item: normal / selected / unavailable
- Notification item: unread / read
- Chat bubble: self / admin / system
- Address card: default / selected / default badge
- Payment method card: selected / unselected / disabled
- Order status chip: Pending / Confirmed / Shipping / Completed / Canceled
- SKU option chip: default / selected / disabled

====================
6) RESPONSIVE RULES
====================
Thể hiện behavior responsive:
- Desktop: đầy đủ content
- Tablet: thu gọn sidebar/filter
- Mobile: stacked layout, bottom CTA, drawer/filter
- Header chuyển sang mobile navigation phù hợp
- Cart và checkout ưu tiên thao tác nhanh trên mobile

====================
7) FILE/FOLDER HANDOFF NOTE CHO DEV
====================
Hãy kèm một section mô tả cấu trúc frontend theo feature-based bằng Typescript như sau:

src/
  app/
  shared/
    components/
    ui/
    layouts/
    hooks/
    utils/
    types/
    constants/
    services/
  features/
    home/
    auth/
    product/
    cart/
    checkout/
    order/
    payment/
    profile/
    notification/
    chat/

Yêu cầu:
- Mỗi feature chứa components, pages, hooks, services, types
- Component dùng chung đặt trong shared/
- Tách rõ reusable UI và feature-specific UI
- API integration dùng base URL đã cho
- Naming rõ ràng, scale tốt cho team development

====================
8) VISUAL OUTPUT FORMAT
====================
Trong Figma, hãy tạo:
- 1 page cho Design System
- 1 page cho Sitemap / Flow
- 1 page cho Desktop Screens
- 1 page cho Mobile Adaptations
- 1 page cho Components & Variants
- 1 page cho Dev Handoff Notes

Đảm bảo toàn bộ thiết kế nhất quán, thực tế, sẵn sàng bàn giao cho dev frontend Typescript.
Ưu tiên trải nghiệm người dùng mua hàng, dễ mở rộng theo feature-based architecture.
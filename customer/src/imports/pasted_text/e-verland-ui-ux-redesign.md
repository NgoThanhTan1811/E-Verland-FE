Hãy cập nhật và sửa lại toàn bộ thiết kế UI/UX của dự án E-Verland Customer theo các yêu cầu dưới đây. Đây là một customer-facing e-commerce frontend, visual style lấy cảm hứng từ Shopee/Lazada nhưng sạch hơn, hiện đại hơn, dễ triển khai bằng Typescript theo kiến trúc feature-based.

Tên dự án: E-Verland Customer
Ngôn ngữ giao diện: Tiếng Việt
Tech handoff: Typescript
Architecture: feature-based
Shared reusable components phải nằm trong shared/
API base URL: https://e-verland-czf8bbhqfyd3ecfb.southeastasia-01.azurewebsites.net

Mục tiêu:

- Sửa các màn chưa đúng / chưa hoàn thiện
- Làm lại flow theo đúng API thực tế từ swagger
- Chỉ hiển thị những chức năng customer app thực sự support
- Những gì API chưa rõ hoặc chưa support phải thể hiện là disabled / coming soon / hidden hợp lý
- Ưu tiên khả năng implement thực tế

==================================================
A. CÁC LỖI / THAY ĐỔI BẮT BUỘC PHẢI SỬA
==================================================

1. NÚT HỖ TRỢ / CHAT

- Nút hỗ trợ/chat phải là floating action button nằm cố định ở góc dưới phải màn hình
- Kiểu hành vi giống Shopee:
  - trạng thái mặc định: icon chat + nhãn ngắn “Hỗ trợ”
  - hover: nổi rõ hơn
  - click: mở chat popup/panel nổi lên từ góc dưới phải
  - popup gồm:
    - header “Hỗ trợ khách hàng”
    - danh sách hội thoại hoặc trạng thái bắt đầu chat
    - khung tin nhắn
    - input gửi tin nhắn
    - thu nhỏ / đóng
- Trên mobile:
  - nút chat vẫn ở góc dưới phải
  - khi mở thì hiển thị thành bottom sheet hoặc full-screen chat hợp lý
- Nếu user chưa có conversation, hiển thị empty state “Bắt đầu cuộc trò chuyện với hỗ trợ”

2. LOGIN / LOGOUT CHƯA HOÀN THIỆN

- Thiết kế lại auth flow theo đúng các endpoint hiện có
- Login dùng email + password
- Có xử lý refresh token
- Logout hiện không có endpoint riêng trong swagger, nên thiết kế theo hướng:
  - logout là action phía client: clear access token, refresh token, user state
  - confirm modal khi logout
- Hiển thị đầy đủ state:
  - chưa đăng nhập
  - đang đăng nhập
  - đăng nhập thành công
  - token hết hạn và refresh
  - session hết hạn -> chuyển về login
- Header phải có 2 trạng thái:
  - guest: đăng nhập / đăng ký
  - logged-in: avatar, tên user, menu tài khoản, đơn hàng, thông báo, logout

3. FILTER CHƯA HOÀN THIỆN

- Chỉ dùng những filter public product search đang support thực tế:
  - Keyword
  - CategoryId
  - BrandId
  - MinPrice
  - MaxPrice
  - Page
  - Limit
- Không thiết kế filter rating / stock / sort như chức năng hoạt động thực tế nếu API public chưa support
- Có thể hiển thị rating filter hoặc sort dưới dạng disabled / coming soon nếu cần cho UX demo, nhưng phải đánh dấu rõ là chưa active
- Product listing cần:
  - search bar
  - category filter
  - brand filter
  - price range
  - clear filters
  - applied filter chips
  - pagination
- Filter trên desktop là sidebar hoặc top filter bar
- Trên mobile dùng drawer/filter sheet

4. ORDER STATUS CAN’T CHANGE

- Ở phía customer app, order status là read-only
- Không có UI cho customer đổi trạng thái đơn hàng
- Không dùng interactive dropdown để đổi trạng thái
- Chỉ hiển thị status timeline và badge trạng thái
- Có thể có nút “Hủy đơn” chỉ khi business xác nhận mapping với API delete order, nhưng mặc định trong thiết kế:
  - không cho user sửa trạng thái trực tiếp
  - không hiển thị control update status
- Trạng thái đơn hàng chỉ hiển thị để theo dõi:
  Pending, Confirmed, Shipping, Completed, Canceled

5. PROFILE / EDIT, ADDRESS, PROFILE / BANK-ACCOUNT, CHANGE-PASSWORD CHƯA CÓ

- Bổ sung đầy đủ các màn và flow sau:
  a. Hồ sơ cá nhân
  b. Chỉnh sửa hồ sơ
  c. Danh sách địa chỉ
  d. Thêm địa chỉ
  e. Sửa địa chỉ
  f. Chọn địa chỉ mặc định
  g. Danh sách tài khoản ngân hàng
  h. Thêm tài khoản ngân hàng
  i. Sửa tài khoản ngân hàng
  j. Đổi mật khẩu
- Tất cả các màn này phải có đầy đủ:
  - empty state
  - loading state
  - success state
  - validation state
  - error state

==================================================
B. RÀNG BUỘC THIẾT KẾ THEO API THỰC TẾ
==================================================

Thiết kế phải bám đúng các nhóm endpoint sau:

1. AUTH

- POST /auth/login
- POST /auth/refresh
- POST /auth/change-password
- POST /auth/forgot-password/request-otp
- POST /auth/forgot-password/verify-otp
- POST /auth/forgot-password/reset
- POST /auth/send-otp
- POST /auth/verify-otp
- POST /auth/register-with-otp
- POST /auth/resend-otp
- GET /auth/google/login
- GET /auth/google/register
- GET /auth/google/callback

2. PROFILE

- POST /Profile?accountId={accountId}
- GET /Profile/account/{accountId}
- PATCH /Profile/{accountId}

3. ADDRESS

- GET /profile/{profileId}/Address
- POST /profile/{profileId}/Address
- GET /profile/{profileId}/Address/{id}
- PATCH /profile/{profileId}/Address/{id}
- DELETE /profile/{profileId}/Address/{id}
- GET /profile/{profileId}/Address/default

4. BANK ACCOUNT

- GET /profile/{profileId}/BankAccount
- POST /profile/{profileId}/BankAccount
- GET /profile/{profileId}/BankAccount/{id}
- PATCH /profile/{profileId}/BankAccount/{id}
- DELETE /profile/{profileId}/BankAccount/{id}

5. PRODUCT / CATEGORY / BRAND / SKU

- GET /Product/p/search
- GET /Product/{id}
- GET /Category
- GET /Category/{id}
- GET /Brand/search/brand
- GET /Brand/{id}
- GET /Sku/{id}

6. CART

- POST /Cart/user/{userId}/items
- GET /Cart/user/{userId}
- PUT /Cart/items/{cartItemId}
- DELETE /Cart/items/{cartItemId}

7. ORDER

- POST /Order?userId={userId}
- GET /Order?userId={userId}&status=&paymentStatus=&fromDate=&toDate=&page=&limit=
- GET /Order/{id}
- DELETE /Order/{id}?userId={userId}
- PATCH /Order/{id} chỉ coi là non-customer action, không expose cho customer UI đổi status

8. PAYMENT

- POST /Payment
- POST /Payment/process?userId={userId}&amount={amount}
- GET /Payment/{id}
- GET /Payment/payment-order/{orderId}
- GET /Payment/payment-code/{code}
- GET /Payment/payment-user/{userId}

9. NOTIFICATION

- GET /Notification/subscribe?userId={userId}
- GET /Notification/unread?userId={userId}
- GET /Notification/user/{userId}?take=50
- POST /Notification/{notificationId}/mark-as-read
- GET /Notification/status/{userId}

10. CHAT

- POST /Chat/conversations
- GET /Chat/conversations/{conversationId}
- GET /Chat/conversations/user/{userId}
- POST /Chat/messages
- GET /Chat/messages/{messageId}
- GET /Chat/messages/conversation/{conversationId}?page=1&pageSize=30

==================================================
C. DTO / DATA MODEL HỢP LÝ CHO FRONTEND
==================================================

Dựa trên swagger, hãy thiết kế UI và handoff với các DTO frontend hợp lý sau:

1. LoginRequestDto
   {
   email: string;
   password: string;
   }

2. LoginResponseDto
   {
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

3. RegisterWithOtpRequestDto
   {
   email: string;
   otpCode: string;
   username: string;
   password: string;
   }

4. ChangePasswordRequestDto
   {
   oldPassword: string;
   newPassword: string;
   }

5. UpdateProfileReqDto
   {
   firstName?: string;
   lastName?: string;
   dateOfBirth?: string;
   phoneNumber?: string;
   avatarUrl?: string;
   gender?: number;
   bio?: string;
   }

6. ProfileResDto
   {
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

7. AddressReqDto hợp lý cho frontend
   Lưu ý: swagger đang để create/update address request schema trống, vì vậy hãy suy luận hợp lý từ response model:
   {
   label?: number;
   city?: string;
   province?: string;
   district?: string;
   ward?: string;
   street?: string;
   detail?: string;
   isDefault?: boolean;
   }

8. AddressResDto
   {
   id: string;
   profileId: string;
   label: number;
   city?: string;
   province?: string;
   district?: string;
   ward?: string;
   street?: string;
   detail?: string;
   isDefault: boolean;
   createdAt: string;
   updatedAt?: string;
   }

9. BankAccountReqDto
   {
   bankName?: string;
   bankCode?: string;
   accountNumber?: string;
   accountHolder?: string;
   }

10. BankAccountResDto
    {
    id: string;
    profileId: string;
    bankName?: string;
    bankCode?: string;
    accountNumber?: string;
    accountHolder?: string;
    createdAt: string;
    updatedAt?: string;
    }

11. ProductSearchParams
    {
    keyword?: string;
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    }

12. AddToCartRequestDto
    {
    productId: string;
    skuId: string;
    quantity: number;
    productName: string;
    productImage?: string;
    skuValue: string;
    }

13. UpdateCartItemRequestDto
    {
    cartItemId: string;
    quantity: number;
    }

14. CreateOrderRequestDto
    {
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

15. Order overview/detail models

- id
- code
- userId
- status
- paymentStatus
- paymentMethod
- totalPrice
- discount
- grandTotal
- createdAt
- updatedAt
- receiver
- items

16. CreatePaymentRequestDto
    {
    orderId: string;
    userId: string;
    amount: number;
    method: number;
    }

17. Chat DTO
    CreateConversationRequestDto
    {
    userId: string;
    adminId: string;
    }

AddMessageRequestDto
{
conversationId: string;
senderId: string;
content?: string;
}

18. Notification models

- unread count
- notification list
- mark as read action
- realtime status indicator

==================================================
D. CÁCH THIẾT KẾ TỪNG KHU VỰC
==================================================

1. HEADER

- Sticky header
- Logo
- Search bar lớn
- Category shortcut
- Notification icon
- Cart icon
- User menu
- Guest mode và logged-in mode rõ ràng

2. HOME

- Hero banner
- Danh mục nổi bật
- Flash sale
- Sản phẩm đề xuất
- Brand spotlight
- Deal section
- Floating chat support ở góc dưới phải

3. PRODUCT LISTING

- Chỉ dùng filter support bởi public API
- Search + category + brand + min/max price + pagination
- Không làm filter ảo thành fully functional nếu API chưa có
- Có empty result state
- Có loading skeleton

4. PRODUCT DETAIL

- Gallery ảnh
- Tên sản phẩm
- Giá
- Giá gốc / giảm giá nếu có
- Brand
- Category breadcrumb
- SKU/variant selector
- stock state
- Add to cart
- Buy now
- Chat support button
- related products

5. CART

- Cart item
- quantity stepper
- remove item
- subtotal
- checkout CTA
- empty cart

6. CHECKOUT

- receiver info
- chọn địa chỉ hoặc nhập nhanh nếu cần
- payment method: COD / Online Banking
- order summary
- confirm order
- validation rõ ràng

7. ORDER

- my orders
- order detail
- order status timeline read-only
- payment status
- order code
- createdAt
- actions hợp lý:
  - xem chi tiết
  - thanh toán lại nếu payment fail/pending
- không có control đổi status đơn hàng

8. PROFILE

- tab hoặc sidebar:
  - Hồ sơ của tôi
  - Địa chỉ
  - Tài khoản ngân hàng
  - Đổi mật khẩu
  - Đơn hàng của tôi
- Màn edit profile phải có avatar, họ tên, SĐT, giới tính, ngày sinh, bio

9. ADDRESS

- danh sách address card
- default badge
- add/edit modal hoặc page riêng
- delete confirm
- set default rõ ràng

10. BANK ACCOUNT

- danh sách tài khoản ngân hàng
- add/edit account
- fields: bankName, bankCode, accountNumber, accountHolder

11. CHANGE PASSWORD

- old password
- new password
- confirm new password ở UI level nếu cần
- success/error feedback

12. NOTIFICATION

- dropdown panel từ header
- full notification center page
- unread badge
- mark as read
- realtime state

13. CHAT SUPPORT

- FAB ở góc dưới phải
- click mở popup chat
- nếu chưa có conversation:
  - CTA “Bắt đầu chat”
- nếu đã có:
  - load conversation list / active thread
- message bubbles:
  - self
  - support/admin
  - system
- loading, empty, disconnected states

==================================================
E. COMPONENT VARIANTS CẦN CẬP NHẬT
==================================================

Tạo variants/state cho:

- Chat FAB: default / hover / unread / expanded
- Chat popup: empty / active / loading / error
- Header account menu: guest / logged-in
- Product filter chip: default / active / removable / disabled
- Order status badge: Pending / Confirmed / Shipping / Completed / Canceled
- Payment status badge: Pending / Processing / Success / Failed
- Address card: normal / selected / default / editing
- Bank account card: normal / editing / empty
- Profile form: default / dirty / validating / success / error
- Change password form: default / error / success
- Notification item: unread / read
- Cart item: default / updating / unavailable

==================================================
F. RESPONSIVE RULES
==================================================

- Desktop:
  - chat là popup từ góc dưới phải
  - filter có sidebar hoặc top bar
- Tablet:
  - filter thu gọn
  - chat popup nhỏ gọn hơn
- Mobile:
  - chat là bottom sheet hoặc full screen
  - filter là drawer
  - checkout và cart có bottom CTA
  - profile dùng stacked sections

==================================================
G. DEV HANDOFF - FEATURE-BASED TYPESCRIPT
==================================================

Hãy tạo 1 section handoff ghi rõ cấu trúc sau:

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
auth/
api/
components/
hooks/
pages/
types/
home/
components/
pages/
product/
api/
components/
hooks/
pages/
types/
cart/
api/
components/
hooks/
pages/
types/
checkout/
api/
components/
hooks/
pages/
types/
order/
api/
components/
hooks/
pages/
types/
payment/
api/
components/
hooks/
pages/
types/
profile/
api/
components/
hooks/
pages/
types/
notification/
api/
components/
hooks/
pages/
types/
chat/
api/
components/
hooks/
pages/
types/

Quy ước:

- shared/ chỉ chứa reusable UI và logic dùng chung
- mỗi feature có types riêng
- service layer tách theo endpoint
- DTO frontend đặt gần feature
- mapping response model rõ ràng
- auth token handling ở shared hoặc app layer
- logout là client-side action do swagger chưa có logout endpoint riêng

==================================================
H. OUTPUT TRONG FIGMA
==================================================

Tạo các page:

1. Design System
2. Updated User Flow
3. Desktop Screens
4. Mobile Adaptations
5. Components & Variants
6. API-aware Dev Handoff

Ưu tiên:

- triển khai thực tế được
- UI sạch, hiện đại, conversion-focused
- không vẽ các chức năng customer không support bởi API
- thể hiện rõ đâu là functional, đâu là read-only, đâu là coming soon

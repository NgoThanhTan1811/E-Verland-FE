# Seller Dashboard

Modern seller management dashboard với đầy đủ tính năng quản lý sản phẩm, đơn hàng, video, và nhiều hơn nữa.

## ✨ Features

- 📦 **Product Management** - Quản lý sản phẩm với đầy đủ CRUD operations
- 🛒 **Order Management** - Theo dõi và xử lý đơn hàng
- 🎥 **Video Upload** - Upload video với TUS protocol (resumable uploads)
- 💬 **Chat System** - Real-time chat với khách hàng
- 📊 **Dashboard & Analytics** - Thống kê và báo cáo chi tiết
- ⭐ **Review Management** - Quản lý đánh giá và phản hồi
- 🔔 **Notifications** - Hệ thống thông báo real-time
- 🌙 **Dark Mode** - Hỗ trợ giao diện tối

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm hoặc yarn

### Installation

1. Clone repository:

```bash
git clone <repository-url>
cd Seller
```

2. Cài đặt dependencies:

```bash
npm install
```

3. Chạy development server:

```bash
npm run dev
```

App sẽ chạy tại `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Build output sẽ nằm trong thư mục `dist/`

## 🎥 Video Upload với TUS Protocol

Project sử dụng TUS protocol để upload video với các tính năng:

- ✅ Resumable uploads - Tiếp tục upload khi bị gián đoạn
- ✅ Progress tracking - Theo dõi tiến trình upload
- ✅ Error handling - Xử lý lỗi tự động với retry
- ✅ Large file support - Hỗ trợ file lớn

### Cách sử dụng Video Upload:

1. Vào trang **Videos** từ sidebar
2. Click **Upload Video**
3. Chọn hoặc kéo thả file video (max 500MB)
4. Nhập title và description
5. Click **Upload Video**

Video sẽ được upload lên TUS server và tự động xử lý.

## 📁 Project Structure

```
Seller/
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/           # UI components (shadcn/ui)
│   │   ├── Orders/       # Order-related components
│   │   ├── Products/     # Product-related components
│   │   └── ...
│   ├── pages/            # Page components (routes)
│   ├── services/         # API services
│   │   ├── api.ts        # API endpoints
│   │   └── mockData.ts   # Mock data for development
│   ├── types/            # TypeScript types
│   ├── utils/            # Utility functions
│   ├── styles/           # Global styles
│   └── config/           # App configuration
├── .env.example          # Environment variables template
├── package.json
└── vite.config.ts        # Vite configuration
```

## 🛠 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **TUS Client** - Resumable file uploads
- **Lucide React** - Icons
- **Recharts** - Charts and analytics

## 📝 API Integration

Project hỗ trợ 2 modes:

1. **Mock Mode** (mặc định): Sử dụng mock data để phát triển UI
   - Toggle `USE_MOCK_DATA = true` trong `src/services/api.ts`

2. **API Mode**: Kết nối với backend thật
   - Toggle `USE_MOCK_DATA = false` trong `src/services/api.ts`
   - Đảm bảo API URLs được cấu hình đúng trong `.env`

## 🎨 UI Components

Project sử dụng shadcn/ui components với customization:

- Button, Input, Select, Dialog, etc.
- Fully typed with TypeScript
- Dark mode support
- Accessible by default

## 📚 Documentation

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Credits

- Design: [Figma Design](https://www.figma.com/design/zUGkLLhGe9qtxofueLgcY0/Seller)
- Icons: [Lucide](https://lucide.dev/)
- UI Components: [shadcn/ui](https://ui.shadcn.com/)

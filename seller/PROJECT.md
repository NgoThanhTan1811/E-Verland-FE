# Seller Hub — Project Overview

## Introduction

**Seller Hub** is a modern, full-featured seller management dashboard built as part of the OOSD (Object-Oriented Software Design) course project. It provides Vietnamese e-commerce sellers with a centralized interface to manage their store operations — from product listings and order fulfillment to customer communication and content publishing.

The application targets the Vietnamese market (currency: VND `₫`, locale `vi-VN`) and is designed to integrate with a dedicated seller backend API, while also supporting a mock-data mode for UI development and demos.

---

## Mission

Provide sellers on the TrustMeBro e-commerce platform with an intuitive, responsive, and real-time dashboard that streamlines day-to-day store management — reducing friction across product, order, content, and customer workflows.

---

## Core Features

| Feature                   | Description                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------- |
| **Dashboard & Analytics** | Overview of sales metrics, revenue charts (Recharts), and store performance         |
| **Product Management**    | Full CRUD for product listings with image upload, categories, and status management |
| **Order Management**      | View, filter, and update order statuses with detail tracking                        |
| **Video Upload**          | Upload promotional/product videos using the TUS resumable protocol (up to 500 MB)   |
| **Real-time Chat**        | Two-way messaging with customers via Socket.IO                                      |
| **Review Management**     | View customer reviews and post seller replies                                       |
| **Notifications**         | Real-time in-app notifications streamed via Server-Sent Events (SSE)                |
| **Reports**               | Generate and submit store performance reports                                       |
| **Dark Mode**             | Class-based light/dark theme toggle powered by `next-themes`                        |

---

## Tech Stack

### Language & Runtime

| Layer    | Technology | Version |
| -------- | ---------- | ------- |
| Language | TypeScript | 5.9     |
| Runtime  | Node.js    | 18+     |

### Frontend Framework

| Layer        | Technology   | Version |
| ------------ | ------------ | ------- |
| UI Framework | React        | 18.3    |
| Routing      | React Router | 7.13    |

### Build Tooling

| Tool                             | Purpose                         | Version |
| -------------------------------- | ------------------------------- | ------- |
| Vite                             | Dev server & production bundler | 6.3     |
| SWC (`@vitejs/plugin-react-swc`) | Fast TypeScript/JSX compilation | 3.10    |
| PostCSS                          | CSS processing pipeline         | 8.5     |
| Autoprefixer                     | CSS vendor prefix generation    | 10.4    |

### Styling

| Tool                       | Purpose                                       | Version |
| -------------------------- | --------------------------------------------- | ------- |
| Tailwind CSS               | Utility-first CSS framework                   | 4.1     |
| CSS Variables              | Design token system (colors, radius)          | —       |
| `class-variance-authority` | Component variant management (shadcn pattern) | 0.7     |
| `clsx` + `tailwind-merge`  | Conditional & conflict-safe class merging     | —       |

### UI Component Library

Built with **shadcn/ui** — unstyled Radix UI primitives wrapped in Tailwind + CVA:

- Accordion, Alert, AlertDialog, Avatar, Badge
- Button, Calendar, Card, Carousel
- Checkbox, Dialog, Drawer, DropdownMenu
- Form, Input, Label, Pagination, Popover
- Select, Sidebar, Skeleton, Sonner (toasts)
- Table, Tabs, Textarea, Tooltip

### Real-time & Communication

| Package                | Protocol                 | Use case                      |
| ---------------------- | ------------------------ | ----------------------------- |
| `socket.io-client` 4.8 | WebSocket (Socket.IO)    | Real-time customer chat       |
| Native `EventSource`   | Server-Sent Events (SSE) | Real-time notification stream |

### Media & File Handling

| Package         | Purpose                                | Version |
| --------------- | -------------------------------------- | ------- |
| `tus-js-client` | Resumable video uploads (TUS protocol) | 4.3     |

### Data & Forms

| Package            | Purpose                            | Version |
| ------------------ | ---------------------------------- | ------- |
| `recharts`         | Charts and data visualization      | 2.15    |
| `react-hook-form`  | Form state management & validation | 7.55    |
| `react-day-picker` | Date range picker component        | 8.10    |

### UX Utilities

| Package                | Purpose                   | Version |
| ---------------------- | ------------------------- | ------- |
| `lucide-react`         | Icon set                  | 0.487   |
| `sonner`               | Toast notification system | 2.0     |
| `next-themes`          | Dark/light mode theming   | 0.4     |
| `embla-carousel-react` | Carousel/slider component | 8.6     |
| `cmdk`                 | Command palette           | 1.1     |
| `vaul`                 | Drawer/bottom sheet       | 1.1     |

---

## Architecture

```
index.html
└── src/main.tsx              # React root mount
      └── src/App.tsx          # BrowserRouter + route declarations
            ├── /login          → Login.tsx          (public)
            ├── /forgot-password→ ForgotPassword.tsx (public)
            └── Layout.tsx      # Protected shell (sidebar + header)
                  ├── /               → Dashboard.tsx
                  ├── /products       → Products.tsx
                  ├── /products/create→ ProductForm.tsx
                  ├── /products/:id   → ProductForm.tsx
                  ├── /orders         → Orders.tsx
                  ├── /chat           → Chat.tsx
                  ├── /videos         → Videos.tsx
                  ├── /reviews        → Reviews.tsx
                  ├── /reports        → Reports.tsx
                  └── /notifications  → Notifications.tsx
```

### Source Layout

```
src/
├── App.tsx                  # Root component, routing
├── main.tsx                 # Application entry point
├── constants.ts             # App-wide runtime constants
├── components/
│   ├── Layout.tsx           # Sidebar + header shell
│   ├── GlobalSearch.tsx     # Global search bar
│   ├── DateRangePicker.tsx
│   ├── VideoUploadModal.tsx
│   └── ui/                  # shadcn/ui component library (30+ primitives)
├── pages/                   # One file per route
├── services/
│   └── api.ts               # All API client functions (REST + Socket.IO + SSE + TUS)
├── types/
│   └── index.ts             # TypeScript DTOs and interfaces
├── config/
│   └── app.ts               # APP_CONFIG: URLs, limits, feature flags, theme tokens
├── utils/
│   └── auth.ts              # Auth helpers (localStorage-based)
└── styles/
    ├── globals.css
    └── UploadVideo.css
```

### API Service Modules (`src/services/api.ts`)

| Export            | Endpoints                             | Transport        |
| ----------------- | ------------------------------------- | ---------------- |
| `authApi`         | `/auth/change-password`               | REST (User API)  |
| `dashboardApi`    | `/dashboard`                          | REST             |
| `productApi`      | `/product` (CRUD)                     | REST             |
| `orderApi`        | `/order` (CRUD)                       | REST             |
| `notificationApi` | `/notification`, `/notification/sse`  | REST + SSE       |
| `chatApi`         | `/chat/conversation`, `/chat/message` | REST + Socket.IO |
| `videoApi`        | `/video` (GET/DELETE + TUS upload)    | REST + TUS       |
| `reviewApi`       | `/review`, `/reply`                   | REST             |
| `reportApi`       | `/report`                             | REST (User API)  |

---

## Environment Variables

The following variables must be set in a `.env` file at the project root. **Do not commit real values.**

```env
# Seller backend API base URL
VITE_SELLER_URL=

# User/buyer API base URL
VITE_USER_URL=

# TUS resumable upload endpoint
VITE_TUS_ENDPOINT=

# Generic API base URL (used by APP_CONFIG)
VITE_API_BASE_URL=

# Socket.IO server URL (defaults to VITE_SELLER_URL without /api/v1 path)
VITE_SOCKET_URL=
```

---

## API Integration Modes

The app supports two modes controlled in `src/services/api.ts`:

| Mode          | Toggle                  | Behavior                                   |
| ------------- | ----------------------- | ------------------------------------------ |
| **Mock Mode** | `USE_MOCK_DATA = true`  | Uses local mock data — no backend required |
| **API Mode**  | `USE_MOCK_DATA = false` | Connects to real backend via `.env` URLs   |

---

## Configuration Defaults (`src/config/app.ts`)

| Setting                   | Default Value                  |
| ------------------------- | ------------------------------ |
| App name                  | `Seller Hub`                   |
| API base URL              | `http://localhost:8080/api/v1` |
| Dev server port           | `3000`                         |
| Items per page (products) | `12`                           |
| Items per page (orders)   | `10`                           |
| Max image upload size     | `10 MB`                        |
| Max video upload size     | `500 MB` (TUS)                 |
| SSE reconnect interval    | `5 000 ms`                     |
| SSE max retry attempts    | `5`                            |

### Feature Flags

All flags are enabled by default:

- `darkMode`
- `realTimeNotifications`
- `realTimeChat`
- `videoManagement`
- `advancedFilters`

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env
# Edit .env and fill in your API URLs

# 3. Start development server
npm run dev
# → http://localhost:8080

# 4. Production build
npm run build
# → build/
```

---

## Design Reference

UI was designed in Figma. See the [Figma file](https://www.figma.com/design/zUGkLLhGe9qtxofueLgcY0/Seller) for layout specs, component designs, and color tokens.

### Design Tokens (Tailwind CSS Variables)

The theme uses CSS custom properties mapped to Tailwind utility classes:

| Token                                  | Purpose                                       |
| -------------------------------------- | --------------------------------------------- |
| `--background` / `--foreground`        | Page background and primary text              |
| `--primary` / `--primary-foreground`   | Brand color and contrast text                 |
| `--secondary` / `--muted` / `--accent` | Supporting surface colors                     |
| `--destructive`                        | Error and danger states                       |
| `--card` / `--popover`                 | Elevated surface colors                       |
| `--border` / `--input` / `--ring`      | Interactive element chrome                    |
| `--radius`                             | Global border-radius scale (`lg`, `md`, `sm`) |

Dark mode is toggled by adding the `dark` class to the `<html>` element via `next-themes`.

---

## Credits

| Resource                  | Link                                                                            |
| ------------------------- | ------------------------------------------------------------------------------- |
| UI Components             | [shadcn/ui](https://ui.shadcn.com/)                                             |
| Radix UI Primitives       | [radix-ui.com](https://www.radix-ui.com/)                                       |
| Icons                     | [Lucide](https://lucide.dev/)                                                   |
| Charts                    | [Recharts](https://recharts.org/)                                               |
| Resumable Upload Protocol | [TUS](https://tus.io/)                                                          |
| Figma Design              | [Seller Figma File](https://www.figma.com/design/zUGkLLhGe9qtxofueLgcY0/Seller) |

---

## License

MIT License

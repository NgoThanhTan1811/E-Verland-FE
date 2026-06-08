import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { ProductForm } from "./pages/ProductForm";
import { ProductDetail } from "./pages/ProductDetail";
import { Orders } from "./pages/Orders";
import { Notifications } from "./pages/Notifications";
import { Chat } from "./pages/Chat";
import { Media } from "./pages/Media";
import { Categories } from "./pages/Categories";
import { CategoryForm } from "./pages/CategoryForm";
import { Brands } from "./pages/Brands";
import { BrandForm } from "./pages/BrandForm";
import { Users } from "./pages/Users";
import { UserForm } from "./pages/UserForm";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Toaster } from "./components/ui/sonner";
import { LanguageProvider } from "./contexts/LanguageContext";
// import { dashboardApi } from "./services/api";
import { isAuthenticated } from "./utils/auth";

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Only load counts if authenticated
    if (!isAuthenticated()) return;

    // Load initial unread counts
    loadUnreadCounts();

    // Poll for updates every 30 seconds
    const interval = setInterval(loadUnreadCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCounts = async () => {
    try {
      // TODO: Implement getUnreadCounts API endpoint
      // const counts = await dashboardApi.getUnreadCounts();
      // setUnreadNotifications(counts.notifications);
      // setUnreadMessages(counts.messages);
      setUnreadNotifications(0);
      setUnreadMessages(0);
    } catch (error) {
      console.error("Failed to load unread counts:", error);
    }
  };

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Shop Route (no layout) */}
          {/* <Route path="/shop" element={<Shop />} /> */}

          {/* Protected Routes with Layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout
                  unreadNotifications={unreadNotifications}
                  unreadMessages={unreadMessages}
                >
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/create" element={<ProductForm />} />
                    <Route path="/products/:id" element={<ProductDetail />} />
                    <Route
                      path="/products/:id/edit"
                      element={<ProductForm />}
                    />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/media" element={<Media />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/categories/create" element={<CategoryForm />} />
                    <Route path="/categories/:id/edit" element={<CategoryForm />} />
                    <Route path="/brands" element={<Brands />} />
                    <Route path="/brands/create" element={<BrandForm />} />
                    <Route path="/brands/:id/edit" element={<BrandForm />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/users/create" element={<UserForm />} />
                    <Route path="/users/:id/edit" element={<UserForm />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </LanguageProvider>
  );
}

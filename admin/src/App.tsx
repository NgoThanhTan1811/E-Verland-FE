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
import { Videos } from "./pages/Videos";
import { Reviews } from "./pages/Reviews";
import { Reports } from "./pages/Reports";
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
                    <Route path="/videos" element={<Videos />} />
                    <Route path="/reviews" element={<Reviews />} />
                    <Route path="/reports" element={<Reports />} />
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

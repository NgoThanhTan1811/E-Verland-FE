import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard.tsx";
import { Products } from "./pages/Products";
import { ProductForm } from "./pages/ProductForm";
import { Orders } from "./pages/Orders";
import { Notifications } from "./pages/Notifications";
import { Chat } from "./pages/Chat";
import { Media } from "./pages/Media";
import { Profile } from "./pages/Profile";
import { Categories } from "./pages/Categories";
import { Brands } from "./pages/Brands";
import { BankAccounts } from "./pages/BankAccounts";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Logout } from "./pages/Logout";
import { Toaster } from "./components/ui/sonner";
import { notificationApi } from "./services/api";
import { isAuthenticated, isSeller, logout, getSellerId } from "./utils/auth";
import { toast } from "sonner";

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated() || !isSeller()) {
    if (isAuthenticated()) {
      logout();
    }
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
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
    
    const sellerId = getSellerId();
    let eventSource: EventSource | null = null;
    
    try {
      eventSource = notificationApi.subscribeSSE((notification) => {
        toast.info(notification.title || "New Notification", {
          description: notification.content || "You have a new notification",
        });
        setUnreadNotifications((prev) => prev + 1);
      }, sellerId || undefined);
    } catch (err) {
      console.error("Failed to subscribe to notifications:", err);
    }

    return () => {
      clearInterval(interval);
      if (eventSource) {
        eventSource.close();
      }
    };
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
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/logout" element={<Logout />} />

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
                  <Route path="/products/:id" element={<ProductForm />} />
                  <Route path="/products/:id/edit" element={<ProductForm />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/media" element={<Media />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/brands" element={<Brands />} />
                  <Route path="/bank-accounts" element={<BankAccounts />} />
                  <Route
                    path="/bankaccount"
                    element={<Navigate to="/bank-accounts" replace />}
                  />
                  <Route
                    path="/videos"
                    element={<Navigate to="/media" replace />}
                  />
                  <Route
                    path="/reviews"
                    element={<Navigate to="/dashboard" replace />}
                  />
                  <Route
                    path="/reports"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

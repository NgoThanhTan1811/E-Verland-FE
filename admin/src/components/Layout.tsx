import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Bell,
  MessageSquare,
  Video,
  Star,
  FileText,
  LogOut,
  Menu,
  X,
  Store,
  User,
  Languages,
} from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { toast } from "sonner";
import { logout, getUserEmail } from "../utils/auth";
import { useLanguage } from "../contexts/LanguageContext";

interface LayoutProps {
  children: ReactNode;
  unreadNotifications?: number;
  unreadMessages?: number;
}

export function Layout({
  children,
  unreadNotifications = 0,
  unreadMessages = 0,
}: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const userEmail = getUserEmail() || "Seller";
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: t.nav.dashboard },
    { path: "/products", icon: Package, label: t.nav.products },
    { path: "/orders", icon: ShoppingCart, label: t.nav.orders },
    {
      path: "/notifications",
      icon: Bell,
      label: t.nav.notifications,
      badge: unreadNotifications,
    },
    {
      path: "/chat",
      icon: MessageSquare,
      label: t.nav.chat,
      badge: unreadMessages,
    },
    { path: "/videos", icon: Video, label: t.nav.videos },
    { path: "/reviews", icon: Star, label: t.nav.reviews },
    { path: "/reports", icon: FileText, label: t.nav.reports },
  ];

  const handleLogout = () => {
    // Clear authentication
    logout();

    // Show success toast
    toast.success("Logged out successfully", {
      description: "You have been logged out from your account.",
    });

    // Close dialog
    setShowLogoutDialog(false);

    // Redirect to login after a short delay to show toast
    setTimeout(() => {
      window.location.href = "/login";
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-64`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Seller Hub
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all ${sidebarOpen ? "lg:pl-64" : "pl-0"}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="h-full flex items-center justify-between gap-4 px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search */}
            <div className="flex-1 max-w-2xl">
              <GlobalSearch />
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Language Switcher */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <Languages className="w-4 h-4" />
                  <span className="text-sm font-medium uppercase">
                    {language}
                  </span>
                </button>
                <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={() => setLanguage("en")}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors ${
                      language === "en"
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                        : ""
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage("vi")}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors ${
                      language === "vi"
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                        : ""
                    }`}
                  >
                    Tiếng Việt
                  </button>
                </div>
              </div>

              {/* Shop Button */}
              <Link
                to={`${import.meta.env.VITE_USER_URL || "/"}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all shadow-sm hover:shadow-md"
                title="Buy"
              >
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">
                  Buy
                </span>
              </Link>

              {/* Notification Bell */}
              <Link
                to="/notifications"
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Link>

              {/* Chat Shortcut */}
              <Link
                to="/chat"
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </Link>

              {/* User Avatar */}
              <div className="flex items-center gap-2 pl-3 border-l border-gray-200 dark:border-gray-800">
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                    {userEmail?.charAt(0).toUpperCase() || "S"}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-sm font-medium text-gray-900 dark:text-white leading-none mb-1">
                      {userEmail?.split("@")[0] || "Seller"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-none">
                      Seller
                    </p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={() => setShowLogoutDialog(true)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title={t.nav.logout}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to logout?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will be logged out from your seller account. Any unsaved
              changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

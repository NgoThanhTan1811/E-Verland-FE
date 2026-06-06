import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Bell,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Store,
  Image,
  Tags,
  BadgeDollarSign,
  UserCircle2,
  Landmark,
  Sparkles,
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
import { getUserEmail } from "../utils/auth";

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
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const userEmail = getUserEmail() || "Seller";

  const navSections = [
    {
      title: "Overview",
      items: [
        { path: "/", icon: LayoutDashboard, label: "Dashboard" },
        { path: "/profile", icon: UserCircle2, label: "Profile" },
        { path: "/bank-accounts", icon: Landmark, label: "Bank Account" },
      ],
    },
    {
      title: "Commerce",
      items: [
        { path: "/products", icon: Package, label: "Products" },
        { path: "/categories", icon: Tags, label: "Categories" },
        { path: "/brands", icon: BadgeDollarSign, label: "Brands" },
        { path: "/orders", icon: ShoppingCart, label: "Orders" },
      ],
    },
    {
      title: "Operations",
      items: [
        { path: "/media", icon: Image, label: "Media" },
        {
          path: "/notifications",
          icon: Bell,
          label: "Notifications",
          badge: unreadNotifications,
        },
        {
          path: "/chat",
          icon: MessageSquare,
          label: "Chat",
          badge: unreadMessages,
        },
      ],
    },
  ];

  const handleLogout = () => {
    // Close dialog
    setShowLogoutDialog(false);

    // Route-driven logout keeps auth cleanup in one place.
    navigate("/logout");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,_#020617_0%,_#0f172a_100%)]">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-72 shadow-2xl shadow-slate-900/5`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
            <div>
              <h1 className="text-xl font-semibold">Seller Hub</h1>
              <p className="text-xs text-white/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Commerce workspace
              </p>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {navSections.map((section) => (
              <div key={section.title}>
                <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">
                  {section.title}
                </p>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      location.pathname.startsWith(`${item.path}/`);
                    const Icon = item.icon;

                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative border ${
                            isActive
                              ? "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-sm"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800 border-transparent"
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
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all ${sidebarOpen ? "lg:pl-64" : "pl-0"}`}>
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800/80">
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
              {/* Shop Button */}
              <Link
                to="/"
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white hover:from-blue-600 hover:to-cyan-700 transition-all shadow-sm hover:shadow-md"
                title="Home"
              >
                <Store className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">
                  Home
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
                  title="Logout"
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

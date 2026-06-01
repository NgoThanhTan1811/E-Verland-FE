import { Link } from "react-router";
import {
  Search,
  ShoppingCart,
  Bell,
  User,
  Menu,
  LogOut,
  Package,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../shared/contexts/auth-context";
import { DEFAULT_AVATAR_URL } from "../constants";
import { cartService } from "../../../shared/services/cart.service";
import { notificationService } from "../../../shared/services/notification.service";
import { mediaService } from "../../../shared/services/media.service";
import {
  productService,
  CategoryResponse,
} from "../../../shared/services/product.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

export function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_URL);
  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const { isAuthenticated, user, logout } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const loadCounts = async () => {
      if (!isAuthenticated || !user?.id) {
        if (isMounted) {
          setCartCount(0);
          setUnreadCount(0);
        }
        return;
      }

      try {
        const [cartRes, unreadRes] = await Promise.all([
          cartService.getCart(user.id).catch(() => null),
          notificationService.getUnreadCount(user.id).catch(() => null),
        ]);

        if (!isMounted) return;

        setCartCount(cartRes?.items?.length || 0);
        setUnreadCount(unreadRes?.count || 0);
      } catch {
        if (isMounted) {
          setCartCount(0);
          setUnreadCount(0);
        }
      }
    };

    const resolveAvatar = async () => {
      const source = user?.profile?.avatarUrl || "";
      if (!source) {
        setAvatarUrl(DEFAULT_AVATAR_URL);
        return;
      }

      const resolved = await mediaService.getMediaUrl(source, "sm");
      if (isMounted) {
        setAvatarUrl(resolved || DEFAULT_AVATAR_URL);
      }
    };

    const loadCategories = async () => {
      try {
        const res = await productService.getCategories();
        if (isMounted) {
          setCategories(res || []);
        }
      } catch {
        if (isMounted) {
          setCategories([]);
        }
      }
    };

    resolveAvatar();
    loadCounts();
    loadCategories();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id, user?.profile?.avatarUrl]);

  const visibleCategories = categories.slice(0, 6);

  const handleLogout = async () => {
    await logout();
    setShowLogoutDialog(false);
    window.location.href = "/";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?keyword=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span>Hotline: 1900-xxxx</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">
                Miễn phí vận chuyển đơn từ 500k
              </span>
            </div>
            <div className="hidden md:flex items-center gap-4">
              <Link to="/notifications" className="hover:underline">
                Thông báo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <div className="text-2xl font-bold text-primary">E-Verland</div>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm, danh mục, thương hiệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-3 rounded-lg border-2 border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link
              to="/cart"
              className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-error-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <Link
              to="/notifications"
              className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors hidden md:block"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-error text-error-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* User Menu - Guest vs Logged In */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                    <img
                      src={avatarUrl}
                      alt={user?.username || "User"}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                    <span className="hidden lg:block font-medium">
                      {user?.profile?.firstName ||
                        user?.username ||
                        "Tài khoản"}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-neutral-500">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Tài khoản của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-orders" className="cursor-pointer">
                      <Package className="mr-2 h-4 w-4" />
                      Đơn hàng của tôi
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="cursor-pointer">
                      <Bell className="mr-2 h-4 w-4" />
                      Thông báo
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={() => setShowLogoutDialog(true)}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Categories navigation */}
        <nav className="mt-4 hidden md:flex items-center gap-6 text-sm">
          {visibleCategories.map((category) => (
            <Link
              key={category.id}
              to={`/products?categoryId=${category.id}`}
              className="hover:text-primary transition-colors"
            >
              {category.name}
            </Link>
          ))}
          <Link
            to="/products?sale=flash"
            className="text-error hover:text-error/80 transition-colors font-medium"
          >
            Flash Sale ⚡
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-3">
            {visibleCategories.map((category) => (
              <Link
                key={category.id}
                to={`/products?categoryId=${category.id}`}
                className="py-2 hover:text-primary transition-colors"
              >
                {category.name}
              </Link>
            ))}
            <Link
              to="/products?sale=flash"
              className="py-2 text-error font-medium"
            >
              Flash Sale ⚡
            </Link>
          </nav>
        </div>
      )}

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận đăng xuất</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Đăng xuất
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}

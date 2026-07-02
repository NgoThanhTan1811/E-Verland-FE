import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  User,
  MapPin,
  CreditCard,
  Lock,
  Bell,
  ShoppingBag,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../../shared/contexts/auth-context";
import { DEFAULT_AVATAR_URL } from "../../shared/constants";
import { ProfileResponse } from "../../../shared/services/profile.service";
import { orderService } from "../../../shared/services/order.service";
import {
  accountService,
  MeAccountResponse,
} from "../../../shared/services/account.service";
import { mediaService } from "../../../shared/services/media.service";
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

export function ProfilePage() {
  const { isAuthenticated, user, logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [me, setMe] = useState<MeAccountResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_URL);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippingOrders: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    let isMounted = true;

    if (!isAuthenticated) return;

    const fetchProfile = async () => {
      try {
        const meRes = await accountService.me();
        const userId = meRes.account.id || user?.id;
        const ordersRes = userId
          ? await orderService.getOrders({ userId, page: 1, limit: 100 })
          : { items: [] };

        if (!isMounted) return;

        setMe(meRes);
        setProfile(meRes.profile);

        const resolvedAvatar = await mediaService.getMediaUrl(
          meRes.profile?.avatarUrl || user?.profile?.avatarUrl || "",
          "sm",
        );
        if (isMounted) {
          setAvatarUrl(resolvedAvatar || DEFAULT_AVATAR_URL);
        }

        const orderItems = ordersRes.items || [];
        setStats({
          totalOrders: orderItems.length,
          pendingOrders: orderItems.filter((order) => order.status === 0)
            .length,
          shippingOrders: orderItems.filter((order) => order.status === 2)
            .length,
          completedOrders: orderItems.filter((order) => order.status === 3)
            .length,
        });
      } catch {
        if (!isMounted) return;

        setMe(null);
        setProfile(null);
        setAvatarUrl(DEFAULT_AVATAR_URL);
        setStats({
          totalOrders: 0,
          pendingOrders: 0,
          shippingOrders: 0,
          completedOrders: 0,
        });
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id]);

  const handleLogout = async () => {
    await logout();
    setShowLogoutDialog(false);
    window.location.href = "/";
  };

  const menuItems = [
    {
      icon: User,
      title: "Hồ sơ cá nhân",
      description: "Quản lý thông tin cá nhân",
      link: "/profile/edit",
    },
    {
      icon: ShoppingBag,
      title: "Đơn hàng của tôi",
      description: "Xem và quản lý đơn hàng",
      link: "/my-orders",
    },
    {
      icon: MapPin,
      title: "Địa chỉ",
      description: "Quản lý địa chỉ giao hàng",
      link: "/profile/addresses",
    },
    {
      icon: CreditCard,
      title: "Tài khoản ngân hàng",
      description: "Quản lý phương thức thanh toán",
      link: "/profile/bank-accounts",
    },
    {
      icon: Lock,
      title: "Đổi mật khẩu",
      description: "Thay đổi mật khẩu tài khoản",
      link: "/profile/change-password",
    },
    {
      icon: Bell,
      title: "Thông báo",
      description: "Cài đặt thông báo",
      link: "/notifications",
    },
  ];

  const getInitials = () => {
    const displayProfile = profile || user?.profile;

    if (displayProfile?.firstName && displayProfile?.lastName) {
      return `${displayProfile.lastName.charAt(0)}${displayProfile.firstName.charAt(0)}`.toUpperCase();
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  let displayName = me?.account.username || user?.username || "Người dùng";
  if (profile?.firstName && profile?.lastName) {
    displayName = `${profile.lastName} ${profile.firstName}`;
  } else if (user?.profile?.firstName && user?.profile?.lastName) {
    displayName = `${user.profile.lastName} ${user.profile.firstName}`;
  }

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Tài khoản của tôi</h1>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="text-center mb-6">
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 mx-auto mb-4 rounded-full object-cover border-4 border-primary/10"
                />
                <h2 className="text-xl font-semibold mb-1">{displayName}</h2>
                <p className="text-neutral-600 text-sm">
                  {me?.account.email || user?.email}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-neutral-600">Thành viên từ</span>
                  <span className="font-medium">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString("vi-VN")
                      : "Đang tải"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-neutral-600">Tổng đơn hàng</span>
                  <span className="font-medium">{stats.totalOrders}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-600">Điểm tích lũy</span>
                  <span className="font-medium text-primary">0</span>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutDialog(true)}
                className="w-full mt-6 flex items-center justify-center gap-2 p-3 text-error hover:bg-error/10 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Đăng xuất
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-2 gap-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.link}
                    to={item.link}
                    className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary border-2 border-transparent transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-xl p-6">
                <p className="text-sm opacity-90 mb-1">Đơn hàng chờ xác nhận</p>
                <p className="text-3xl font-bold">{stats.pendingOrders}</p>
              </div>
              <div className="bg-gradient-to-br from-secondary to-secondary/80 text-white rounded-xl p-6">
                <p className="text-sm opacity-90 mb-1">Đơn hàng đang giao</p>
                <p className="text-3xl font-bold">{stats.shippingOrders}</p>
              </div>
              <div className="bg-gradient-to-br from-success to-success/80 text-white rounded-xl p-6">
                <p className="text-sm opacity-90 mb-1">Đơn hàng hoàn thành</p>
                <p className="text-3xl font-bold">{stats.completedOrders}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}

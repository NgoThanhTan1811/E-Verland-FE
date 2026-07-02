import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, MapPin, Plus, Edit, Trash2, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
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
import { AddressLabelMap } from "../../../shared/types/domain";
import {
  profileService,
  AddressResponse,
} from "../../../shared/services/profile.service";
import { useAuth } from "../../../shared/contexts/auth-context";
import { accountService } from "../../../shared/services/account.service";
import { toast } from "sonner";

export function AddressListPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState("");
  const [meProfile, setMeProfile] = useState<any | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }
    let isMounted = true;

    const loadAddresses = async () => {
      setIsLoading(true);
      try {
        const me = await accountService.me();
        setMeProfile(me.profile || null);
        const nextProfileId = me.profile?.id || user.profile?.id || "";
        if (!isMounted) return;
        setProfileId(nextProfileId);

        if (!nextProfileId) {
          setAddresses([]);
          return;
        }

        const data = await profileService.getAddresses(nextProfileId);
        if (!isMounted) return;
        setAddresses(data || []);
      } catch {
        if (isMounted) setAddresses([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadAddresses();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, navigate]);

  const handleSetDefault = async (id: string) => {
    try {
      await profileService.updateAddress(profileId, id, { isDefault: true });
      setAddresses((prev) =>
        prev.map((addr) => ({ ...addr, isDefault: addr.id === id })),
      );
      toast.success("Đã đặt làm địa chỉ mặc định");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);
    try {
      await profileService.deleteAddress(profileId, deleteId);
      setAddresses((prev) => prev.filter((addr) => addr.id !== deleteId));
      toast.success("Đã xóa địa chỉ");
      setDeleteId(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: AddressResponse) => {
    return [
      address.detail,
      address.street,
      address.ward,
      address.district,
      address.city,
    ]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Địa chỉ của tôi</h1>
          </div>
          <Button
            onClick={() => {
              // require basic profile info before allowing add
              if (!meProfile || !meProfile.firstName || !meProfile.lastName) {
                toast.info("Vui lòng cập nhật hồ sơ trước khi thêm địa chỉ");
                navigate("/profile/edit");
                return;
              }
              navigate("/profile/addresses/new");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm địa chỉ
          </Button>
        </div>

        {/* Address List */}
        {addresses.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm p-12 text-center">
            <MapPin className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chưa có địa chỉ</h3>
            <p className="text-neutral-500 mb-6">
              Thêm địa chỉ để dễ dàng thanh toán hơn
            </p>
            <Link to="/profile/addresses/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm địa chỉ mới
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-card rounded-xl shadow-sm p-6 border-2 transition-all ${
                  address.isDefault
                    ? "border-primary"
                    : "border-transparent hover:border-neutral-200"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline">
                        {AddressLabelMap[address.label]}
                      </Badge>
                      {address.isDefault && (
                        <Badge className="bg-primary text-primary-foreground">
                          <Check className="h-3 w-3 mr-1" />
                          Mặc định
                        </Badge>
                      )}
                    </div>
                    <p className="text-foreground font-medium mb-1">
                      {formatAddress(address)}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {address.city}, {address.province}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/profile/addresses/${address.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(address.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                {!address.isDefault && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                      disabled={isLoading}
                    >
                      Đặt làm mặc định
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

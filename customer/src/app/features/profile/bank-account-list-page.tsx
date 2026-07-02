import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, CreditCard, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
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
import {
  profileService,
  BankAccountResponse,
} from "../../../shared/services/profile.service";
import { useAuth } from "../../../shared/contexts/auth-context";
import { accountService } from "../../../shared/services/account.service";
import { toast } from "sonner";

export function BankAccountListPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<BankAccountResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }
    let isMounted = true;

    const loadAccounts = async () => {
      setIsLoading(true);
      try {
        const me = await accountService.me();
        const nextProfileId = me.profile?.id || user.profile?.id || "";
        if (!isMounted) return;
        setProfileId(nextProfileId);

        if (!nextProfileId) {
          setAccounts([]);
          return;
        }

        const data = await profileService.getBankAccounts(nextProfileId);
        if (!isMounted) return;
        setAccounts(data || []);
      } catch {
        if (isMounted) setAccounts([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadAccounts();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, navigate]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);
    try {
      await profileService.deleteBankAccount(profileId, deleteId);
      setAccounts((prev) => prev.filter((acc) => acc.id !== deleteId));
      toast.success("Đã xóa tài khoản ngân hàng");
      setDeleteId(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setIsLoading(false);
    }
  };

  const maskAccountNumber = (number: string) => {
    if (number.length <= 4) return number;
    const lastFour = number.slice(-4);
    const masked = "*".repeat(number.length - 4);
    return masked + lastFour;
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
            <h1 className="text-3xl font-bold">Tài khoản ngân hàng</h1>
          </div>
          <Link to="/profile/bank-accounts/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm tài khoản
            </Button>
          </Link>
        </div>

        {/* Bank Account List */}
        {accounts.length === 0 ? (
          <div className="bg-card rounded-xl shadow-sm p-12 text-center">
            <CreditCard className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Chưa có tài khoản ngân hàng
            </h3>
            <p className="text-neutral-500 mb-6">
              Thêm tài khoản ngân hàng để nhận hoàn tiền dễ dàng hơn
            </p>
            <Link to="/profile/bank-accounts/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm tài khoản mới
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="bg-card rounded-xl shadow-sm p-6 border border-border hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {account.bankName}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          {account.bankCode}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1 pl-15">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-500">
                          Số tài khoản:
                        </span>
                        <span className="font-mono font-medium">
                          {maskAccountNumber(account.accountNumber)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-500">
                          Chủ tài khoản:
                        </span>
                        <span className="font-medium">
                          {account.accountHolder}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link to={`/profile/bank-accounts/${account.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(account.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900">
            <strong>Lưu ý:</strong> Thông tin tài khoản ngân hàng của bạn được
            bảo mật và chỉ sử dụng cho mục đích hoàn tiền, thanh toán trong hệ
            thống E-Verland.
          </p>
        </div>
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
              Bạn có chắc chắn muốn xóa tài khoản ngân hàng này? Hành động này
              không thể hoàn tác.
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

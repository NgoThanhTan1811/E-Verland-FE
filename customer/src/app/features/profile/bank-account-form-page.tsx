import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useAuth } from "../../../shared/contexts/auth-context";
import { accountService } from "../../../shared/services/account.service";
import { profileService } from "../../../shared/services/profile.service";
import { toast } from "sonner";
import banksData from "../../../public/bank/banks.json";

const vietnameseBanks = (banksData.data || [])
  .filter((bank) => bank.supported !== false)
  .map((bank) => ({
    code: String(bank.code || "").trim(),
    name: String(bank.short_name || bank.name || "").trim(),
  }))
  .filter((bank) => bank.code && bank.name)
  .sort((a, b) => a.name.localeCompare(b.name));

export function BankAccountFormPage() {
  const { accountId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isEditMode = !!accountId;
  const [isLoading, setIsLoading] = useState(false);
  const [profileId, setProfileId] = useState("");

  const [formData, setFormData] = useState({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    let isMounted = true;

    const loadBankAccount = async () => {
      setIsLoading(true);
      try {
        const me = await accountService.me();
        const nextProfileId = me.profile?.id || user.profile?.id || "";
        if (!isMounted) return;
        setProfileId(nextProfileId);

        if (isEditMode && accountId && nextProfileId) {
          const data = await profileService.getBankAccount(
            nextProfileId,
            accountId,
          );
          if (!isMounted) return;

          const matchedBank = vietnameseBanks.find(
            (bank) =>
              bank.code === data.bankCode || bank.name === data.bankName,
          );

          setFormData({
            bankCode: data.bankCode || matchedBank?.code || "",
            bankName: data.bankName || matchedBank?.name || "",
            accountNumber: data.accountNumber || "",
            accountHolder: data.accountHolder || "",
          });
        }
      } catch (error: unknown) {
        if (isMounted) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Không thể tải thông tin tài khoản",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadBankAccount();

    return () => {
      isMounted = false;
    };
  }, [accountId, isAuthenticated, isEditMode, navigate, user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBankSelect = (bankCode: string) => {
    const bank = vietnameseBanks.find((b) => b.code === bankCode);
    if (bank) {
      setFormData((prev) => ({
        ...prev,
        bankCode: bank.code,
        bankName: bank.name,
      }));
    }
  };

  const handleBankNameSelect = (bankName: string) => {
    const bank = vietnameseBanks.find((b) => b.name === bankName);
    if (bank) {
      setFormData((prev) => ({
        ...prev,
        bankCode: bank.code,
        bankName: bank.name,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.bankCode) newErrors.bankCode = "Vui lòng chọn ngân hàng";
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = "Vui lòng nhập số tài khoản";
    } else if (!/^[0-9]{8,20}$/.test(formData.accountNumber)) {
      newErrors.accountNumber = "Số tài khoản không hợp lệ (8-20 chữ số)";
    }
    if (!formData.accountHolder.trim()) {
      newErrors.accountHolder = "Vui lòng nhập tên chủ tài khoản";
    } else if (!/^[A-Z\s]+$/.test(formData.accountHolder)) {
      newErrors.accountHolder = "Tên chủ tài khoản phải viết IN HOA không dấu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!profileId) {
      toast.error("Vui lòng cập nhật hồ sơ trước khi thêm tài khoản ngân hàng");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        bankName: formData.bankName,
        bankCode: formData.bankCode,
        accountNumber: formData.accountNumber,
        accountHolder: formData.accountHolder,
      };

      if (isEditMode && accountId) {
        await profileService.updateBankAccount(profileId, accountId, payload);
      } else {
        await profileService.createBankAccount(profileId, payload);
      }

      toast.success(
        isEditMode
          ? "Cập nhật tài khoản thành công"
          : "Thêm tài khoản thành công",
      );
      navigate("/profile/bank-accounts");
    } catch (error) {
      toast.error("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/profile/bank-accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {isEditMode ? "Chỉnh sửa tài khoản" : "Thêm tài khoản ngân hàng"}
          </h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-xl shadow-sm p-6 space-y-6"
        >
          {/* Bank Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">
                Tên ngân hàng <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.bankName}
                onValueChange={handleBankNameSelect}
              >
                <SelectTrigger
                  className={errors.bankCode ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Chọn tên ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {vietnameseBanks.map((bank) => (
                    <SelectItem key={bank.name} value={bank.name}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bankCode && (
                <p className="text-sm text-red-500">{errors.bankCode}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankCode">
                Mã ngân hàng <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.bankCode}
                onValueChange={handleBankSelect}
              >
                <SelectTrigger
                  className={errors.bankCode ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Chọn mã ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {vietnameseBanks.map((bank) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bankCode && (
                <p className="text-sm text-red-500">{errors.bankCode}</p>
              )}
            </div>
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">
              Số tài khoản <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountNumber"
              type="text"
              value={formData.accountNumber}
              onChange={(e) => {
                // Only allow numbers
                const value = e.target.value.replace(/\D/g, "");
                handleChange("accountNumber", value);
              }}
              placeholder="1234567890"
              maxLength={20}
              className={errors.accountNumber ? "border-red-500" : ""}
            />
            {errors.accountNumber && (
              <p className="text-sm text-red-500">{errors.accountNumber}</p>
            )}
            <p className="text-sm text-neutral-500">Nhập 8-20 chữ số</p>
          </div>

          {/* Account Holder */}
          <div className="space-y-2">
            <Label htmlFor="accountHolder">
              Tên chủ tài khoản <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountHolder"
              type="text"
              value={formData.accountHolder}
              onChange={(e) => {
                // Convert to uppercase and remove accents
                const value = e.target.value.toUpperCase();
                handleChange("accountHolder", value);
              }}
              placeholder="NGUYEN VAN A"
              className={errors.accountHolder ? "border-red-500" : ""}
            />
            {errors.accountHolder && (
              <p className="text-sm text-red-500">{errors.accountHolder}</p>
            )}
            <p className="text-sm text-neutral-500">
              Nhập tên IN HOA không dấu (theo đúng tên trên thẻ ngân hàng)
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ thông tin trước khi
              lưu. Thông tin sai có thể dẫn đến việc hoàn tiền không thành công.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/profile/bank-accounts")}
              disabled={isLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? "Cập nhật" : "Thêm tài khoản"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

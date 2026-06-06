import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
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
import { locationService } from "../../../shared/services/location.service";
import { toast } from "sonner";

export function AddressFormPage() {
  const { addressId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isEditMode = !!addressId;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [profileId, setProfileId] = useState("");

  const [formData, setFormData] = useState({
    label: "0",
    provinceId: "",
    districtId: "",
    wardId: "",
    street: "",
    detail: "",
    isDefault: false,
  });

  const [locationData, setLocationData] = useState<{
    provinces: Array<{ id: number; name: string }>;
    districts: Array<{ id: number; name: string; provinceId: number }>;
    wards: Array<{
      id: number;
      name: string;
      districtId: number;
      provinceId: number;
    }>;
  }>({
    provinces: [],
    districts: [],
    wards: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      try {
        const me = await accountService.me();
        if (!isMounted) return;

        const nextProfileId = me.profile?.id || user.profile?.id || "";
        setProfileId(nextProfileId);

        // If creating a new address, require basic profile info (first & last name)
        if (!isEditMode) {
          const profile = me.profile || user.profile;
          if (!profile || !profile.firstName || !profile.lastName) {
            toast.info("Vui lòng cập nhật hồ sơ trước khi thêm địa chỉ");
            navigate("/profile/edit");
            return;
          }
        }
      } catch {
        if (isMounted) {
          setProfileId(user.profile?.id || "");
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    let isMounted = true;

    const loadLocations = async () => {
      setIsLoadingLocations(true);
      try {
        const data = await locationService.loadLocationData();
        if (!isMounted) return;
        setLocationData(data);
      } catch {
        if (isMounted) {
          toast.error("Không thể tải danh sách địa chỉ");
        }
      } finally {
        if (isMounted) {
          setIsLoadingLocations(false);
        }
      }
    };

    void loadLocations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode || !addressId || !profileId) return;
    let isMounted = true;

    const loadAddress = async () => {
      setIsLoading(true);
      try {
        const data = await profileService.getAddress(profileId, addressId);
        if (!isMounted) return;

        const wardIdFromResponse = data.wardId ?? Number(data.wardCode || 0);

        setFormData({
          label: String(data.label ?? "0"),
          provinceId: data.provinceId ? String(data.provinceId) : "",
          districtId: data.districtId ? String(data.districtId) : "",
          wardId: wardIdFromResponse ? String(wardIdFromResponse) : "",
          street: data.street || "",
          detail: data.detail || "",
          isDefault: !!data.isDefault,
        });
      } catch (error: unknown) {
        if (isMounted) {
          toast.error(
            error instanceof Error ? error.message : "Không thể tải địa chỉ",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadAddress();

    return () => {
      isMounted = false;
    };
  }, [addressId, isEditMode, profileId]);

  useEffect(() => {
    if (!formData.provinceId || !formData.districtId || !formData.wardId)
      return;
  }, [formData.provinceId, formData.districtId, formData.wardId]);

  const selectedProvinceId = Number(formData.provinceId || 0);
  const selectedDistrictId = Number(formData.districtId || 0);

  const provinceOptions = useMemo(
    () =>
      [...locationData.provinces].sort((a, b) => a.name.localeCompare(b.name)),
    [locationData.provinces],
  );

  const districtOptions = useMemo(() => {
    if (!selectedProvinceId) return [];
    return locationData.districts
      .filter((district) => district.provinceId === selectedProvinceId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [locationData.districts, selectedProvinceId]);

  const wardOptions = useMemo(() => {
    if (!selectedProvinceId || !selectedDistrictId) return [];
    return locationData.wards
      .filter(
        (ward) =>
          ward.provinceId === selectedProvinceId &&
          ward.districtId === selectedDistrictId,
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [locationData.wards, selectedProvinceId, selectedDistrictId]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.provinceId)
      newErrors.provinceId = "Vui lòng chọn Tỉnh/Thành phố";
    if (!formData.districtId) newErrors.district = "Vui lòng chọn Quận/Huyện";
    if (!formData.wardId) newErrors.ward = "Vui lòng chọn Phường/Xã";
    if (!formData.street.trim()) newErrors.street = "Vui lòng nhập tên đường";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!profileId) {
      toast.error("Vui lòng cập nhật hồ sơ trước khi thêm địa chỉ");
      return;
    }

    setIsLoading(true);

    try {
      const wardIdNum = Number(formData.wardId);
      const payload = {
        label: Number(formData.label),
        provinceId: Number(formData.provinceId),
        districtId: Number(formData.districtId),
        wardId: wardIdNum,
        // GHN wardCode = string của wardId, gửi cả hai để BE lưu
        wardCode: wardIdNum ? String(wardIdNum) : undefined,
        street: formData.street,
        detail: formData.detail,
        isDefault: formData.isDefault,
      };

      if (isEditMode && addressId) {
        await profileService.updateAddress(profileId, addressId, payload);
      } else {
        await profileService.createAddress(profileId, payload);
      }

      toast.success(
        isEditMode ? "Cập nhật địa chỉ thành công" : "Thêm địa chỉ thành công",
      );
      navigate("/profile/addresses");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra, vui lòng thử lại",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/profile/addresses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            {isEditMode ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
          </h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-xl shadow-sm p-6 space-y-6"
        >
          {/* Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Loại địa chỉ</Label>
            <select
              id="label"
              value={formData.label}
              onChange={(e) => handleChange("label", e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-input-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="0">Nhà riêng</option>
              <option value="1">Văn phòng</option>
              <option value="2">Khác</option>
            </select>
          </div>

          {/* Province */}
          <div className="space-y-2">
            <Label htmlFor="provinceSelect">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.provinceId}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  provinceId: value,
                  districtId: "",
                  wardId: "",
                }));
              }}
              disabled={isLoadingLocations}
            >
              <SelectTrigger
                id="provinceSelect"
                className={errors.provinceId ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Chọn tỉnh/thành phố" />
              </SelectTrigger>
              <SelectContent>
                {provinceOptions.map((province) => (
                  <SelectItem key={province.id} value={String(province.id)}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.provinceId && (
              <p className="text-sm text-red-500">{errors.provinceId}</p>
            )}
          </div>

          {/* District */}
          <div className="space-y-2">
            <Label htmlFor="districtSelect">
              Quận/Huyện <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.districtId}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  districtId: value,
                  wardId: "",
                }));
              }}
              disabled={!formData.provinceId || isLoadingLocations}
            >
              <SelectTrigger
                id="districtSelect"
                className={errors.district ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Chọn quận/huyện" />
              </SelectTrigger>
              <SelectContent>
                {districtOptions.map((district) => (
                  <SelectItem key={district.id} value={String(district.id)}>
                    {district.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.district && (
              <p className="text-sm text-red-500">{errors.district}</p>
            )}
          </div>

          {/* Ward */}
          <div className="space-y-2">
            <Label htmlFor="wardSelect">
              Phường/Xã <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.wardId}
              onValueChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  wardId: value,
                }));
              }}
              disabled={!formData.districtId || isLoadingLocations}
            >
              <SelectTrigger
                id="wardSelect"
                className={errors.ward ? "border-red-500" : ""}
              >
                <SelectValue placeholder="Chọn phường/xã" />
              </SelectTrigger>
              <SelectContent>
                {wardOptions.map((ward) => (
                  <SelectItem key={ward.id} value={String(ward.id)}>
                    {ward.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.ward && (
              <p className="text-sm text-red-500">{errors.ward}</p>
            )}
          </div>

          {isLoadingLocations && (
            <p className="text-sm text-neutral-500">
              Đang tải danh sách tỉnh/thành, quận/huyện, phường/xã...
            </p>
          )}

          {/* Street */}
          <div className="space-y-2">
            <Label htmlFor="street">
              Tên đường <span className="text-red-500">*</span>
            </Label>
            <Input
              id="street"
              value={formData.street}
              onChange={(e) => handleChange("street", e.target.value)}
              placeholder="Ví dụ: 123 Đường Nguyễn Huệ"
              className={errors.street ? "border-red-500" : ""}
            />
            {errors.street && (
              <p className="text-sm text-red-500">{errors.street}</p>
            )}
          </div>

          {/* Detail */}
          <div className="space-y-2">
            <Label htmlFor="detail">Chi tiết (Tòa nhà, số tầng, v.v.)</Label>
            <Input
              id="detail"
              value={formData.detail}
              onChange={(e) => handleChange("detail", e.target.value)}
              placeholder="Ví dụ: Tầng 5, Tòa nhà A"
            />
          </div>

          {/* Is Default */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) =>
                handleChange("isDefault", checked as boolean)
              }
            />
            <Label
              htmlFor="isDefault"
              className="text-sm font-normal cursor-pointer"
            >
              Đặt làm địa chỉ mặc định
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/profile/addresses")}
              disabled={isLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditMode ? "Cập nhật" : "Thêm địa chỉ"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

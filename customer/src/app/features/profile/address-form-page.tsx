import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import { useAuth } from "../../../shared/contexts/auth-context";
import { accountService } from "../../../shared/services/account.service";
import { profileService } from "../../../shared/services/profile.service";
import { locationService } from "../../../shared/services/location.service";
import { toast } from "sonner";

const MAX_LOCATION_SUGGESTIONS = 20;

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

  const [provinceQuery, setProvinceQuery] = useState("");
  const [districtQuery, setDistrictQuery] = useState("");
  const [wardQuery, setWardQuery] = useState("");
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

        setProvinceQuery(data.province || data.city || "");
        setDistrictQuery(data.district || "");
        setWardQuery(data.ward || "");
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
    if (!formData.provinceId) return;
    const selected = locationData.provinces.find(
      (item) => item.id === Number(formData.provinceId),
    );
    if (selected) {
      setProvinceQuery(selected.name);
    }
  }, [formData.provinceId, locationData.provinces]);

  useEffect(() => {
    if (!formData.districtId) return;
    const selected = locationData.districts.find(
      (item) => item.id === Number(formData.districtId),
    );
    if (selected) {
      setDistrictQuery(selected.name);
    }
  }, [formData.districtId, locationData.districts]);

  useEffect(() => {
    if (!formData.wardId) return;
    const selected = locationData.wards.find(
      (item) => item.id === Number(formData.wardId),
    );
    if (selected) {
      setWardQuery(selected.name);
    }
  }, [formData.wardId, locationData.wards]);

  const selectedProvinceId = Number(formData.provinceId || 0);
  const selectedDistrictId = Number(formData.districtId || 0);

  const provinceSuggestions = useMemo(
    () =>
      locationService.searchProvinces(
        locationData,
        provinceQuery,
        MAX_LOCATION_SUGGESTIONS,
      ),
    [locationData, provinceQuery],
  );

  const districtSuggestions = useMemo(() => {
    if (!selectedProvinceId) return [];
    return locationService.searchDistricts(
      locationData,
      selectedProvinceId,
      districtQuery,
      MAX_LOCATION_SUGGESTIONS,
    );
  }, [locationData, selectedProvinceId, districtQuery]);

  const wardSuggestions = useMemo(() => {
    if (!selectedProvinceId || !selectedDistrictId) return [];
    return locationService.searchWards(
      locationData,
      selectedProvinceId,
      selectedDistrictId,
      wardQuery,
      MAX_LOCATION_SUGGESTIONS,
    );
  }, [locationData, selectedProvinceId, selectedDistrictId, wardQuery]);

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
      const payload = {
        label: Number(formData.label),
        provinceId: Number(formData.provinceId),
        districtId: Number(formData.districtId),
        wardId: Number(formData.wardId),
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
            <Label htmlFor="provinceInput">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </Label>
            <Input
              id="provinceInput"
              list="province-suggestions"
              value={provinceQuery}
              onChange={(e) => {
                setProvinceQuery(e.target.value);
                setDistrictQuery("");
                setWardQuery("");
                setFormData((prev) => ({
                  ...prev,
                  provinceId: "",
                  districtId: "",
                  wardId: "",
                }));
              }}
              placeholder="Nhập để tìm tỉnh/thành"
              className={errors.provinceId ? "border-red-500" : ""}
              disabled={isLoadingLocations}
            />
            <datalist id="province-suggestions">
              {provinceSuggestions.map((province) => (
                <option key={province.id} value={province.name} />
              ))}
            </datalist>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const selected = provinceSuggestions.find(
                    (item) =>
                      item.name.toLowerCase() === provinceQuery.toLowerCase(),
                  );
                  if (!selected) {
                    toast.error("Vui lòng chọn tỉnh/thành từ danh sách gợi ý");
                    return;
                  }

                  setFormData((prev) => ({
                    ...prev,
                    provinceId: String(selected.id),
                    districtId: "",
                    wardId: "",
                  }));
                  setProvinceQuery(selected.name);
                  setDistrictQuery("");
                  setWardQuery("");
                }}
                disabled={isLoadingLocations}
              >
                Xác nhận tỉnh/thành
              </Button>
              {formData.provinceId && (
                <p className="text-sm text-neutral-600 self-center">
                  ID: {formData.provinceId}
                </p>
              )}
            </div>
            {errors.provinceId && (
              <p className="text-sm text-red-500">{errors.provinceId}</p>
            )}
          </div>

          {/* District */}
          <div className="space-y-2">
            <Label htmlFor="districtInput">
              Quận/Huyện <span className="text-red-500">*</span>
            </Label>
            <Input
              id="districtInput"
              list="district-suggestions"
              value={districtQuery}
              onChange={(e) => {
                setDistrictQuery(e.target.value);
                setWardQuery("");
                setFormData((prev) => ({
                  ...prev,
                  districtId: "",
                  wardId: "",
                }));
              }}
              placeholder="Nhập để tìm quận/huyện"
              className={errors.district ? "border-red-500" : ""}
              disabled={!formData.provinceId || isLoadingLocations}
            />
            <datalist id="district-suggestions">
              {districtSuggestions.map((district) => (
                <option key={district.id} value={district.name} />
              ))}
            </datalist>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const selected = districtSuggestions.find(
                    (item) =>
                      item.name.toLowerCase() === districtQuery.toLowerCase(),
                  );
                  if (!selected) {
                    toast.error("Vui lòng chọn quận/huyện từ danh sách gợi ý");
                    return;
                  }

                  setFormData((prev) => ({
                    ...prev,
                    districtId: String(selected.id),
                    wardId: "",
                  }));
                  setDistrictQuery(selected.name);
                  setWardQuery("");
                }}
                disabled={!formData.provinceId || isLoadingLocations}
              >
                Xác nhận quận/huyện
              </Button>
              {formData.districtId && (
                <p className="text-sm text-neutral-600 self-center">
                  ID: {formData.districtId}
                </p>
              )}
            </div>
            {errors.district && (
              <p className="text-sm text-red-500">{errors.district}</p>
            )}
          </div>

          {/* Ward */}
          <div className="space-y-2">
            <Label htmlFor="wardInput">
              Phường/Xã <span className="text-red-500">*</span>
            </Label>
            <Input
              id="wardInput"
              list="ward-suggestions"
              value={wardQuery}
              onChange={(e) => {
                setWardQuery(e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  wardId: "",
                }));
              }}
              placeholder="Nhập để tìm phường/xã"
              className={errors.ward ? "border-red-500" : ""}
              disabled={!formData.districtId || isLoadingLocations}
            />
            <datalist id="ward-suggestions">
              {wardSuggestions.map((ward) => (
                <option key={ward.id} value={ward.name} />
              ))}
            </datalist>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const selected = wardSuggestions.find(
                    (item) =>
                      item.name.toLowerCase() === wardQuery.toLowerCase(),
                  );
                  if (!selected) {
                    toast.error("Vui lòng chọn phường/xã từ danh sách gợi ý");
                    return;
                  }

                  setFormData((prev) => ({
                    ...prev,
                    wardId: String(selected.id),
                  }));
                  setWardQuery(selected.name);
                }}
                disabled={!formData.districtId || isLoadingLocations}
              >
                Xác nhận phường/xã
              </Button>
              {formData.wardId && (
                <p className="text-sm text-neutral-600 self-center">
                  ID: {formData.wardId}
                </p>
              )}
            </div>
            {errors.ward && (
              <p className="text-sm text-red-500">{errors.ward}</p>
            )}
          </div>

          {isLoadingLocations && (
            <p className="text-sm text-neutral-500">
              Đang tải danh sách tỉnh/thành, quận/huyện, phường/xã...
            </p>
          )}

          {/* City & Province */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provinceId">Mã tỉnh</Label>
              <Input id="provinceId" value={formData.provinceId} readOnly />
            </div>

            <div className="space-y-2">
              <Label htmlFor="districtId">Mã quận/huyện</Label>
              <Input id="districtId" value={formData.districtId} readOnly />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="wardId">Mã phường/xã</Label>
            <Input id="wardId" value={formData.wardId} readOnly />
          </div>

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

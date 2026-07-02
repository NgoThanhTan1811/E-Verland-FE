import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { useAuth } from "../../../shared/contexts/auth-context";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { DEFAULT_AVATAR_URL } from "../../shared/constants";
import { profileService } from "../../../shared/services/profile.service";
import { accountService } from "../../../shared/services/account.service";
import { mediaService } from "../../../shared/services/media.service";
import { toast } from "sonner";

export function EditProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR_URL);
  const [accountId, setAccountId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [hasProfile, setHasProfile] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    gender: "0",
    dateOfBirth: "",
    bio: "",
    avatarUrl: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const me = await accountService.me();
        const profile = me.profile || user.profile;
        const nextAccountId = me.account.id || user.id || "";
        const nextProfileId = me.profile?.id || user.profile?.id || "";

        if (!isMounted) return;

        setAccountId(nextAccountId);
        setProfileId(nextProfileId);
        setHasProfile(!!nextProfileId);

        const resolvedAvatar = await mediaService.getMediaUrl(
          profile?.avatarUrl || "",
          "sm",
        );

        setFormData({
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
          phoneNumber: profile?.phoneNumber || "",
          gender: profile?.gender?.toString() || "0",
          dateOfBirth: profile?.dateOfBirth || "",
          bio: profile?.bio || "",
          avatarUrl: profile?.avatarUrl || "",
        });

        setAvatarPreview(resolvedAvatar || DEFAULT_AVATAR_URL);
      } catch {
        if (!isMounted) return;

        const fallbackProfile = user.profile;
        setAccountId(user.id || "");
        setProfileId(fallbackProfile?.id || "");
        setHasProfile(!!fallbackProfile?.id);
        const resolvedAvatar = await mediaService.getMediaUrl(
          fallbackProfile?.avatarUrl || "",
          "sm",
        );

        setFormData({
          firstName: fallbackProfile?.firstName || "",
          lastName: fallbackProfile?.lastName || "",
          phoneNumber: fallbackProfile?.phoneNumber || "",
          gender: fallbackProfile?.gender?.toString() || "0",
          dateOfBirth: fallbackProfile?.dateOfBirth || "",
          bio: fallbackProfile?.bio || "",
          avatarUrl: fallbackProfile?.avatarUrl || "",
        });

        setAvatarPreview(resolvedAvatar || DEFAULT_AVATAR_URL);
      } finally {
        if (isMounted) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [navigate, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Vui lòng nhập tên";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Vui lòng nhập họ";
    }

    if (formData.phoneNumber && !/^[0-9]{10,11}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Số điện thoại không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (!user) throw new Error("Không tìm thấy thông tin người dùng");

      const profilePayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        gender: parseInt(formData.gender),
        dateOfBirth: formData.dateOfBirth || undefined,
        bio: formData.bio || undefined,
        avatarUrl: formData.avatarUrl || undefined,
      };

      const updatedProfile =
        hasProfile && profileId
          ? await profileService.updateProfile(
              accountId || user.id,
              profilePayload,
            )
          : await profileService.createProfile(
              accountId || user.id,
              profilePayload,
            );

      setProfileId(updatedProfile.id);
      setHasProfile(true);

      updateUser({
        ...user,
        id: accountId || user.id,
        profile: {
          id: updatedProfile.id,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          phoneNumber: updatedProfile.phoneNumber,
          gender: updatedProfile.gender,
          dateOfBirth: updatedProfile.dateOfBirth,
          bio: updatedProfile.bio,
          avatarUrl: updatedProfile.avatarUrl,
        },
      });

      toast.success(
        hasProfile ? "Cập nhật thông tin thành công" : "Tạo hồ sơ thành công",
      );
      navigate("/profile");
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

  const handleAvatarUpload = () => {
    // Simulate avatar upload - in real app would use file input
    toast.info("Chức năng upload ảnh đại diện đang được phát triển");
  };

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Chỉnh sửa hồ sơ</h1>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-xl shadow-sm p-6 space-y-6"
        >
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {formData.avatarUrl ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/10"
                />
              ) : (
                <img
                  src={DEFAULT_AVATAR_URL}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/10"
                />
              )}
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAvatarUpload}
              >
                <Upload className="h-4 w-4 mr-2" />
                Tải ảnh lên
              </Button>
              <p className="text-sm text-neutral-500 mt-2">
                JPG, PNG hoặc GIF. Tối đa 2MB.
              </p>
            </div>
          </div>

          {/* Name */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Họ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Nguyễn Văn"
                className={errors.lastName ? "border-red-500" : ""}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">
                Tên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                placeholder="A"
                className={errors.firstName ? "border-red-500" : ""}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Số điện thoại</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              placeholder="0987654321"
              className={errors.phoneNumber ? "border-red-500" : ""}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Gender & Birthday */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gender">Giới tính</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleChange("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Nam</SelectItem>
                  <SelectItem value="1">Nữ</SelectItem>
                  <SelectItem value="2">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Ngày sinh</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange("dateOfBirth", e.target.value)}
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Giới thiệu</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              placeholder="Viết vài dòng giới thiệu về bản thân..."
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-neutral-500 text-right">
              {formData.bio.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/profile")}
              disabled={isLoading}
              className="flex-1"
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

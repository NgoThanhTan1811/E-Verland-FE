import { useEffect, useMemo, useState } from "react";
import {
  UserCircle2,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { profileApi } from "../services/api";
import type {
  User_AccountMeResDto,
  User_AddressResDto,
  User_Gender,
} from "../types";
import { toast } from "sonner";
import { locationService } from "../services/location";

type ProfileForm = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  dateOfBirth: string;
  avatarUrl: string;
  bio: string;
  gender: User_Gender | number;
};

type AddressForm = {
  id?: string;
  label: number;
  detail: string;
  street: string;
  provinceId: string;
  districtId: string;
  wardId: string;
};

const emptyProfileForm: ProfileForm = {
  firstName: "",
  lastName: "",
  phoneNumber: "",
  dateOfBirth: "",
  avatarUrl: "",
  bio: "",
  gender: 0,
};

const emptyAddressForm: AddressForm = {
  label: 0,
  detail: "",
  street: "",
  provinceId: "",
  districtId: "",
  wardId: "",
};

export function Profile() {
  const [accountMe, setAccountMe] = useState<User_AccountMeResDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileForm>(emptyProfileForm);
  const [addressForm, setAddressForm] = useState<AddressForm>(emptyAddressForm);

  const account = accountMe?.account;
  const profile = accountMe?.profile;
  const addresses = accountMe?.addresses || [];
  const profileId = profile?.id;

  const isProfileReady = useMemo(() => Boolean(account?.id), [account?.id]);

  useEffect(() => {
    loadProfile();
  }, []);

  const unwrapMe = (response: any): User_AccountMeResDto | null => {
    const payload = response?.data ?? response;
    if (payload?.account || payload?.profile)
      return payload as User_AccountMeResDto;
    return null;
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await profileApi.getMe();
      const payload = unwrapMe(response);
      setAccountMe(payload);

      if (payload?.profile) {
        setProfileForm({
          firstName: payload.profile.firstName || "",
          lastName: payload.profile.lastName || "",
          phoneNumber: payload.profile.phoneNumber || "",
          dateOfBirth: payload.profile.dateOfBirth
            ? payload.profile.dateOfBirth.slice(0, 10)
            : "",
          avatarUrl: payload.profile.avatarUrl || "",
          bio: payload.profile.bio || "",
          gender: payload.profile.gender || 0,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load profile");
      setAccountMe(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!account?.id) {
      toast.error("No account found");
      return;
    }

    try {
      setSavingProfile(true);
      const payload = {
        firstName: profileForm.firstName || undefined,
        lastName: profileForm.lastName || undefined,
        phoneNumber: profileForm.phoneNumber || undefined,
        dateOfBirth: profileForm.dateOfBirth || undefined,
        avatarUrl: profileForm.avatarUrl || undefined,
        bio: profileForm.bio || undefined,
        gender: profileForm.gender,
      };

      if (profile?.id) {
        await profileApi.updateProfile(account.id, payload);
        toast.success("Profile updated");
      } else {
        await profileApi.createProfile(account.id, payload);
        toast.success("Profile created");
      }

      await loadProfile();
    } catch (error) {
      console.error(error);
      toast.error("Could not save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEditAddress = (address: User_AddressResDto) => {
    setAddressForm({
      id: address.id,
      label: address.label ?? 0,
      detail: address.detail || "",
      street: address.street || "",
      provinceId: address.provinceId ? String(address.provinceId) : "",
      districtId: address.districtId ? String(address.districtId) : "",
      wardId: address.wardId ? String(address.wardId) : "",
    });
  };

  const resetAddressForm = () => setAddressForm(emptyAddressForm);

  const handleSaveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profileId) {
      toast.error("Create a profile first");
      return;
    }

    try {
      setSavingAddress(true);
      const payload = {
        label: addressForm.label,
        detail: addressForm.detail || undefined,
        street: addressForm.street,
        provinceId: Number(addressForm.provinceId),
        districtId: Number(addressForm.districtId),
        wardId: Number(addressForm.wardId),
      };

      if (addressForm.id) {
        await profileApi.updateAddress(profileId, addressForm.id, payload);
        toast.success("Address updated");
      } else {
        await profileApi.createAddress(profileId, payload);
        toast.success("Address added");
      }

      resetAddressForm();
      await loadProfile();
    } catch (error) {
      console.error(error);
      toast.error("Could not save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!profileId || !confirm("Delete this address?")) return;

    try {
      await profileApi.deleteAddress(profileId, addressId);
      toast.success("Address deleted");
      await loadProfile();
    } catch (error) {
      console.error(error);
      toast.error("Could not delete address");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-sky-100 dark:border-sky-900 bg-gradient-to-r from-white via-sky-50 to-cyan-50 dark:from-gray-900 dark:via-sky-950/30 dark:to-cyan-950/30 p-6 lg:p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">
          <UserCircle2 className="w-3.5 h-3.5" />
          Account workspace
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">
          Profile
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          Edit your seller profile, keep addresses in sync, and manage the
          account identity used by the hub.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Account overview
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60">
              <p className="text-gray-500 dark:text-gray-400">Account email</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {account?.email || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60">
              <p className="text-gray-500 dark:text-gray-400">Username</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {account?.username || "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60">
              <p className="text-gray-500 dark:text-gray-400">Role</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {(() => {
                  if (account?.role === undefined || account?.role === null) return "Seller";
                  const roleStr = String(account.role).toLowerCase();
                  if (roleStr === "0" || roleStr === "admin") return "Admin";
                  if (roleStr === "1" || roleStr === "user") return "User";
                  if (roleStr === "2" || roleStr === "seller") return "Seller";
                  return String(account.role);
                })()}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60">
              <p className="text-gray-500 dark:text-gray-400">Profile status</p>
              <p className="mt-1 font-medium text-gray-900 dark:text-white">
                {profile ? "Ready" : "Not created"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                First name
                <input
                  value={profileForm.firstName}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      firstName: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last name
                <input
                  value={profileForm.lastName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, lastName: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone number
                <input
                  value={profileForm.phoneNumber}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      phoneNumber: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Date of birth
                <input
                  type="date"
                  value={profileForm.dateOfBirth}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      dateOfBirth: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                Avatar URL
                <input
                  value={profileForm.avatarUrl}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      avatarUrl: e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Gender
                <select
                  value={profileForm.gender}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      gender: Number(e.target.value) as User_Gender,
                    })
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                >
                  <option value={0}>Male</option>
                  <option value={1}>Female</option>
                  <option value={2}>Other</option>
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bio
              <textarea
                value={profileForm.bio}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, bio: e.target.value })
                }
                rows={4}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
              />
            </label>

            <button
              type="submit"
              disabled={savingProfile || !isProfileReady}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 font-medium text-white transition hover:bg-sky-700 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {savingProfile
                ? "Saving..."
                : profile
                  ? "Update profile"
                  : "Create profile"}
            </button>
            {!isProfileReady ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                If the account record is missing, sign in again to refresh the
                session data.
              </p>
            ) : null}
          </form>
        </section>

        <section className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Addresses
          </div>

          {profileId ? (
            <>
              <form
                onSubmit={handleSaveAddress}
                className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {addressForm.id ? "Edit address" : "New address"}
                  </h3>
                  {addressForm.id ? (
                    <button
                      type="button"
                      onClick={resetAddressForm}
                      className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      Reset
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Label
                    <select
                      value={addressForm.label}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          label: Number(e.target.value),
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <option value={0}>Home</option>
                      <option value={1}>Office</option>
                      <option value={2}>Other</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Street
                    <input
                      value={addressForm.street}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          street: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900"
                      required
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Province
                    <select
                      value={addressForm.provinceId}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          provinceId: e.target.value,
                          districtId: "",
                          wardId: "",
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900"
                      required
                    >
                      <option value="">Select Province</option>
                      {locationService.getLocationDataSync().provinces.map((p) => (
                        <option key={p.id} value={String(p.id)}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    District
                    <select
                      value={addressForm.districtId}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          districtId: e.target.value,
                          wardId: "",
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900"
                      required
                      disabled={!addressForm.provinceId}
                    >
                      <option value="">Select District</option>
                      {locationService.getLocationDataSync().districts
                        .filter((d) => d.provinceId === Number(addressForm.provinceId))
                        .map((d) => (
                          <option key={d.id} value={String(d.id)}>{d.name}</option>
                        ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ward
                    <select
                      value={addressForm.wardId}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          wardId: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900"
                      required
                      disabled={!addressForm.districtId}
                    >
                      <option value="">Select Ward</option>
                      {locationService.getLocationDataSync().wards
                        .filter((w) => w.districtId === Number(addressForm.districtId))
                        .map((w) => (
                          <option key={w.id} value={String(w.id)}>{w.name}</option>
                        ))}
                    </select>
                  </label>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                    Detail
                    <textarea
                      value={addressForm.detail}
                      onChange={(e) =>
                        setAddressForm({
                          ...addressForm,
                          detail: e.target.value,
                        })
                      }
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={savingAddress}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  {savingAddress
                    ? "Saving..."
                    : addressForm.id
                      ? "Update address"
                      : "Add address"}
                </button>
              </form>

              <div className="space-y-3">
                {addresses.length > 0 ? (
                  addresses.map((address) => (
                    <div
                      key={address.id}
                      className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {address.detail || address.street || "Address"}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {[
                              address.street,
                              address.ward || locationService.getWardName(address.wardId || 0),
                              address.district || locationService.getDistrictName(address.districtId || 0),
                              address.province || address.city || locationService.getProvinceName(address.provinceId || 0),
                            ]
                              .filter(Boolean)
                              .join(", ")}{" "}
                            {address.isDefault ? "• Default" : ""}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 break-all">
                            {address.id}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    No addresses yet
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
              Create a profile before managing addresses.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

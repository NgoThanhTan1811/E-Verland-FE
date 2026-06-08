import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, User, MapPin, CreditCard, Plus, Trash2, Edit } from "lucide-react";
import { userApi, profileApi, addressApi, bankApi } from "../services/api";
import { toast } from "sonner";
import provincesData from "../public/locations/provinces.json";
import districtsData from "../public/locations/districts.json";
import wardsData from "../public/locations/wards.json";

type TabType = "account" | "address" | "bank";

export function UserForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [activeTab, setActiveTab] = useState<TabType>("account");
  const [loading, setLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Account State
  const [accountData, setAccountData] = useState({
    email: "",
    username: "",
    password: "",
    role: "User",
    status: "Active"
  });

  // Profile State
  const [profileData, setProfileData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    gender: "Male",
    bio: "",
    dateOfBirth: "",
    avatarUrl: ""
  });

  // Associated Data
  const [addresses, setAddresses] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);

  useEffect(() => {
    if (isEditing && id) {
      loadFullUserData(id);
    }
  }, [id, isEditing]);

  const loadFullUserData = async (accountId: string) => {
    try {
      setLoading(true);
      // 1. Load Account
      const acc = await userApi.getById(accountId);
      setAccountData({
        email: acc.email || "",
        username: acc.username || "",
        password: "", // don't load password
        role: acc.role || "User",
        status: acc.status || "Active"
      });

      // 2. Load Profile
      try {
        const prof = await profileApi.getByAccount(accountId);
        if (prof) {
          setProfileData({
            id: prof.id,
            firstName: prof.firstName || "",
            lastName: prof.lastName || "",
            phoneNumber: prof.phoneNumber || "",
            gender: prof.gender || "Male",
            bio: prof.bio || "",
            dateOfBirth: prof.dateOfBirth ? prof.dateOfBirth.split('T')[0] : "",
            avatarUrl: prof.avatarUrl || ""
          });

          // 3. Load Addresses & Banks if Profile exists
          const [addrs, bks] = await Promise.all([
            addressApi.getByProfile(prof.id).catch(() => []),
            bankApi.getByProfile(prof.id).catch(() => [])
          ]);
          setAddresses(Array.isArray(addrs) ? addrs : []);
          setBanks(Array.isArray(bks) ? bks : []);
        }
      } catch (err) {
        console.log("No profile found for this account", err);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      toast.error("Failed to load user data");
      navigate("/users");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      if (isEditing && id) {
        // Update Account
        const accPayload: any = {
          username: accountData.username,
          role: accountData.role,
          status: accountData.status
        };
        if (accountData.password) accPayload.password = accountData.password;
        await userApi.update(id, accPayload);

        // Update or Create Profile
        const profPayload = {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phoneNumber: profileData.phoneNumber,
          gender: profileData.gender,
          bio: profileData.bio,
          dateOfBirth: profileData.dateOfBirth || null,
          avatarUrl: profileData.avatarUrl
        };

        if (profileData.id) {
          await profileApi.update(id, profPayload); // Assuming PATCH /profile/{accountId}
        } else {
          await profileApi.create(id, profPayload); // Assuming POST /profile?accountId={id}
        }

        toast.success("User updated successfully");
        loadFullUserData(id);
      } else {
        // Create Account
        const newAcc = await userApi.create({
          email: accountData.email,
          username: accountData.username,
          password: accountData.password
        });
        
        // Wait, the API returns the new account ID
        const newAccountId = newAcc.id || newAcc.Id || (newAcc.data && newAcc.data.id);
        if (newAccountId) {
          // Attempt to create basic profile immediately
          try {
             await profileApi.create(newAccountId, {
               firstName: profileData.firstName || "Unknown",
               lastName: profileData.lastName || "User",
               phoneNumber: profileData.phoneNumber || ""
             });
          } catch(e) {
            console.error("Profile creation failed", e);
          }
          toast.success("User created successfully");
          navigate(`/users/${newAccountId}/edit`);
        } else {
           toast.success("User created successfully");
           navigate("/users");
        }
      }
    } catch (error) {
      toast.error(isEditing ? "Failed to update user" : "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----- Sub-forms handlers for Addresses & Banks can be implemented similarly using modals or inline forms -----
  // For simplicity, we just list them or show a "Not supported yet" placeholder, but let's implement basic Add logic.

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/users")}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? "Edit User" : "Create User"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isEditing ? "Manage account, profile, addresses and banks" : "Add a new user to the system"}
          </p>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "account"
              ? "border-blue-600 text-blue-600 dark:text-blue-500"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <User className="w-4 h-4" /> Account & Profile
        </button>
        <button
          onClick={() => setActiveTab("address")}
          disabled={!isEditing}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === "address"
              ? "border-blue-600 text-blue-600 dark:text-blue-500"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <MapPin className="w-4 h-4" /> Addresses
        </button>
        <button
          onClick={() => setActiveTab("bank")}
          disabled={!isEditing}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === "bank"
              ? "border-blue-600 text-blue-600 dark:text-blue-500"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <CreditCard className="w-4 h-4" /> Bank Accounts
        </button>
      </div>

      {activeTab === "account" && (
        <form onSubmit={handleAccountSubmit} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Account */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Account Credentials</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={accountData.email}
                  onChange={e => setAccountData({...accountData, email: e.target.value})}
                  required={!isEditing}
                  disabled={isEditing}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={accountData.username}
                  onChange={e => setAccountData({...accountData, username: e.target.value})}
                  required
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password {isEditing && <span className="text-xs text-gray-400 font-normal">(leave blank to keep current)</span>}
                  {!isEditing && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  value={accountData.password}
                  onChange={e => setAccountData({...accountData, password: e.target.value})}
                  required={!isEditing}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {isEditing && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    <select
                      value={accountData.role}
                      onChange={e => setAccountData({...accountData, role: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Admin">Admin</option>
                      <option value="User">User</option>
                      <option value="Seller">Seller</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={accountData.status}
                      onChange={e => setAccountData({...accountData, status: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Banned">Banned</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Profile */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">Profile Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={e => setProfileData({...profileData, firstName: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={e => setProfileData({...profileData, lastName: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profileData.phoneNumber}
                    onChange={e => setProfileData({...profileData, phoneNumber: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={profileData.dateOfBirth}
                    onChange={e => setProfileData({...profileData, dateOfBirth: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                  <select
                    value={profileData.gender}
                    onChange={e => setProfileData({...profileData, gender: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Avatar URL</label>
                  <input
                    type="url"
                    value={profileData.avatarUrl}
                    onChange={e => setProfileData({...profileData, avatarUrl: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={e => setProfileData({...profileData, bio: e.target.value})}
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="px-6 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : "Save Account & Profile"}
            </button>
          </div>
        </form>
      )}

      {/* Placeholder for Address & Bank Tabs */}
      {activeTab === "address" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden p-6 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Addresses List</h3>
          <p className="text-gray-500 mb-6">User has {addresses.length} addresses configured.</p>
          {/* Note: Full inline editing for addresses can be built here. For now it's a read-only list for admin. */}
          {addresses.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {addresses.map((a: any, i) => (
                  <div key={i} className="p-4 border rounded-lg dark:border-gray-700">
                    <p className="font-semibold">{profileData.firstName || "User"} {profileData.lastName || ""}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{profileData.phoneNumber || "No phone number"}</p>
                    <p className="text-sm mt-2">
                      {[a.street, a.detail].filter(Boolean).join(", ")}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {wardsData.find((w: any) => w.id === a.wardId)?.name || a.wardId},{" "}
                      {districtsData.find((d: any) => d.id === a.districtId)?.name || a.districtId},{" "}
                      {provincesData.find((p: any) => p.id === a.provinceId)?.name || a.provinceId}
                    </p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded mt-2 inline-block">
                      {a.label || "Home"}
                    </span>
                    {a.isDefault && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded mt-2 inline-block">Default</span>}
                  </div>
                ))}
             </div>
          )}
        </div>
      )}

      {activeTab === "bank" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden p-6 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Bank Accounts</h3>
          <p className="text-gray-500 mb-6">User has {banks.length} bank accounts configured.</p>
          {banks.length > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {banks.map((b: any, i) => (
                  <div key={i} className="p-4 border rounded-lg dark:border-gray-700 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{b.bankName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mt-1">{b.accountNumber}</p>
                      <p className="text-xs text-gray-500 mt-1 uppercase">{b.accountName}</p>
                    </div>
                    {b.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Default</span>}
                  </div>
                ))}
             </div>
          )}
        </div>
      )}

    </div>
  );
}

import { useEffect, useState } from "react";
import { Search, Filter, Plus, Edit, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../services/api";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { PaginationControls } from "../components/PaginationControls";

export function Users() {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Inactive": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      case "Banned": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, [roleFilter, page, limit]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (roleFilter) params.role = roleFilter;
      const response = await userApi.getAll(params);
      const items = response.items || response.data?.items || response.data || response || [];
      setUsers(Array.isArray(items) ? items : []);
      setTotal(response.totalItems || response.data?.totalItems || items.length || 0);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Failed to load users");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };



  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await userApi.delete(id);
      toast.success("User deleted successfully");
      loadUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t.nav.users || "Users"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage system users
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
            <option value="Seller">Seller</option>
          </select>
          <button
            onClick={() => navigate("/users/create")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-900 dark:text-white font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Username / Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {user.email || user.username || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 capitalize">
                      {user.role || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/users/${user.id}/edit`)} className="p-2 text-gray-400 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && total > 0 && (
          <PaginationControls
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            itemName={t.nav.users?.toLowerCase() || "users"}
          />
        )}
      </div>
    </div>
  );
}

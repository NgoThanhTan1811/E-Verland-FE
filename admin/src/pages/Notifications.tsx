import { useEffect, useState } from "react";
import { Send, Users, Radio, RefreshCw } from "lucide-react";
import { notificationApi, userApi } from "../services/api";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";

export function Notifications() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetUserId: ""
  });

  useEffect(() => {
    loadConnectedUsers();
  }, []);

  const loadConnectedUsers = async () => {
    try {
      setFetchingUsers(true);
      const response = await notificationApi.getConnectedUsers();
      if (Array.isArray(response)) {
        setConnectedUsers(response);
      } else if (response?.data && Array.isArray(response.data)) {
        setConnectedUsers(response.data);
      } else if (response?.items && Array.isArray(response.items)) {
        setConnectedUsers(response.items);
      } else {
        setConnectedUsers([]);
      }
    } catch (error) {
      console.error("Failed to load connected users:", error);
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and Content are required");
      return;
    }

    try {
      setLoading(true);
      const adminId = "00000000-0000-0000-0000-000000000000";
      
      if (formData.targetUserId.trim()) {
        const resolvedUserId = await userApi.resolveUserId(formData.targetUserId.trim());

        await notificationApi.send({
          userId: resolvedUserId,
          adminId,
          title: formData.title,
          content: formData.content
        });
        toast.success("Notification sent to specific user successfully!");
      } else {
        await notificationApi.broadcast({
          userIds: [], // Empty array implies broadcast to all connected users
          adminId,
          title: formData.title,
          content: formData.content
        });
        toast.success("Notification broadcasted successfully!");
      }
      
      setFormData({ title: "", content: "", targetUserId: "" });
    } catch (error: any) {
      console.error("Failed to send notification:", error);
      toast.error(error.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Notification Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Send direct messages or broadcast notifications to connected users.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Send className="w-5 h-5 text-blue-500" />
              Compose Notification
            </h2>
            
            <form onSubmit={handleSend} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target User ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Username, Email, or User UUID (leave empty to broadcast)"
                  value={formData.targetUserId}
                  onChange={(e) => setFormData({ ...formData, targetUserId: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  If left empty, this notification will be broadcasted.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Notification Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Type your message here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : formData.targetUserId.trim() ? (
                    <Send className="w-5 h-5" />
                  ) : (
                    <Radio className="w-5 h-5" />
                  )}
                  {loading ? "Sending..." : formData.targetUserId.trim() ? "Send Notification" : "Broadcast Notification"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Connected Users */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                Connected Users
              </h2>
              <button 
                onClick={loadConnectedUsers}
                disabled={fetchingUsers}
                className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${fetchingUsers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {connectedUsers.length} Online
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-2">
              {fetchingUsers && connectedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  Loading users...
                </div>
              ) : connectedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No active users connected.
                </div>
              ) : (
                connectedUsers.map((userId, index) => (
                  <div 
                    key={`${userId}-${index}`} 
                    className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between group cursor-pointer"
                    onClick={() => setFormData({ ...formData, targetUserId: userId })}
                    title="Click to target this user"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {userId}
                      </p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-all">
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

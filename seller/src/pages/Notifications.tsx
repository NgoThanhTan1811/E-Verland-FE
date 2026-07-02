import { useEffect, useState } from "react";
import { Bell, Check, Trash2, Circle } from "lucide-react";
import { notificationApi, profileApi } from "../services/api";
import type { NotificationItem } from "../types";

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSSEConnected, setIsSSEConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    (async () => {
      // Try to resolve current user id for SSE subscription
      let userId: string | undefined;
      try {
        const me = await profileApi.getMe();
        userId = me?.data?.id || me?.id || undefined;
      } catch (e) {
        console.warn("Failed to get current user for notifications SSE", e);
      }

      await loadNotifications(userId);

      // Setup SSE connection for real-time notifications (prefer userId)
      try {
        eventSource = notificationApi.subscribeSSE((notification) => {
          setNotifications((prev) => [notification, ...prev]);
        }, userId);
        setIsSSEConnected(true);
      } catch (e) {
        console.error("Failed to open SSE connection:", e);
      }
    })();

    return () => {
      if (eventSource && typeof eventSource.close === "function") {
        eventSource.close();
      }
      setIsSSEConnected(false);
    };
  }, []);

  const loadNotifications = async (userId?: string) => {
    try {
      setLoading(true);
      const response = await notificationApi.getAll({ page: 1, limit: 50, userId });

      // Handle various response shapes
      const payload = response?.data || response as any;
      const notifications = payload?.notifications || payload?.items || [];
      setNotifications(Array.isArray(notifications) ? notifications : []);
    } catch (error: any) {
      console.error("Failed to load notifications:", error);
      // Handle NotFound as empty data instead of error
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.update({ id, isRead: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      await Promise.all(
        unreadNotifications.map((n) =>
          notificationApi.update({ id: n.id, isRead: true }),
        ),
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;

    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
      alert("Failed to delete notification");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            {isSSEConnected && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <Circle className="w-2 h-2 fill-current animate-pulse" />
                Live
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
          >
            <Check className="w-5 h-5" />
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4">
            <Bell className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-900 dark:text-white font-medium">
              No notifications
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) {
                    handleMarkAsRead(notification.id);
                  }
                }}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${
                  !notification.isRead
                    ? "bg-blue-50/50 dark:bg-blue-950/20"
                    : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Unread Indicator */}
                  <div className="flex-shrink-0 mt-1">
                    {!notification.isRead ? (
                      <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>
                    ) : (
                      <div className="w-2.5 h-2.5"></div>
                    )}
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950 rounded-lg flex items-center justify-center">
                      <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {notification.description}
                    </p>
                    {notification.link && (
                      <a
                        href={notification.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 dark:text-blue-400 text-sm hover:underline inline-flex items-center gap-1 mb-2"
                      >
                        Chuyển tiếp →
                      </a>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-2">
                      <span>
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      {notification.type && (
                        <>
                          <span>•</span>
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                            {notification.type}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

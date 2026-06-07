import { useState, useEffect } from 'react';
import { Bell, Package, Tag, AlertCircle } from 'lucide-react';
import { Badge } from '../../shared/ui/badge';
import { Button } from '../../shared/ui/button';
import { notificationService, NotificationResponse } from '../../../shared/services/notification.service';
import { useAuth } from '../../../shared/contexts/auth-context';
import { useNavigate } from 'react-router';

export function NotificationPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) { navigate('/login'); return; }
    fetchNotifications();
  }, [isAuthenticated, user]);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await notificationService.getNotifications(user.id);
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.allSettled(unread.map((n) => notificationService.markAsRead(n.id)));
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'order': return <Package className="h-5 w-5" />;
      case 'promotion': return <Tag className="h-5 w-5" />;
      case 'system': return <AlertCircle className="h-5 w-5" />;
      default: return <Bell className="h-5 w-5" />;
    }
  };

  const getIconColor = (type?: string) => {
    switch (type) {
      case 'order': return 'bg-primary/10 text-primary';
      case 'promotion': return 'bg-error/10 text-error';
      case 'system': return 'bg-info/10 text-info';
      default: return 'bg-neutral-100 text-neutral-600';
    }
  };

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Thông báo</h1>
            {unreadCount > 0 && <p className="text-neutral-600">Bạn có {unreadCount} thông báo chưa đọc</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>Đánh dấu tất cả đã đọc</Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-card rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-border">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${filter === 'all' ? 'text-primary border-b-2 border-primary' : 'text-neutral-600 hover:text-primary'}`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${filter === 'unread' ? 'text-primary border-b-2 border-primary' : 'text-neutral-600 hover:text-primary'}`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-neutral-200 rounded-xl animate-pulse" />)}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center">
            <Bell className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Không có thông báo</h2>
            <p className="text-neutral-600">
              {filter === 'unread' ? 'Bạn đã đọc hết tất cả thông báo' : 'Chưa có thông báo nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-card rounded-xl p-6 shadow-sm transition-all hover:shadow-md ${!notification.isRead ? 'border-l-4 border-primary' : ''}`}
              >
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getIconColor(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{notification.title}</h3>
                          {!notification.isRead && <Badge variant="primary" className="text-xs">Mới</Badge>}
                        </div>
                        <p className="text-sm text-neutral-600">{notification.message}</p>
                      </div>
                      {!notification.isRead && (
                        <button onClick={() => markAsRead(notification.id)} className="text-xs text-primary hover:underline whitespace-nowrap">
                          Đánh dấu đã đọc
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-neutral-500">{formatDate(notification.createdAt)}</span>
                      {notification.link && (
                        <a href={notification.link} className="text-sm text-primary hover:underline">Xem chi tiết →</a>
                      )}
                    </div>
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

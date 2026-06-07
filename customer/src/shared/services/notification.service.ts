import { apiRequest } from "./api-client";

export interface NotificationResponse {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationService = {
  getNotifications: (userId: string, take = 50) =>
    apiRequest<NotificationResponse[]>(
      `/Notification/user/${userId}?take=${take}`,
    ),

  getUnreadCount: (userId: string) =>
    apiRequest<UnreadCountResponse>(`/Notification/unread?userId=${userId}`),

  markAsRead: (notificationId: string) =>
    apiRequest<void>(`/Notification/${notificationId}/mark-as-read`, {
      method: "POST",
    }),

  getStatus: (userId: string) =>
    apiRequest<{ online: boolean }>(`/Notification/status/${userId}`),
};

import { apiRequest } from "./api-client";

export interface ConversationResponse {
  id: string;
  customerId: string;
  sellerId: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string;
  createdAt: string;
  isRead?: boolean;
}

export const chatService = {
  createConversation: (customerId: string, sellerId: string) =>
    apiRequest<ConversationResponse>("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ customerId, sellerId }),
    }),

  getConversation: (conversationId: string) =>
    apiRequest<ConversationResponse>(`/chat/conversations/${conversationId}`),

  getUserConversations: (userId: string) =>
    apiRequest<ConversationResponse[]>(`/chat/conversations/user/${userId}`),

  sendMessage: (conversationId: string, senderId: string, content: string) =>
    apiRequest<MessageResponse>("/chat/messages", {
      method: "POST",
      body: JSON.stringify({ conversationId, senderId, content }),
    }),

  getMessages: (conversationId: string, page = 1, pageSize = 30) =>
    apiRequest<MessageResponse[]>(
      `/chat/messages/conversation/${conversationId}?page=${page}&pageSize=${pageSize}`,
    ),
};

import { useEffect, useState } from "react";
import { MessageSquare, User, Clock, Search } from "lucide-react";
import { chatApi, userApi } from "../services/api";
import { toast } from "sonner";
import type { Conversation, ChatMessage } from "../types";

export function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [targetUserId, setTargetUserId] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadConversations = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetUserId.trim()) return;

    try {
      setLoadingConversations(true);
      let userIdToFetch = targetUserId.trim();

      // Resolve email or username to UUID if needed
      userIdToFetch = await userApi.resolveUserId(userIdToFetch);

      const response = await chatApi.getConversations(userIdToFetch, { page: 1, limit: 50 });
      const items = response.data?.conversations || response.conversations || response.items || response.data || response || [];
      setConversations(Array.isArray(items) ? items : []);
      setSelectedConversation(null);
      setMessages([]);
    } catch (error: any) {
      console.error("Failed to load conversations:", error);
      toast.error(error.message || "Failed to load conversations for this user.");
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      const response = await chatApi.getMessages({ conversationId, page: 1, limit: 100 });
      const items = response.data?.messages || response.messages || response.items || response.data || response || [];
      setMessages(Array.isArray(items) ? items.reverse() : []);
    } catch (error: any) {
      console.error("Failed to load messages:", error);
      toast.error("Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      
      {/* Top Header to input User ID */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <form onSubmit={loadConversations} className="flex gap-4 max-w-2xl">
          <input
            type="text"
            placeholder="Enter Username, Email, or User ID to view their conversations..."
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={!targetUserId.trim() || loadingConversations}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Load
          </button>
        </form>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-900/30">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white">Conversations</h2>
            <p className="text-sm text-gray-500">
              {conversations.length} found
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No conversations.</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors ${
                    selectedConversation?.id === conv.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {(conv.sellerName || conv.customerName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {conv.sellerName || "Unknown Seller"} & {conv.customerName || "Unknown Customer"}
                      </p>
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {conv.lastMessagePreview || "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area - Messages Viewer */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.sellerName} & {selectedConversation.customerName}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/30">
                {loadingMessages ? (
                  <div className="text-center text-gray-500 py-4">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No messages in this conversation.</div>
                ) : (
                  messages.map((message) => {
                    return (
                      <div
                        key={message.id}
                        className="flex justify-start"
                      >
                        <div className="max-w-[70%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5">
                          <p className="text-xs font-medium mb-1 opacity-70 text-blue-600 dark:text-blue-400">
                            Sender: {message.senderId}
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">{message.content}</p>
                          <p className="text-xs mt-1 text-gray-500">
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 text-center text-gray-500 text-sm">
                Admin Viewer Mode - Read Only
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
              <p>Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import { Send, Circle, User, Plus } from "lucide-react";
import { chatApi } from "../services/api";
import type { ChatConversation, ChatMessage } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { getSellerId } from "../utils/auth";

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function Chat() {
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [currentSellerId, setCurrentSellerId] = useState<string | null>(() =>
    getSellerId(),
  );
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [newUserId, setNewUserId] = useState("");

  // Infinite scroll state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Setup Socket.IO connection when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      // Disconnect socket if no conversation selected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsSocketConnected(false);
      }
      return;
    }

    // Reset pagination state
    setCurrentPage(1);
    setHasMoreMessages(true);

    // Connect to Socket.IO for the selected conversation
    chatApi
      .connectSocketIO(
        selectedConversation.id,
        (message) => {
          // Clear timeout if exists
          if (socketRef.current?._clearMessageTimeout) {
            socketRef.current._clearMessageTimeout();
          }

          // Set seller ID from sent messages automatically
          if (!currentSellerId && message.senderId) {
            setCurrentSellerId(message.senderId);
          }

          setMessages((prev) => {
            // Check if message already exists
            if (prev.some((m) => m.id === message.id)) return prev;
            // Add new message at the end (bottom)
            return [...prev, message];
          });

          // Update conversation in list
          setConversations((prevConvs) => {
            const updated = prevConvs.map((conv) =>
              conv.id === message.conversationId
                ? {
                    ...conv,
                    lastMessageContent: message.content,
                    lastMessageAt: message.createdAt,
                    lastSenderId: message.senderId,
                    updatedAt: message.createdAt,
                  }
                : conv,
            );
            return updated.sort(
              (a, b) =>
                new Date(a.updatedAt || "").getTime() -
                new Date(b.updatedAt || "").getTime(),
            );
          });
        },
        () => {
          setIsSocketConnected(true);
        },
        (reason) => {
          setIsSocketConnected(false);
        },
      )
      .then((socket) => {
        socketRef.current = socket;
      })
      .catch((error) => {
        alert("Failed to connect to chat socket: " + (error as Error).message);
      });

    // Cleanup on unmount or conversation change
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsSocketConnected(false);
      }
    };
  }, [selectedConversation?.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getConversations({ page: 1, limit: 50 });
      // Handle response structure: { data: { conversations: [...] } }
      const conversations = response.data?.conversations || [];
      setConversations(Array.isArray(conversations) ? conversations : []);
    } catch (error: any) {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (
    conversationId: string,
    page: number = 1,
    clearMessages: boolean = false,
  ) => {
    if (isLoadingMessages || (!hasMoreMessages && !clearMessages)) {
      return;
    }

    try {
      setIsLoadingMessages(true);
      const response = await chatApi.getMessages({
        conversationId,
        page,
        limit: 10,
      });

      // Handle response structure: { data: { messages: [...] } }
      const newMessages = response.data?.messages || [];

      if (newMessages.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      if (clearMessages) {
        // ========================================
        // LOAD LẦN ĐẦU (Page 1)
        // ========================================
        // API trả: [tin mới nhất, ..., tin cũ] (DESC - createdAt giảm dần)
        // Cần hiển thị: tin cũ → tin mới (CŨ → MỚI)
        // => Reverse array và set
        const sortedMessages = [...newMessages].reverse();
        setMessages(sortedMessages);

        // Scroll xuống bottom để thấy tin mới nhất
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }, 100);
      } else {
        // ========================================
        // LOAD THÊM TIN CŨ (Page 2, 3, 4...)
        // ========================================
        // Lưu vị trí scroll hiện tại
        const container = messagesContainerRef.current;
        const scrollHeight = container?.scrollHeight || 0;
        const scrollTop = container?.scrollTop || 0;

        // API trả: [tin mới trong page, ..., tin cũ trong page] (DESC)
        // Prepend theo thứ tự từ đầu array
        setMessages((prev) => {
          // Reverse to get oldest first, then prepend
          const sortedNewMessages = [...newMessages].reverse();
          return [...sortedNewMessages, ...prev];
        });

        // Giữ nguyên vị trí scroll (bù trừ phần tin nhắn mới thêm vào)
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = scrollTop + (newScrollHeight - scrollHeight);
          }
        }, 100);
      }

      // Nếu số tin nhắn ít hơn limit, không còn tin nhắn nữa
      if (newMessages.length < 10) {
        setHasMoreMessages(false);
      }

      // Try to identify seller from participants if not already set
      if (
        !currentSellerId &&
        selectedConversation &&
        selectedConversation.participants &&
        selectedConversation.participants.length >= 2
      ) {
        // Seller is typically the second participant (index 1)
        // First participant (index 0) is usually the customer
        const sellerParticipant = selectedConversation.participants[1];

        if (sellerParticipant) {
          setCurrentSellerId(sellerParticipant.id);
          // Save to localStorage for future sessions
          localStorage.setItem("sellerId", sellerParticipant.id);
        }
      }
    } catch (error) {
      if (clearMessages) {
        setMessages([]);
      }
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    setCurrentPage(1);
    setHasMoreMessages(true);
    loadMessages(conversation.id, 1, true);
  };

  const handleCreateConversation = async () => {
    if (!newUserId.trim()) {
      alert("Please enter a user ID");
      return;
    }

    try {
      const response = await chatApi.createConversation({
        participantIds: [newUserId.trim()],
      });

      // Reload conversations to show new one
      await loadConversations();
      setShowCreateConversation(false);
      setNewUserId("");

      // Select the new conversation if available
      if (response.data) {
        setSelectedConversation(response.data);
        loadMessages(response.data.id);
      }
    } catch (error) {
      alert("Failed to create conversation: " + (error as Error).message);
    }
  };

  // Auto-scroll to bottom only when new messages arrive and user is near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // Check if user is near bottom (within 200px)
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight <
      200;

    // Only auto-scroll if user is near bottom (viewing latest messages)
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Setup scroll listener for infinite scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || !selectedConversation) return;

    const handleScroll = () => {
      // Khi scroll lên trên cùng (hoặc gần trên cùng)
      if (container.scrollTop < 100 && hasMoreMessages && !isLoadingMessages) {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        loadMessages(selectedConversation.id, nextPage, false);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [selectedConversation, currentPage, hasMoreMessages, isLoadingMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation || sending) return;

    const content = messageInput.trim();
    setMessageInput("");
    setSending(true);

    try {
      // Use Socket.IO to send message
      if (socketRef.current && socketRef.current.connected) {
        chatApi.sendMessageViaSocket(
          socketRef.current,
          selectedConversation.id,
          content,
          (message) => {
            // Success callback - message will also be added via newMessage event
          },
          async (error) => {
            // Error/Timeout callback - fallback to REST API
            alert(
              "Socket failed, falling back to REST API: " +
                (error as Error).message,
            );
            try {
              const newMessage = await chatApi.sendMessage(
                selectedConversation.id,
                content,
              );

              // Set seller ID if not already set
              if (!currentSellerId && newMessage.senderId) {
                setCurrentSellerId(newMessage.senderId);
                alert("Current seller ID set: " + newMessage.senderId);
              }

              // Add message to UI
              setMessages((prev) => [...prev, newMessage]);

              // Update conversation list
              setConversations((prevConvs) => {
                const updated = prevConvs.map((conv) =>
                  conv.id === selectedConversation.id
                    ? {
                        ...conv,
                        lastMessageContent: newMessage.content,
                        lastMessageAt: newMessage.createdAt,
                        lastSenderId: newMessage.senderId,
                        updatedAt: newMessage.createdAt,
                      }
                    : conv,
                );
                return updated.sort(
                  (a, b) =>
                    new Date(a.updatedAt || "").getTime() -
                    new Date(b.updatedAt || "").getTime(),
                );
              });
            } catch (restError) {
              // Note: Server may save message even if POST returns error
              // Message will appear via socket newMessage event
              setMessageInput(content);
              alert(
                "Failed to send message via REST API fallback: " +
                  (restError as Error).message,
              );
            }
          },
        );
        // Message will be added via newMessage event or error callback
      } else {
        // Fallback to REST API if socket not connected
        const newMessage = await chatApi.sendMessage(
          selectedConversation.id,
          content,
        );

        // Set seller ID if not already set
        if (!currentSellerId && newMessage.senderId) {
          setCurrentSellerId(newMessage.senderId);
        }

        setMessages((prev) => [...prev, newMessage]);

        // Update conversation in list
        setConversations((prevConvs) => {
          const updated = prevConvs.map((conv) =>
            conv.id === selectedConversation.id
              ? {
                  ...conv,
                  lastMessageContent: newMessage.content,
                  lastMessageAt: newMessage.createdAt,
                  lastSenderId: newMessage.senderId,
                  updatedAt: newMessage.createdAt,
                }
              : conv,
          );
          return updated.sort(
            (a, b) =>
              new Date(a.updatedAt || "").getTime() -
              new Date(b.updatedAt || "").getTime(),
          );
        });
      }
    } catch (error) {
      // Restore message input on error
      setMessageInput(content);
      alert("Failed to send message: " + (error as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading conversations...
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
            Chat
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {conversations.length} conversation
            {conversations.length !== 1 ? "s" : ""}
            {isSocketConnected && (
              <span className="ml-2 inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
                <Circle className="w-2 h-2 fill-current animate-pulse" />
                Live
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCreateConversation(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>

      {/* Chat Interface */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden h-[calc(100vh-240px)]">
        <div className="grid grid-cols-12 h-full">
          {/* Conversations List */}
          <div className="col-span-12 lg:col-span-4 border-r border-gray-200 dark:border-gray-800 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <User className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-900 dark:text-white font-medium">
                  No conversations
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                  Start chatting with customers
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? "bg-blue-50 dark:bg-blue-950/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {conversation.participants?.[0]?.avatar ? (
                          <img
                            src={conversation.participants[0].avatar}
                            alt={conversation.participants[0].username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                            {conversation.participants?.[0]?.username?.[0]?.toUpperCase() ||
                              "U"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {conversation.participants?.[0]?.username ||
                              `Conversation ${conversation.id.slice(0, 8)}`}
                          </p>
                        </div>
                        {conversation.lastMessageContent && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {conversation.lastMessageContent}
                          </p>
                        )}
                        {conversation.lastMessageAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {formatRelativeTime(conversation.lastMessageAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Chat Panel */}
          <div className="col-span-12 lg:col-span-8 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                      {selectedConversation.participants?.[0]?.avatar ? (
                        <img
                          src={selectedConversation.participants[0].avatar}
                          alt={selectedConversation.participants[0].username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                          {selectedConversation.participants?.[0]?.username?.[0]?.toUpperCase() ||
                            "U"}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedConversation.participants?.[0]?.username ||
                          `Conversation ${selectedConversation.id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedConversation.participantIds.length}{" "}
                        participants
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                  {isLoadingMessages && currentPage === 1 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Loading messages...
                        </p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Loading indicator when loading more messages */}
                      {isLoadingMessages && currentPage > 1 && (
                        <div className="flex items-center justify-center py-2">
                          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            Loading older messages...
                          </div>
                        </div>
                      )}

                      {/* Show "No more messages" indicator */}
                      {!hasMoreMessages && messages.length > 0 && (
                        <div className="text-center py-2">
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            No more messages
                          </p>
                        </div>
                      )}

                      {messages.map((message) => {
                        // Get sender info from participants
                        const sender = selectedConversation?.participants?.find(
                          (p) => p.id === message.senderId,
                        );
                        const senderName = sender?.username || "User";

                        // Determine if message is from current seller
                        // Seller messages should appear on the RIGHT (isOwnMessage = true)
                        // Compare senderId with currentSellerId to identify seller's messages
                        const isOwnMessage = currentSellerId
                          ? message.senderId === currentSellerId
                          : false;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] ${
                                isOwnMessage
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                              } rounded-lg px-4 py-2.5`}
                            >
                              {!isOwnMessage && (
                                <p className="text-xs font-medium mb-1 opacity-70">
                                  {senderName}
                                </p>
                              )}
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={`text-xs mt-1 ${
                                  isOwnMessage
                                    ? "text-blue-100"
                                    : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {new Date(
                                  message.createdAt,
                                ).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                  <form onSubmit={handleSendMessage} className="flex gap-3">
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message... (Press Enter to send)"
                      className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={!messageInput.trim() || sending}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      {sending ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-center px-4">
                <div>
                  <User className="w-12 h-12 text-gray-400 mb-4 mx-auto" />
                  <p className="text-gray-900 dark:text-white font-medium">
                    Select a conversation
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Conversation Dialog */}
      {showCreateConversation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create New Conversation
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User ID
                </label>
                <input
                  type="text"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="Enter user ID to start chat"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCreateConversation(false);
                    setNewUserId("");
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateConversation}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

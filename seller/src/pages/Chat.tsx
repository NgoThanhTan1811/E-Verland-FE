import { useEffect, useState, useRef } from "react";
import { Send, Circle, User, Plus } from "lucide-react";
import { chatApi } from "../services/api";
import type { ChatConversation, ChatMessage } from "../types";

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
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [currentSellerId, setCurrentSellerId] = useState<string | null>(null);
  const [showCreateConversation, setShowCreateConversation] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

    // Connect to Socket.IO for the selected conversation
    chatApi
      .connectSocketIO(
        selectedConversation.id,
        (message) => {
          // Handle new message
          console.log("[Chat] New message received:", message);

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
        () => {
          setIsSocketConnected(false);
        },
      )
      .then((socket) => {
        socketRef.current = socket;
      })
      .catch((error) => {
        console.error("[Chat] Failed to connect:", error);
      });

    // Cleanup on unmount or conversation change
    return () => {
      console.log(
        "[Chat] 🧹 Cleanup triggered for conversation:",
        selectedConversation?.id,
      );
      if (socketRef.current) {
        console.log("[Chat] 🔌 Disconnecting socket...");
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
      console.error("Failed to load conversations:", error);
      // Handle NotFound as empty data instead of error
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await chatApi.getMessages({
        conversationId,
        page: 1,
        limit: 100,
      });
      // Handle response structure: { data: { messages: [...] } }
      const messages = response.data?.messages || [];
      // Sort messages by time: oldest first (top), newest last (bottom)
      const sortedMessages = Array.isArray(messages)
        ? messages.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          )
        : [];
      setMessages(sortedMessages);

      // Try to identify seller from participants if not already set
      if (
        !currentSellerId &&
        Array.isArray(sortedMessages) &&
        sortedMessages.length > 0 &&
        selectedConversation
      ) {
        // Find seller participant - usually test4 or the second participant
        const sellerParticipant =
          selectedConversation.participants?.find(
            (p) => p.username === "test4",
          ) || selectedConversation.participants?.[1]; // Fallback to second participant

        if (sellerParticipant) {
          setCurrentSellerId(sellerParticipant.id);
        }
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    }
  };

  const handleSelectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
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
      console.error("Failed to create conversation:", error);
      alert("Failed to create conversation: " + (error as Error).message);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          () => {
            // Success callback - message will also be added via newMessage event
          },
          async (error) => {
            // Error/Timeout callback - fallback to REST API
            console.warn(
              "[Chat] Socket failed, falling back to REST API:",
              error,
            );
            try {
              const newMessage = await chatApi.sendMessage(
                selectedConversation.id,
                content,
              );

              // Set seller ID if not already set
              if (!currentSellerId && newMessage.senderId) {
                setCurrentSellerId(newMessage.senderId);
                console.log(
                  "[Chat] Current seller ID set:",
                  newMessage.senderId,
                );
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
              console.error("[Chat] REST API error:", restError);
              // Note: Server may save message even if POST returns error
              // Message will appear via socket newMessage event
              setMessageInput(content);
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
      console.error("Failed to send message:", error);
      // Restore message input on error
      setMessageInput(content);
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
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center">
                      <p className="text-gray-500 dark:text-gray-400">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    <>
                      {messages.map((message) => {
                        // Get sender info from participants
                        const sender = selectedConversation?.participants?.find(
                          (p) => p.id === message.senderId,
                        );
                        const senderName = sender?.username || "User";

                        // Determine if message is from current seller
                        // Seller messages should appear on the RIGHT (isOwnMessage = true)
                        const isOwnMessage = currentSellerId
                          ? message.senderId === currentSellerId
                          : sender?.username === "test4";

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

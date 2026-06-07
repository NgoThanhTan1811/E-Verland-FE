import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../contexts/auth-context";
import { ChatMessage } from "../types/domain";
import { chatService, MessageResponse } from "../services/chat.service";
import { Button } from "../ui/button";

type ChatTarget = {
  sellerId: string;
  sellerName?: string;
};

const mapMessage = (
  message: MessageResponse,
  currentUserId?: string,
): ChatMessage => ({
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  senderType: message.senderId === currentUserId ? "customer" : "seller",
  content: message.content || "",
  timestamp: message.createdAt,
  isRead: message.isRead,
});

export function ChatFAB() {
  const { isAuthenticated, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeSeller, setActiveSeller] = useState<ChatTarget | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const detail = (event as CustomEvent<ChatTarget>).detail;
      if (!detail?.sellerId) return;
      setActiveSeller({
        sellerId: detail.sellerId,
        sellerName: detail.sellerName,
      });
      setIsOpen(true);
      setIsMinimized(false);
      setLoadError(null);
      setHasUnread(false);
    };

    window.addEventListener(
      "everland:open-chat",
      handleOpenChat as EventListener,
    );
    return () => {
      window.removeEventListener(
        "everland:open-chat",
        handleOpenChat as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setLoadError(null);
  }, [activeSeller?.sellerId]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated || !user || !activeSeller?.sellerId) return;
    let isCancelled = false;

    const loadConversation = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const conversations = await chatService.getUserConversations(user.id);
        let conversation = conversations.find(
          (c) => c.sellerId === activeSeller.sellerId,
        );

        if (!conversation) {
          conversation = await chatService.createConversation(
            user.id,
            activeSeller.sellerId,
          );
        }

        let resolvedConversationId = conversation?.id;
        if (!resolvedConversationId) {
          const refreshed = await chatService.getUserConversations(user.id);
          resolvedConversationId = refreshed.find(
            (c) => c.sellerId === activeSeller.sellerId,
          )?.id;
        }

        if (!resolvedConversationId) {
          throw new Error("Không thể tạo cuộc trò chuyện.");
        }

        if (isCancelled) return;

        setConversationId(resolvedConversationId);
        setHasUnread((conversation?.unreadCount ?? 0) > 0);

        const serverMessages = await chatService.getMessages(
          resolvedConversationId,
        );
        if (isCancelled) return;
        setMessages(serverMessages.map((msg) => mapMessage(msg, user.id)));
      } catch (error: unknown) {
        if (!isCancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Không thể tải cuộc trò chuyện",
          );
          setMessages([]);
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    void loadConversation();

    return () => {
      isCancelled = true;
    };
  }, [activeSeller?.sellerId, isAuthenticated, isOpen, user]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setHasUnread(false);
    setLoadError(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated || !user || !conversationId) return;

    const content = message.trim();
    const tempId = `tmp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: user.id,
      senderType: "customer",
      content,
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessage("");

    try {
      const saved = await chatService.sendMessage(
        conversationId,
        user.id,
        content,
      );
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                id: saved.id || msg.id,
                timestamp: saved.createdAt || msg.timestamp,
              }
            : msg,
        ),
      );
    } catch (error: unknown) {
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      toast.error(
        error instanceof Error ? error.message : "Không thể gửi tin nhắn",
      );
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const sellerLabel = activeSeller?.sellerName || "Người bán";

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-shadow px-5 py-3 group"
          >
            <MessageCircle className="h-6 w-6" />
            <span className="font-medium hidden sm:block">Chat</span>
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? "auto" : "600px",
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col md:w-[400px]"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Chat với {sellerLabel}</h3>
                  <p className="text-xs opacity-90">Trực tuyến</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleMinimize}
                  className="p-1.5 hover:bg-primary-foreground/10 rounded-lg transition-colors"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-primary-foreground/10 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                  {!isAuthenticated ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
                      <p className="text-sm text-neutral-600 mb-4">
                        Vui lòng đăng nhập để sử dụng tính năng chat
                      </p>
                      <Button asChild size="sm">
                        <a href="/login">Đăng nhập</a>
                      </Button>
                    </div>
                  ) : !activeSeller ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
                      <p className="text-sm text-neutral-600 mb-2">
                        Hãy chọn sản phẩm để chat với người bán
                      </p>
                      <p className="text-xs text-neutral-500">
                        Mở trang chi tiết sản phẩm và nhấn “Chat với người bán”.
                      </p>
                    </div>
                  ) : isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-neutral-500 mt-2">
                        Đang tải...
                      </p>
                    </div>
                  ) : loadError ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
                      <p className="text-sm text-neutral-600 mb-2">
                        {loadError}
                      </p>
                      <Button size="sm" onClick={handleOpen}>
                        Thử lại
                      </Button>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
                      <p className="text-sm text-neutral-600 mb-2">
                        Chưa có tin nhắn
                      </p>
                      <p className="text-xs text-neutral-500">
                        Bắt đầu cuộc trò chuyện với người bán
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderType === "customer" ? "justify-end" : "justify-start"}`}
                      >
                        <div className="max-w-[75%]">
                          <div
                            className={`rounded-2xl px-3 py-2 ${
                              msg.senderType === "customer"
                                ? "bg-primary text-primary-foreground"
                                : msg.senderType === "system"
                                  ? "bg-neutral-200 text-neutral-600 text-center italic text-sm"
                                  : "bg-white text-foreground border border-border"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1 mt-1 px-1 ${
                              msg.senderType === "customer"
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <span className="text-xs text-neutral-500">
                              {formatTime(msg.timestamp)}
                            </span>
                            {msg.senderType === "customer" && (
                              <span className="text-xs text-neutral-500">
                                {msg.isRead ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                {isAuthenticated && activeSeller && (
                  <div className="border-t border-border p-3 bg-card">
                    <form
                      onSubmit={handleSendMessage}
                      className="flex items-end gap-2"
                    >
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Nhập tin nhắn..."
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none text-sm"
                        rows={1}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={!message.trim() || !conversationId}
                        className="px-3"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                    <p className="text-xs text-neutral-500 mt-1.5">
                      Enter để gửi, Shift+Enter xuống dòng
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Full Screen Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden bg-card"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Chat với {sellerLabel}</h3>
                    <p className="text-xs opacity-90">Trực tuyến</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-primary-foreground/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-neutral-50">
                {!isAuthenticated ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-600 mb-4">
                      Vui lòng đăng nhập để sử dụng tính năng chat
                    </p>
                    <Button asChild>
                      <a href="/login">Đăng nhập</a>
                    </Button>
                  </div>
                ) : !activeSeller ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-600 mb-2">
                      Hãy chọn sản phẩm để chat với người bán
                    </p>
                    <p className="text-sm text-neutral-500">
                      Mở trang chi tiết sản phẩm và nhấn “Chat với người bán”.
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-neutral-500 mt-3">Đang tải...</p>
                  </div>
                ) : loadError ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-600 mb-4">{loadError}</p>
                    <Button onClick={handleOpen}>Thử lại</Button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-600 mb-2">Chưa có tin nhắn</p>
                    <p className="text-sm text-neutral-500">
                      Bắt đầu cuộc trò chuyện với người bán
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === "customer" ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[80%]">
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            msg.senderType === "customer"
                              ? "bg-primary text-primary-foreground"
                              : msg.senderType === "system"
                                ? "bg-neutral-200 text-neutral-600 text-center italic"
                                : "bg-white text-foreground border border-border"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 mt-1 px-2 ${
                            msg.senderType === "customer"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <span className="text-xs text-neutral-500">
                            {formatTime(msg.timestamp)}
                          </span>
                          {msg.senderType === "customer" && (
                            <span className="text-xs text-neutral-500">
                              {msg.isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {isAuthenticated && activeSeller && (
                <div className="border-t border-border p-4 bg-card">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-end gap-2"
                  >
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Nhập tin nhắn..."
                      className="flex-1 px-4 py-2.5 rounded-lg border border-border bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      rows={1}
                    />
                    <Button
                      type="submit"
                      disabled={!message.trim() || !conversationId}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </form>
                  <p className="text-xs text-neutral-500 mt-2">
                    Enter để gửi, Shift+Enter xuống dòng
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

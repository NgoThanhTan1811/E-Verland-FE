import { useEffect, useState } from "react";
import { Star, MessageSquare, Edit2, Trash2, Check, X } from "lucide-react";
import { reviewApi } from "../services/api";
import { PaginationControls } from "../components/PaginationControls";
import type { ReviewItem, ReviewQueryParams } from "../types";

export function Reviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ReviewQueryParams>({
    page: 1,
    limit: 10,
  });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  useEffect(() => {
    loadReviews();
  }, [filters]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await reviewApi.getAll(filters);
      // Handle response structure: { data: { reviews: [...], totalItems, ... } }
      const reviews = response.data?.reviews || [];
      setReviews(Array.isArray(reviews) ? reviews : []);
      setTotal(response.data?.totalItems || 0);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      setReviews([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReply = async (reviewId: string) => {
    if (!replyContent.trim()) return;

    try {
      await reviewApi.createReply({ reviewId, content: replyContent });
      setReplyingTo(null);
      setReplyContent("");
      loadReviews();
    } catch (error: any) {
      console.error("Failed to create reply:", error);
      const errorMessage = error?.message || "Failed to create reply";
      alert(errorMessage);
    }
  };

  const handleUpdateReply = async (replyId: string) => {
    if (!replyContent.trim()) return;

    try {
      await reviewApi.updateReply({ id: replyId, content: replyContent });
      setEditingReply(null);
      setReplyContent("");
      loadReviews();
    } catch (error) {
      console.error("Failed to update reply:", error);
      alert("Failed to update reply");
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm("Are you sure you want to delete this reply?")) return;

    try {
      await reviewApi.deleteReply(replyId);
      loadReviews();
    } catch (error) {
      console.error("Failed to delete reply:", error);
      alert("Failed to delete reply");
    }
  };

  const startReply = (reviewId: string) => {
    setReplyingTo(reviewId);
    setEditingReply(null);
    setReplyContent("");
  };

  const startEditReply = (reviewId: string, currentContent: string) => {
    setEditingReply(reviewId);
    setReplyingTo(null);
    setReplyContent(currentContent);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setEditingReply(null);
    setReplyContent("");
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Reviews
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage product reviews and responses ({total} total)
        </p>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center h-64 text-center px-4">
            <Star className="w-12 h-12 text-gray-400 mb-4" />
            <p className="text-gray-900 dark:text-white font-medium">
              No reviews found
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customer reviews will appear here
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              {/* Review */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        U
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {review.username.slice(0, 8)}
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300 dark:text-gray-600"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      {review.content}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Product: {review.productId.slice(0, 8)}...
                    </p>
                    {review.medias && review.medias.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.medias.map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Review image ${index + 1}`}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Seller Reply */}
                {review.reply && !editingReply ? (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-400">
                            Shop Reply
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              startEditReply(
                                review.reply!.id,
                                review.reply!.content,
                              )
                            }
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors"
                            title="Edit reply"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteReply(review.reply!.id)}
                            className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                            title="Delete reply"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">
                        {review.reply.content}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(review.reply.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Reply Form (Create) */}
                {replyingTo === review.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-2.5" />
                      <div className="flex-1">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Write your response..."
                          rows={3}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCreateReply(review.id)}
                            disabled={!replyContent.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Send Reply
                          </button>
                          <button
                            onClick={cancelReply}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reply Form (Edit) */}
                {editingReply === review.reply?.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-2.5" />
                      <div className="flex-1">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Edit your response..."
                          rows={3}
                          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateReply(review.reply!.id)}
                            disabled={!replyContent.trim()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            Update Reply
                          </button>
                          <button
                            onClick={cancelReply}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reply Button */}
                {!review.reply && replyingTo !== review.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                      onClick={() => startReply(review.id)}
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Reply to Review
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && total > 0 && (
        <PaginationControls
          page={filters.page || 1}
          limit={filters.limit || 10}
          total={total}
          onPageChange={(page) => setFilters({ ...filters, page })}
          onLimitChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
          itemName="reviews"
        />
      )}
    </div>
  );
}

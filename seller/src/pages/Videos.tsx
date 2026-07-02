import { useEffect, useState } from "react";
import { Search, Filter, Play, Clock, X, Upload, Trash2 } from "lucide-react";
import { videoApi } from "../services/api";
import { PaginationControls } from "../components/PaginationControls";
import type { VideoItem, VideoStatus, VideoQueryParams } from "../types";
import { VideoUploadModal } from "../components/VideoUploadModal";
import { toast } from "sonner";

export function Videos() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<VideoQueryParams>({
    page: 1,
    limit: 12,
    status: undefined,
    title: "",
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    loadVideos();
  }, [filters]);

  // Auto-refresh when videos are processing
  useEffect(() => {
    const hasProcessingVideos = videos.some((v) =>
      ["UPLOADING", "PROCESSING", "UPLOADED"].includes(v.status),
    );

    if (!hasProcessingVideos) return;

    const interval = setInterval(() => {
      loadVideos();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [videos]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await videoApi.getAll(filters);
      const videos = response.data?.videos || [];
      setVideos(Array.isArray(videos) ? videos : []);
      setTotal(response.data?.totalItems || 0);
    } catch (error: any) {
      console.error("Failed to load videos:", error);
      // Handle NotFound as empty data instead of error
      setVideos([]);
      setTotal(0);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (
    data: { title: string; description?: string; file: File },
    onProgress: (progress: number) => void,
  ) => {
    try {
      await videoApi.upload(data, onProgress);

      toast.success("Video uploaded successfully!");

      // Reload videos after upload
      await loadVideos();
    } catch (error) {
      console.error("Upload failed:", error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  const handleDelete = async (videoId: string, videoTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${videoTitle}"?`)) {
      return;
    }

    try {
      await videoApi.delete(videoId);
      toast.success("Video deleted successfully");
      await loadVideos();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete video");
    }
  };

  const getStatusColor = (status: VideoStatus) => {
    const colors: Record<VideoStatus, string> = {
      UPLOADING:
        "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      UPLOADED:
        "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
      PROCESSING:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
      READY:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      FAILED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      DELETED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    };
    return colors[status];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading videos...</p>
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
            Video Management
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-600 dark:text-gray-400">
              {total} total video{total !== 1 ? "s" : ""}
            </p>
            {videos.filter((v) =>
              ["UPLOADING", "PROCESSING"].includes(v.status),
            ).length > 0 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 text-xs font-medium rounded-full flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse" />
                {
                  videos.filter((v) =>
                    ["UPLOADING", "PROCESSING"].includes(v.status),
                  ).length
                }{" "}
                processing
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Video
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search videos by title..."
              value={filters.title}
              onChange={(e) =>
                setFilters({ ...filters, title: e.target.value, page: 1 })
              }
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filters.status || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: (e.target.value as VideoStatus) || undefined,
                  page: 1,
                })
              }
              className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="UPLOADING">Uploading</option>
              <option value="UPLOADED">Uploaded</option>
              <option value="PROCESSING">Processing</option>
              <option value="READY">Ready</option>
              <option value="FAILED">Failed</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      {videos.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center h-64 text-center px-4">
          <Play className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-900 dark:text-white font-medium">
            No videos found
          </p>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filters.title || filters.status
              ? "Try adjusting your filters"
              : "Videos will appear here"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              {/* Thumbnail */}
              <div
                className="relative aspect-video bg-gray-100 dark:bg-gray-800 cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                {video.thumbnailUrl ? (
                  <>
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className={`w-full h-full object-cover ${
                        ["UPLOADING", "PROCESSING"].includes(video.status)
                          ? "opacity-60"
                          : ""
                      }`}
                    />
                    {["UPLOADING", "PROCESSING"].includes(video.status) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {["UPLOADING", "PROCESSING"].includes(video.status) ? (
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                )}

                {/* Duration Badge */}
                {video.duration && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs font-medium rounded flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(video.duration)}
                  </div>
                )}

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(video.id, video.title);
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete video"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {video.title}
                </h3>
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(video.status)}`}
                  >
                    {video.status}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <PaginationControls
          page={filters.page || 1}
          limit={filters.limit || 12}
          total={total}
          onPageChange={(page) => setFilters({ ...filters, page })}
          onLimitChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
          itemName="videos"
        />
      )}

      {/* Upload Modal */}
      <VideoUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      {/* Video Detail Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Video Details
              </h2>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Video Player */}
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                {selectedVideo.status === "READY" ? (
                  <video
                    src={selectedVideo.url}
                    controls
                    className="w-full h-full"
                    poster={selectedVideo.thumbnailUrl}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Video not ready for playback</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {selectedVideo.title}
                  </h3>
                  {selectedVideo.description && (
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedVideo.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Status
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedVideo.status)}`}
                    >
                      {selectedVideo.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Duration
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {formatDuration(selectedVideo.duration)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Uploaded By
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {selectedVideo.uploadedBy}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Created At
                    </p>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">
                      {new Date(selectedVideo.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Video ID
                    </p>
                    <p className="font-mono text-sm text-gray-900 dark:text-white mt-1 break-all">
                      {selectedVideo.id}
                    </p>
                  </div>
                  {selectedVideo.url && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Video URL
                      </p>
                      <a
                        href={selectedVideo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-1 break-all underline"
                      >
                        {selectedVideo.url}
                      </a>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => {
                      handleDelete(selectedVideo.id, selectedVideo.title);
                      setSelectedVideo(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Video
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

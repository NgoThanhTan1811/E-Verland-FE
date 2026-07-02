import { useState } from "react";
import { Link2, Upload, Trash2, Sparkles, Copy } from "lucide-react";
import { mediaApi } from "../services/api";
import type { MediaType } from "../types";
import { toast } from "sonner";

const initialUpload = {
  resourceType: "products",
  objectId: "",
  contentType: "",
  mediaType: 0 as MediaType,
};

const RESOURCE_TYPE_OPTIONS = [
  { value: "products", label: "Product" },
  { value: "avatars", label: "Avatar" },
  { value: "shops", label: "Shop" },
  { value: "reviews", label: "Review" },
];

export function Media() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadForm, setUploadForm] = useState(initialUpload);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [presignedResult, setPresignedResult] = useState<any>(null);
  const [lookupId, setLookupId] = useState("");
  const [lookupPath, setLookupPath] = useState("");
  const [lookupSize, setLookupSize] = useState("");
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!files || files.length === 0) {
      toast.error("Please choose a file first");
      return;
    }

    try {
      setUploading(true);
      const result = await mediaApi.upload({
        files,
        resourceType: uploadForm.resourceType || undefined,
        objectId: uploadForm.objectId || undefined,
        contentType: uploadForm.contentType || undefined,
        mediaType: uploadForm.mediaType,
      });
      setUploadResult(result);
      toast.success("Media uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleGeneratePresigned = async () => {
    if (!files || files.length === 0) {
      toast.error("Choose a file first");
      return;
    }

    try {
      const file = files[0];
      const result = await mediaApi.generatePresignedUploadUrl({
        resourceType: uploadForm.resourceType || undefined,
        objectId: uploadForm.objectId || undefined,
        fileName: file.name,
        contentType: uploadForm.contentType || file.type,
        mediaType: uploadForm.mediaType,
      });
      setPresignedResult(result);
      toast.success("Presigned upload data loaded");
    } catch (error) {
      console.error(error);
      toast.error("Could not generate presigned upload data");
    }
  };

  const handleResolveById = async () => {
    if (!lookupId.trim()) {
      toast.error("Enter a media id");
      return;
    }

    try {
      const result = await mediaApi.getUrlById(
        lookupId.trim(),
        lookupSize || undefined,
      );
      setResolvedUrl(
        typeof result === "string"
          ? result
          : result?.url || JSON.stringify(result),
      );
      toast.success("URL resolved");
    } catch (error) {
      console.error(error);
      toast.error("Could not resolve URL");
    }
  };

  const handleResolveByPath = async () => {
    if (!lookupPath.trim()) {
      toast.error("Enter a media path");
      return;
    }

    try {
      const result = await mediaApi.getUrlByPath(
        lookupPath.trim(),
        lookupSize || undefined,
      );
      setResolvedUrl(
        typeof result === "string"
          ? result
          : result?.url || JSON.stringify(result),
      );
      toast.success("Path resolved");
    } catch (error) {
      console.error(error);
      toast.error("Could not resolve path");
    }
  };

  const handleDelete = async () => {
    if (!deletingId.trim()) {
      toast.error("Enter a media id to delete");
      return;
    }

    if (!confirm(`Delete media ${deletingId}?`)) return;

    try {
      await mediaApi.delete(deletingId.trim());
      setDeletingId("");
      toast.success("Media deleted");
    } catch (error) {
      console.error(error);
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-cyan-100 dark:border-cyan-900 bg-gradient-to-r from-white via-cyan-50 to-blue-50 dark:from-gray-900 dark:via-cyan-950/30 dark:to-blue-950/30 p-6 lg:p-8 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-cyan-600/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
          <Sparkles className="w-3.5 h-3.5" />
          Media tools
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-gray-900 dark:text-white">
          Media
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          Upload files, generate presigned metadata, resolve URLs, and remove
          assets.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form
          onSubmit={handleUpload}
          className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <Upload className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Upload media
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The upload request keeps the backend IDs hidden. Choose a resource
            type, then optionally attach the file to an existing object ID.
          </p>

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            File
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files ? Array.from(e.target.files) : [])}
              className="mt-2 w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Resource Type
              <select
                value={uploadForm.resourceType}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, resourceType: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              >
                {RESOURCE_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Object ID (optional)
              <input
                value={uploadForm.objectId}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, objectId: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                placeholder="Product / profile / shop ID"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Content Type (optional)
              <input
                value={uploadForm.contentType}
                onChange={(e) =>
                  setUploadForm({ ...uploadForm, contentType: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                placeholder={files.length > 0 ? files[0].type : "image/jpeg"}
              />
            </label>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Media Type
              <select
                value={uploadForm.mediaType}
                onChange={(e) =>
                  setUploadForm({
                    ...uploadForm,
                    mediaType: Number(e.target.value) as MediaType,
                  })
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              >
                <option value={0}>Image</option>
                <option value={1}>Video</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 font-medium text-white transition hover:bg-cyan-700 disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <button
              type="button"
              onClick={handleGeneratePresigned}
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 font-medium text-cyan-700 transition hover:bg-cyan-100 dark:border-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-300"
            >
              <Link2 className="w-4 h-4" />
              Generate presigned data
            </button>
          </div>

          {uploadResult ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-800/60">
              <p className="font-medium text-gray-900 dark:text-white">
                Upload result
              </p>
              <pre className="mt-2 overflow-x-auto text-xs text-gray-600 dark:text-gray-300">
                {JSON.stringify(uploadResult, null, 2)}
              </pre>
            </div>
          ) : null}

          {presignedResult ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-800/60">
              <p className="font-medium text-gray-900 dark:text-white">
                Presigned upload payload
              </p>
              <pre className="mt-2 overflow-x-auto text-xs text-gray-600 dark:text-gray-300">
                {JSON.stringify(presignedResult, null, 2)}
              </pre>
            </div>
          ) : null}
        </form>

        <div className="space-y-6">
          <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Resolve media URLs
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Use the media ID or the stored path returned from upload. These
              are the backend lookup keys, but they are now clearly labeled
              here.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Media ID (lookup key)
                <input
                  value={lookupId}
                  onChange={(e) => setLookupId(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="uuid returned by upload"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Storage path (lookup key)
                <input
                  value={lookupPath}
                  onChange={(e) => setLookupPath(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="uploads/... returned by upload"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
                Size
                <input
                  value={lookupSize}
                  onChange={(e) => setLookupSize(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="small | medium | large"
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleResolveById}
                className="rounded-xl bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
              >
                Resolve by ID
              </button>
              <button
                type="button"
                onClick={handleResolveByPath}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
              >
                Resolve by path
              </button>
            </div>
            {resolvedUrl ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-800 dark:bg-gray-800/60">
                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                  <Copy className="w-4 h-4" />
                  Resolved URL
                </div>
                <p className="mt-2 break-all text-gray-600 dark:text-gray-300">
                  {resolvedUrl}
                </p>
              </div>
            ) : null}
          </div>

          <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl border border-gray-200/80 dark:border-gray-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              Remove media
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Delete by media ID, not by file name or display label.
            </p>
            <input
              value={deletingId}
              onChange={(e) => setDeletingId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800"
              placeholder="Media ID to delete"
            />
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-700"
            >
              Delete media
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

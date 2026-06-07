import { apiRequest } from "./api-client";
import { VITE_API_BASE_URL } from "../../app/shared/constants";

export interface MediaUrlResponse {
  url: string;
}

export type MediaUrlSize = "sm" | "md" | "lg";

const mediaUrlCache = new Map<string, string>();
const pendingRequests = new Map<string, Promise<string>>();

const isDirectUrl = (value: string) =>
  /^https?:\/\//i.test(value) ||
  value.startsWith("data:") ||
  value.startsWith("blob:");

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const normalizePath = (value: string) =>
  value.startsWith("/") ? value.slice(1) : value;

const cacheKey = (mediaRef: string, size: MediaUrlSize) =>
  `${size}:${mediaRef}`;

const normalizeResponse = (
  data: MediaUrlResponse | MediaUrlResponse[] | unknown,
) => {
  if (Array.isArray(data)) {
    return data[0]?.url || "";
  }

  if (data && typeof data === "object" && "url" in data) {
    const url = (data as MediaUrlResponse).url;
    return typeof url === "string" ? url : "";
  }

  return "";
};

export const mediaService = {
  getMediaUrl: async (mediaRef: string, size: MediaUrlSize = "md") => {
    if (!mediaRef) return "";
    if (isDirectUrl(mediaRef)) return mediaRef;

    const key = cacheKey(mediaRef, size);
    const cached = mediaUrlCache.get(key);
    if (cached) return cached;

    const pending = pendingRequests.get(key);
    if (pending) return pending;

    const endpoint = isUuid(mediaRef)
      ? `/media/${encodeURIComponent(mediaRef)}/url?size=${size}`
      : `/media/url?path=${encodeURIComponent(normalizePath(mediaRef))}&size=${size}`;

    const request = apiRequest<MediaUrlResponse | MediaUrlResponse[]>(endpoint)
      .then((data) => {
        const resolved = normalizeResponse(data) || mediaRef;
        mediaUrlCache.set(key, resolved);
        return resolved;
      })
      .catch(() => mediaRef)
      .finally(() => {
        pendingRequests.delete(key);
      });

    pendingRequests.set(key, request);
    return request;
  },
};

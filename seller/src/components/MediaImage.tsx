import { useEffect, useState } from "react";
import { Image } from "lucide-react";
import { mediaApi } from "../services/api";

const isDirectUrl = (value: string) =>
  /^https?:\/\//i.test(value) ||
  value.startsWith("data:") ||
  value.startsWith("blob:");

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

interface MediaImageProps {
  src?: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function MediaImage({
  src,
  alt = "Product Image",
  className,
  fallback,
}: MediaImageProps) {
  const [resolvedUrl, setResolvedUrl] = useState<string>("");

  useEffect(() => {
    if (!src) {
      setResolvedUrl("");
      return;
    }
    if (isDirectUrl(src)) {
      setResolvedUrl(src);
      return;
    }

    let active = true;
    const resolve = async () => {
      try {
        let res;
        if (isUuid(src)) {
          res = await mediaApi.getUrlById(src);
        } else {
          res = await mediaApi.getUrlByPath(src);
        }
        const url = typeof res === "string" ? res : res?.url || res?.data?.url;
        if (active && url) {
          setResolvedUrl(url);
        }
      } catch (err) {
        console.error("Failed to resolve image url:", err);
      }
    };
    resolve();
    return () => {
      active = false;
    };
  }, [src]);

  const defaultFallback = fallback || (
    <div className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 ${className}`}>
      <Image className="w-6 h-6 text-gray-400" />
    </div>
  );

  if (!resolvedUrl) {
    return <>{defaultFallback}</>;
  }

  return <img src={resolvedUrl} alt={alt} className={className} />;
}

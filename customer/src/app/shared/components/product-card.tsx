import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Heart, Star } from "lucide-react";
import { Product } from "../types";
import { Badge } from "../ui/badge";
import { mediaService } from "../../../shared/services/media.service";

const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'><rect width='800' height='800' rx='32' fill='%23f3f4f6'/><path d='M220 250h360c22 0 40 18 40 40v220c0 22-18 40-40 40H220c-22 0-40-18-40-40V290c0-22 18-40 40-40zm0 54c-4 0-6 2-6 6v194l106-94c8-7 20-7 28 0l62 55 92-79c8-7 20-7 28 0l88 75V310c0-4-2-6-6-6H220zm94 40c0 33-27 60-60 60s-60-27-60-60 27-60 60-60 60 27 60 60z' fill='%23d1d5db'/></svg>";

interface ProductCardProps {
  product: Product;
  onToggleFavorite?: (productId: string) => void;
}

export function ProductCard({ product, onToggleFavorite }: ProductCardProps) {
  const [imageUrl, setImageUrl] = useState(FALLBACK_IMAGE);

  useEffect(() => {
    let isMounted = true;

    const resolveImage = async () => {
      const imageSource = product?.images?.[0] || FALLBACK_IMAGE;
      const resolved = await mediaService.getMediaUrl(imageSource, "sm");

      if (isMounted) {
        setImageUrl(resolved || FALLBACK_IMAGE);
      }
    };

    resolveImage();

    return () => {
      isMounted = false;
    };
  }, [product?.images]);

  if (!product) return null;

  const discountPercentage =
    product.discount ||
    (product.originalPrice
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0);

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {discountPercentage > 0 && (
          <Badge variant="error" className="absolute top-2 left-2">
            -{discountPercentage}%
          </Badge>
        )}

        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-medium">Hết hàng</span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite?.(product.id);
          }}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-neutral-50 transition-colors"
        >
          <Heart
            className={`h-4 w-4 ${product.isFavorite ? "fill-error text-error" : "text-neutral-400"}`}
          />
        </button>
      </div>

      <div className="p-4 space-y-2">
        <h3 className="font-medium text-foreground line-clamp-2 h-12 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center gap-1 text-sm">
          <div className="flex items-center gap-1 text-warning">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="font-medium">{product.rating}</span>
          </div>
          <span className="text-neutral-400">|</span>
          <span className="text-neutral-600">Đã bán {product.soldCount}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xl font-semibold text-primary">
            {product.price.toLocaleString("vi-VN")}₫
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-sm text-neutral-400 line-through">
              {product.originalPrice.toLocaleString("vi-VN")}₫
            </span>
          )}
        </div>

        {product.brand && (
          <div className="text-xs text-neutral-500">
            Thương hiệu: {product.brand}
          </div>
        )}
      </div>
    </Link>
  );
}

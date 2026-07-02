import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import {
  Star,
  Heart,
  ShoppingCart,
  MessageCircle,
  Minus,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Button } from "../../shared/ui/button";
import { Badge } from "../../shared/ui/badge";
import { ProductCard } from "../../shared/components/product-card";
import {
  productService,
  ProductResponse,
  SkuResponse,
} from "../../../shared/services/product.service";
import { cartService } from "../../../shared/services/cart.service";
import { mediaService } from "../../../shared/services/media.service";
import { useAuth } from "../../../shared/contexts/auth-context";
import { toast } from "sonner";

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedSku, setSelectedSku] = useState<SkuResponse | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [resolvedImages, setResolvedImages] = useState<string[]>([]);
  const [skuLabelMap, setSkuLabelMap] = useState<Record<string, string>>({});

  const getSkuLabel = (sku: SkuResponse, index: number) =>
    sku.skuCode?.trim() || sku.skuValue?.trim() || `Phân loại ${index + 1}`;

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await productService.getProduct(id);
        setProduct(data);
        if (data.skus && data.skus.length > 0) {
          setSelectedSku(data.skus[0]);
        }
        // Fetch related products by category
        if (data.categoryId) {
          const related = await productService.searchProducts({
            categoryId: data.categoryId,
            limit: 6,
          });
          setRelatedProducts(
            (related.items || []).filter((p) => p.id !== data.id),
          );
        }
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    let isMounted = true;

    const resolveImages = async () => {
      const imageSources = [
        product?.imageUrl,
        ...(product?.imageUrls || []),
        ...(product?.images || []),
      ].filter((value): value is string => Boolean(value));

      if (!imageSources.length) {
        if (isMounted) setResolvedImages([]);
        return;
      }

      const urls = await Promise.all(
        imageSources.map((image, index) =>
          mediaService.getMediaUrl(image, index === 0 ? "lg" : "sm"),
        ),
      );

      if (isMounted) {
        setResolvedImages(urls.filter(Boolean));
        setSelectedImage(0);
      }
    };

    resolveImages();

    if (product?.skus?.length) {
      const labels = product.skus.reduce<Record<string, string>>(
        (acc, sku, index) => {
          acc[sku.id] = getSkuLabel(sku, index);
          return acc;
        },
        {},
      );
      setSkuLabelMap(labels);
    } else {
      setSkuLabelMap({});
    }

    return () => {
      isMounted = false;
    };
  }, [product?.imageUrl, product?.imageUrls, product?.images, product?.skus]);

  const handleAddToCart = async () => {
    if (!isAuthenticated || !user) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      navigate("/login");
      return;
    }
    if (!product) return;
    if (product.skus && product.skus.length > 0 && !selectedSku) {
      toast.error("Vui lòng chọn phân loại sản phẩm");
      return;
    }

    setAddingToCart(true);
    try {
      const existingCart = await cartService.getCart(user.id);
      const matchedItem = (existingCart.items || []).find(
        (item) =>
          item.productId === product.id && item.skuId === selectedSku?.id,
      );

      if (matchedItem) {
        await cartService.updateItem(
          matchedItem.id,
          matchedItem.quantity + quantity,
        );
        toast.success("Đã cập nhật số lượng trong giỏ hàng!");
        return;
      }

      await cartService.addItem(user.id, {
        productId: product.id,
        skuId: selectedSku?.id || "",
        quantity,
        productName: product.name,
        productImage:
          resolvedImages[0] ||
          product.imageUrl ||
          product.imageUrls?.[0] ||
          product.images?.[0],
        skuValue: selectedSku?.skuCode || selectedSku?.skuValue || "",
      });
      toast.success("Đã thêm vào giỏ hàng!");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Không thể thêm vào giỏ hàng",
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate("/cart");
  };

  const handleOpenChat = () => {
    if (!product?.sellerId) {
      toast.error("Không tìm thấy người bán cho sản phẩm này");
      return;
    }

    window.dispatchEvent(
      new CustomEvent("everland:open-chat", {
        detail: {
          sellerId: product.sellerId,
          sellerName: product.sellerName || product.brand?.name || "Người bán",
        },
      }),
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-neutral-200 rounded-xl animate-pulse" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-8 bg-neutral-200 rounded animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Không tìm thấy sản phẩm</h1>
        <Link to="/products">
          <Button>Về trang sản phẩm</Button>
        </Link>
      </div>
    );
  }

  const currentPrice = Number(selectedSku?.price ?? product.price ?? 0);
  const displayCurrentPrice =
    currentPrice > 0 ? currentPrice : Number(product.price || 0);
  const originalPrice = Number(product.originalPrice ?? 0);
  const discountPercentage =
    product.discount ||
    (originalPrice
      ? Math.round(
          ((originalPrice - displayCurrentPrice) / originalPrice) * 100,
        )
      : 0);

  return (
    <div className="bg-neutral-50">
      {/* Breadcrumb */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Link to="/" className="hover:text-primary">
              Trang chủ
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/products" className="hover:text-primary">
              Sản phẩm
            </Link>
            {product.category && (
              <>
                <ChevronRight className="h-4 w-4" />
                <Link
                  to={`/products?categoryId=${product.categoryId}`}
                  className="hover:text-primary"
                >
                  {product.category.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div>
            <div className="bg-card rounded-xl overflow-hidden mb-4 aspect-square">
              {resolvedImages[selectedImage] ? (
                <img
                  src={resolvedImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                  Không có ảnh
                </div>
              )}
            </div>
            {resolvedImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {resolvedImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${selectedImage === index ? "border-primary" : "border-border"}`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-card rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                {product.brand && (
                  <Badge variant="info" className="mb-2">
                    {product.brand.name}
                  </Badge>
                )}
                <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
              </div>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <Heart
                  className={`h-6 w-6 ${isFavorite ? "fill-error text-error" : "text-neutral-400"}`}
                />
              </button>
            </div>

            {(product.rating || product.reviewCount || product.soldCount) && (
              <div className="flex items-center gap-4 mb-6">
                {product.rating && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.floor(product.rating!) ? "fill-warning text-warning" : "text-neutral-300"}`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{product.rating}</span>
                  </div>
                )}
                {product.reviewCount && (
                  <span className="text-neutral-600">
                    {product.reviewCount} đánh giá
                  </span>
                )}
                {product.soldCount && (
                  <span className="text-neutral-600">
                    Đã bán {product.soldCount}
                  </span>
                )}
              </div>
            )}

            <div className="bg-accent p-4 rounded-lg mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-3xl font-bold text-primary">
                  {displayCurrentPrice.toLocaleString("vi-VN")}₫
                </span>
                {originalPrice > displayCurrentPrice && (
                  <>
                    <span className="text-lg text-neutral-400 line-through">
                      {originalPrice.toLocaleString("vi-VN")}₫
                    </span>
                    <Badge variant="error">-{discountPercentage}%</Badge>
                  </>
                )}
              </div>
              {product.stock !== undefined &&
                product.stock > 0 &&
                product.stock < 50 && (
                  <p className="text-sm text-warning">
                    Chỉ còn {product.stock} sản phẩm
                  </p>
                )}
              {product.stock === 0 && (
                <p className="text-sm text-error">Hết hàng</p>
              )}
            </div>

            {/* SKU Selector */}
            {product.skus && product.skus.length > 0 && (
              <div className="mb-6">
                <label className="block mb-3">
                  Phân loại:{" "}
                  {selectedSku
                    ? skuLabelMap[selectedSku.id] ||
                      selectedSku.skuCode ||
                      selectedSku.skuValue ||
                      ""
                    : ""}
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.skus.map((sku, index) => (
                    <button
                      key={sku.id}
                      onClick={() => setSelectedSku(sku)}
                      disabled={sku.stock === 0}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedSku?.id === sku.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary"
                      } ${sku.stock === 0 ? "opacity-50 cursor-not-allowed line-through" : ""}`}
                    >
                      {skuLabelMap[sku.id] ||
                        sku.skuCode ||
                        sku.skuValue ||
                        `Phân loại ${index + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block mb-3">Số lượng</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border-2 border-border rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-neutral-100 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-16 text-center border-none focus:outline-none"
                    min="1"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-neutral-100 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                {product.stock !== undefined && (
                  <span className="text-neutral-600">
                    {product.stock} sản phẩm có sẵn
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-6">
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={handleAddToCart}
                loading={addingToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Thêm vào giỏ
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                Mua ngay
              </Button>
            </div>

            <Button variant="ghost" className="w-full" onClick={handleOpenChat}>
              <MessageCircle className="h-5 w-5 mr-2" />
              Chat với người bán
            </Button>
          </div>
        </div>

        {/* Product Details */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Mô tả sản phẩm</h2>
            <p className="text-neutral-700 whitespace-pre-line">
              {product.description || "Chưa có mô tả."}
            </p>
          </div>

          <div className="bg-card rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Chính sách</h2>
            <div className="space-y-4 text-sm">
              {[
                { title: "Miễn phí vận chuyển", desc: "Cho đơn hàng từ 500k" },
                { title: "Đổi trả trong 7 ngày", desc: "Nếu sản phẩm lỗi" },
                { title: "Bảo hành chính hãng", desc: "Theo nhà sản xuất" },
              ].map((policy) => (
                <div key={policy.title} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-success/10 text-success rounded-full flex items-center justify-center">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium">{policy.title}</p>
                    <p className="text-neutral-600">{policy.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="bg-background rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Sản phẩm liên quan</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

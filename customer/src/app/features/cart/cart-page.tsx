import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "../../shared/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import {
  productService,
  ProductResponse,
} from "../../../shared/services/product.service";
import { mediaService } from "../../../shared/services/media.service";
import {
  cartService,
  CartItemResponse,
} from "../../../shared/services/cart.service";
import { useAuth } from "../../../shared/contexts/auth-context";
import { toast } from "sonner";

export function CartPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [productMap, setProductMap] = useState<Record<string, ProductResponse>>(
    {},
  );
  const [productImageMap, setProductImageMap] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }
    fetchCart();
  }, [isAuthenticated, user]);

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const cart = await cartService.getCart(user.id);
      setCartItems(cart.items || []);
      setSelectedItemIds([]);

      const productIds = Array.from(
        new Set(
          (cart.items || []).map((item) => item.productId).filter(Boolean),
        ),
      );
      const products = await Promise.all(
        productIds.map((productId) => productService.getProduct(productId)),
      );
      setProductMap(
        products.reduce<Record<string, ProductResponse>>((acc, product) => {
          acc[product.id] = product;
          return acc;
        }, {}),
      );

      const resolvedImages = await Promise.all(
        products.map(async (product) => {
          const source =
            product.imageUrl ||
            product.imageUrls?.[0] ||
            product.images?.[0] ||
            "";
          if (!source) return [product.id, ""] as const;

          const resolved = await mediaService.getMediaUrl(source, "sm");
          return [product.id, resolved || source] as const;
        }),
      );
      setProductImageMap(Object.fromEntries(resolvedImages));
    } catch {
      setCartItems([]);
      setSelectedItemIds([]);
      setProductMap({});
      setProductImageMap({});
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setUpdatingId(itemId);
    try {
      await cartService.updateItem(itemId, newQuantity);
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item,
        ),
      );
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Không thể cập nhật số lượng",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdatingId(itemId);
    try {
      await cartService.removeItem(itemId);
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
      setSelectedItemIds((prev) => prev.filter((id) => id !== itemId));
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa sản phẩm",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const resolveItemPrice = (item: CartItemResponse) => {
    const directPrice = Number(item.price) || 0;
    if (directPrice > 0) return directPrice;

    const product = productMap[item.productId];
    if (!product) return 0;

    const matchedSku = product.skus?.find((sku) => sku.id === item.skuId);
    const skuPrice = Number(matchedSku?.price) || 0;
    if (skuPrice > 0) return skuPrice;

    return Number(product.price) || 0;
  };

  const selectedCartItems = cartItems.filter((item) =>
    selectedItemIds.includes(item.id),
  );
  const groupedCartItems = cartItems.reduce<
    Array<{ productId: string; items: CartItemResponse[] }>
  >((groups, item) => {
    const existingGroup = groups.find(
      (group) => group.productId === item.productId,
    );

    if (existingGroup) {
      existingGroup.items.push(item);
      return groups;
    }

    groups.push({ productId: item.productId, items: [item] });
    return groups;
  }, []);
  const allSelected =
    cartItems.length > 0 && selectedItemIds.length === cartItems.length;
  const someSelected = selectedItemIds.length > 0 && !allSelected;
  const subtotal = selectedCartItems.reduce(
    (sum, item) => sum + resolveItemPrice(item) * (Number(item.quantity) || 0),
    0,
  );
  const shippingFee = subtotal >= 5000 ? 0 : 5000;
  const total = subtotal + shippingFee;

  const toggleItemSelection = (itemId: string, checked: boolean) => {
    setSelectedItemIds((prev) => {
      if (checked) {
        return prev.includes(itemId) ? prev : [...prev, itemId];
      }

      return prev.filter((id) => id !== itemId);
    });
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedItemIds(checked ? cartItems.map((item) => item.id) : []);
  };

  const proceedToCheckout = () => {
    if (selectedCartItems.length === 0) {
      toast.error("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    sessionStorage.setItem(
      "e-verland-cart-selected-item-ids",
      JSON.stringify(selectedItemIds),
    );
    navigate("/checkout", {
      state: { selectedItemIds },
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-neutral-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <ShoppingBag className="h-24 w-24 mx-auto text-neutral-300 mb-6" />
          <h2 className="text-2xl font-semibold mb-4">Giỏ hàng trống</h2>
          <p className="text-neutral-600 mb-8">
            Bạn chưa có sản phẩm nào trong giỏ hàng.
          </p>
          <Link to="/products">
            <Button size="lg">Mua sắm ngay</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Giỏ hàng của bạn</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={
                    allSelected ? true : someSelected ? "indeterminate" : false
                  }
                  onCheckedChange={(checked) =>
                    toggleSelectAll(checked === true)
                  }
                />
                <span className="font-medium">Chọn tất cả</span>
              </label>
              <span className="text-sm text-neutral-600">
                {selectedCartItems.length}/{cartItems.length} sản phẩm đã chọn
              </span>
            </div>

            {groupedCartItems.map((group) => {
              const firstItem = group.items[0];

              return (
                <div
                  key={group.productId}
                  className="bg-card rounded-xl p-6 shadow-sm"
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Link to={`/products/${firstItem.productId}`}>
                        {firstItem.productImage ||
                          productImageMap[firstItem.productId] ? (
                          <img
                            src={
                              firstItem.productImage ||
                              productImageMap[firstItem.productId]
                            }
                            alt={firstItem.productName}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400">
                            Ảnh
                          </div>
                        )}
                      </Link>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div>
                        <Link
                          to={`/products/${firstItem.productId}`}
                          className="font-medium mb-1 hover:text-primary block"
                        >
                          {firstItem.productName}
                        </Link>
                        {productMap[firstItem.productId] && (
                          <p className="text-xs text-neutral-500 mb-2">
                            {productMap[firstItem.productId].name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        {group.items.map((item) => (
                          <div
                            key={item.id}
                            className="border-t border-border pt-4 first:border-t-0 first:pt-0"
                          >
                            <div className="flex gap-3">
                              <label className="flex items-start pt-2 cursor-pointer">
                                <Checkbox
                                  checked={selectedItemIds.includes(item.id)}
                                  onCheckedChange={(checked) =>
                                    toggleItemSelection(
                                      item.id,
                                      checked === true,
                                    )
                                  }
                                />
                              </label>

                              <div className="flex-1">
                                {item.skuValue && (
                                  <p className="text-sm text-neutral-600 mb-2">
                                    {item.skuValue}
                                  </p>
                                )}

                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-lg font-semibold text-primary">
                                    {resolveItemPrice(item).toLocaleString("vi-VN")}₫
                                  </span>

                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center border-2 border-border rounded-lg">
                                      <button
                                        onClick={() =>
                                          updateQuantity(
                                            item.id,
                                            item.quantity - 1,
                                          )
                                        }
                                        disabled={updatingId === item.id}
                                        className="p-2 hover:bg-neutral-100 transition-colors"
                                      >
                                        <Minus className="h-4 w-4" />
                                      </button>
                                      <span className="w-12 text-center font-medium">
                                        {item.quantity}
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateQuantity(
                                            item.id,
                                            item.quantity + 1,
                                          )
                                        }
                                        disabled={updatingId === item.id}
                                        className="p-2 hover:bg-neutral-100 transition-colors"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => removeItem(item.id)}
                                      disabled={updatingId === item.id}
                                      className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                                    >
                                      <Trash2 className="h-5 w-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Tóm tắt đơn hàng</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-neutral-600">
                    Tạm tính ({selectedCartItems.length} sản phẩm)
                  </span>
                  <span className="font-medium">
                    {subtotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Phí vận chuyển</span>
                  <span className="font-medium">
                    {shippingFee === 0
                      ? "Miễn phí"
                      : `${shippingFee.toLocaleString("vi-VN")}₫`}
                  </span>
                </div>
                {subtotal < 500 && (
                  <p className="text-sm text-warning">
                    Mua thêm {(500 - subtotal).toLocaleString("vi-VN")}₫ để
                    được miễn phí vận chuyển
                  </p>
                )}
                {selectedCartItems.length === 0 && (
                  <p className="text-sm text-neutral-500">
                    Vui lòng tick chọn sản phẩm để tiếp tục thanh toán.
                  </p>
                )}
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Tổng cộng</span>
                  <span className="text-2xl font-bold text-primary">
                    {total.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={proceedToCheckout}
                disabled={selectedCartItems.length === 0}
              >
                Tiến hành thanh toán
              </Button>
              <Link to="/products">
                <Button variant="outline" className="w-full mt-3">
                  Tiếp tục mua sắm
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

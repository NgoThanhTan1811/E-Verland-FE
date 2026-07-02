import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "../../shared/ui/button";
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
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    } catch {
      setCartItems([]);
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
      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa sản phẩm",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );
  const shippingFee = subtotal >= 500000 ? 0 : 50000;
  const total = subtotal + shippingFee;

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
            {cartItems.map((item) => (
              <div key={item.id} className="bg-card rounded-xl p-6 shadow-sm">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400">
                        Ảnh
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className="font-medium mb-1">{item.productName}</p>
                    {item.skuValue && (
                      <p className="text-sm text-neutral-600 mb-2">
                        {item.skuValue}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-primary">
                        {(Number(item.price) || 0).toLocaleString("vi-VN")}₫
                      </span>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center border-2 border-border rounded-lg">
                          <button
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
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
                              updateQuantity(item.id, item.quantity + 1)
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

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Tóm tắt đơn hàng</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-neutral-600">
                    Tạm tính ({cartItems.length} sản phẩm)
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
                {subtotal < 500000 && (
                  <p className="text-sm text-warning">
                    Mua thêm {(500000 - subtotal).toLocaleString("vi-VN")}₫ để
                    được miễn phí vận chuyển
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

              <Link to="/checkout">
                <Button className="w-full" size="lg">
                  Tiến hành thanh toán
                </Button>
              </Link>
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

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Package, ChevronRight } from "lucide-react";
import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from "../../shared/constants";
import {
  orderService,
  OrderResponse,
} from "../../../shared/services/order.service";
import { useAuth } from "../../../shared/contexts/auth-context";
import { OrderStatusMap, PaymentStatusMap } from "../../../shared/types/domain";

export function MyOrdersPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }
    fetchOrders();
  }, [isAuthenticated, user?.id]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await orderService.getOrders({
        userId: user.id,
        page: 1,
        limit: 20,
      });
      setOrders(res.items || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statusNum: number) => {
    const status = OrderStatusMap[statusNum] || "pending";
    const key = status.toLowerCase() as keyof typeof ORDER_STATUS_LABELS;
    const colorClass = ORDER_STATUS_COLORS[key] || "";
    return (
      <Badge className={colorClass}>{ORDER_STATUS_LABELS[key] || status}</Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOrderItems = (order: OrderResponse) => order.items || [];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-neutral-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Đơn hàng của tôi</h1>

        {orders.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16">
            <Package className="h-24 w-24 mx-auto text-neutral-300 mb-6" />
            <h2 className="text-2xl font-semibold mb-4">Chưa có đơn hàng</h2>
            <p className="text-neutral-600 mb-8">Bạn chưa có đơn hàng nào.</p>
            <Link to="/products">
              <Button size="lg">Mua sắm ngay</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-card rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-neutral-600">Mã đơn hàng</p>
                      <p className="font-semibold">{order.code}</p>
                    </div>
                    <div className="h-8 w-px bg-border"></div>
                    <div>
                      <p className="text-sm text-neutral-600">Ngày đặt</p>
                      <p className="font-medium">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {getOrderItems(order).map((item) => (
                    <div key={item.id} className="flex gap-4">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-neutral-100 rounded-lg" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium mb-1">{item.productName}</p>
                        <p className="text-sm text-neutral-600">
                          {item.skuValue && `${item.skuValue} | `}x
                          {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          {item.price.toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <span className="text-neutral-600 mr-2">Tổng cộng:</span>
                    <span className="text-xl font-bold text-primary">
                      {order.grandTotal.toLocaleString("vi-VN")}₫
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {order.status === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={async (event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          try {
                            await orderService.cancelOrder(order.id);
                            fetchOrders();
                          } catch (e: unknown) {
                            const { toast } = await import("sonner");
                            toast.error(
                              e instanceof Error
                                ? e.message
                                : "Không thể hủy đơn",
                            );
                          }
                        }}
                      >
                        Hủy đơn
                      </Button>
                    )}
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="primary" size="sm">
                        Xem chi tiết
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

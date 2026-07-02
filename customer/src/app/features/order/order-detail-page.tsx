import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router";
import {
  ChevronLeft,
  Package,
  MapPin,
  CreditCard,
  FileText,
  Truck,
} from "lucide-react";
import { Badge } from "../../shared/ui/badge";
import { Button } from "../../shared/ui/button";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
} from "../../shared/constants";
import {
  orderService,
  OrderResponse,
} from "../../../shared/services/order.service";
import {
  paymentService,
  PaymentResponse,
} from "../../../shared/services/payment.service";
import {
  shippingService,
  ShippingOrderResponse,
} from "../../../shared/services/shipping.service";
import { useAuth } from "../../../shared/contexts/auth-context";
import {
  OrderStatusMap,
  PaymentStatusMap,
  PaymentMethodMap,
} from "../../../shared/types/domain";
import { toast } from "sonner";
import { accountService } from "../../../shared/services/account.service";
import { profileService } from "../../../shared/services/profile.service";

export function OrderDetailPage() {
  const { orderId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState<ShippingOrderResponse | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [payment, setPayment] = useState<PaymentResponse | null>(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [switchingCOD, setSwitchingCOD] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }
    if (!orderId) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const data = await orderService.getOrder(orderId);
        setOrder(data);
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!order) return;
    let isCancelled = false;

    setShippingLoading(true);
    shippingService
      .getShippingByOrder(order.id)
      .then((data) => {
        if (!isCancelled) setShipping(data);
      })
      .catch(() => {
        if (!isCancelled) setShipping(null);
      })
      .finally(() => {
        if (!isCancelled) setShippingLoading(false);
      });

    if (order.paymentMethod === 0) {
      paymentService
        .getPaymentByOrder(order.id)
        .then((data) => {
          if (!isCancelled) {
            setPayment(data);

            // Check cache or construct QR URL
            const cachedUrl = localStorage.getItem(`payment_url_${order.id}`);
            if (cachedUrl) {
              setPaymentUrl(cachedUrl);
            } else if (data.code && data.amount) {
              const constructedUrl = `https://qr.sepay.vn/img?bank=VPBank&acc=239688233&template=&amount=${data.amount}&des=${data.code}`;
              setPaymentUrl(constructedUrl);
              localStorage.setItem(`payment_url_${order.id}`, constructedUrl);
            }
          }
        })
        .catch(() => {
          if (!isCancelled) setPayment(null);

          if (order.paymentStatus === 0) {
            setPaymentLoading(true);
            paymentService
              .initiatePayment({
                orderId: order.id,
                userId: order.userId,
                amount: order.grandTotal,
                method: 0,
                items: order.items.map((item) => ({
                  skuId:
                    item.skuId &&
                      item.skuId !== "null" &&
                      item.skuId !== "undefined"
                      ? item.skuId
                      : "00000000-0000-0000-0000-000000000000",
                  quantity: item.quantity,
                })),
              })
              .then((res) => {
                if (!isCancelled && res.paymentUrl) {
                  setPaymentUrl(res.paymentUrl);
                  localStorage.setItem(`payment_url_${order.id}`, res.paymentUrl);
                }
              })
              .catch((err) => {
                console.error("Lỗi khi tải mã QR:", err);
              })
              .finally(() => {
                if (!isCancelled) setPaymentLoading(false);
              });
          }
        });
    } else {
      setPayment(null);
    }

    return () => {
      isCancelled = true;
    };
  }, [order?.id, order?.paymentMethod, order?.paymentStatus]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const orderItems = order?.items || [];
  const totalPrice = Number(order?.totalPrice) || 0;
  const discount = Number(order?.discount) || 0;
  const grandTotal = Number(order?.grandTotal) || 0;

  const handleCancel = async () => {
    if (!order || !user) return;
    try {
      await orderService.cancelOrder(order.id);
      toast.success("Đã hủy đơn hàng");
      navigate("/my-orders");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không thể hủy đơn hàng");
    }
  };

  const handleSwitchToCOD = async () => {
    if (!order || !user) return;
    setSwitchingCOD(true);
    try {
      const meRes = await accountService.me();
      const profileId = meRes.profile?.id || user.profile?.id;
      if (!profileId) throw new Error("Không tìm thấy thông tin hồ sơ tài khoản");

      const addressesRes = await profileService.getAddresses(profileId);
      const matchedAddress = addressesRes.find((addr) => {
        if (!order.receiver?.address) return false;
        const addressText = order.receiver.address.toLowerCase();
        const prov = addr.province?.toLowerCase() || "";
        const dist = addr.district?.toLowerCase() || "";
        const wrd = addr.ward?.toLowerCase() || "";
        return (
          (prov !== "" && addressText.includes(prov)) &&
          (dist !== "" && addressText.includes(dist)) &&
          (wrd !== "" && addressText.includes(wrd))
        );
      }) || addressesRes[0];

      if (!matchedAddress) {
        throw new Error("Vui lòng thêm địa chỉ giao hàng trong hồ sơ trước khi đổi phương thức");
      }

      await orderService.cancelOrder(order.id);

      const packageWeight = Math.max(1, order.items.reduce((sum, item) => sum + item.quantity, 0)) * 500;
      const payload = {
        shippingAddressId: matchedAddress.id,
        shippingAddress: {
          address: order.receiver?.address || matchedAddress.detail,
          districtId: matchedAddress.districtId || 0,
          wardCode: matchedAddress.wardCode || "",
          wardName: matchedAddress.ward,
          districtName: matchedAddress.district,
          provinceName: matchedAddress.province,
        },
        weight: packageWeight,
        length: 30,
        width: 20,
        height: 10,
        receiver: {
          name: order.receiver?.name || user.username,
          phone: order.receiver?.phone || "",
        },
        paymentMethod: 1, // COD
        items: order.items.map((item) => {
          const skuId =
            item.skuId &&
              item.skuId.trim() !== "" &&
              item.skuId !== "null" &&
              item.skuId !== "undefined"
              ? item.skuId
              : "00000000-0000-0000-0000-000000000000";
          return {
            productId: item.productId,
            skuId: skuId,
            quantity: item.quantity,
          };
        }),
      };

      const newOrder = await orderService.createOrder(user.id, payload as any);
      toast.success("Đã chuyển đổi sang phương thức thanh toán COD thành công!");
      navigate(`/order/success/${newOrder.id}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không thể chuyển phương thức thanh toán");
    } finally {
      setSwitchingCOD(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!order) return;
    setPaymentLoading(true);
    try {
      const paymentStatusRes = await paymentService.getPaymentByOrder(order.id);
      if (paymentStatusRes && paymentStatusRes.status === 1) {
        toast.success("Thanh toán thành công!");
        const updatedOrder = await orderService.getOrder(order.id);
        setOrder(updatedOrder);
        setPayment(paymentStatusRes);
      } else {
        toast.info("Đơn hàng chưa được thanh toán hoặc đang xử lý. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
      toast.error("Không thể kiểm tra trạng thái thanh toán");
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-96 bg-neutral-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">Không tìm thấy đơn hàng</h1>
        <Link to="/my-orders">
          <Button>Về danh sách đơn hàng</Button>
        </Link>
      </div>
    );
  }

  const statusKey = (
    OrderStatusMap[order.status] || "Pending"
  ).toLowerCase() as keyof typeof ORDER_STATUS_LABELS;
  const paymentMethodKey = (
    PaymentMethodMap[order.paymentMethod] || "COD"
  ).toLowerCase() as keyof typeof PAYMENT_METHOD_LABELS;
  const paymentStatus = payment
    ? PaymentStatusMap[payment.status] || "Pending"
    : PaymentStatusMap[order.paymentStatus] || "Pending";

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <Link
          to="/my-orders"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại danh sách đơn hàng
        </Link>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Chi tiết đơn hàng</h1>
              <p className="text-neutral-600">Mã đơn hàng: {order.code}</p>
            </div>
            <Badge className={ORDER_STATUS_COLORS[statusKey] || ""}>
              {ORDER_STATUS_LABELS[statusKey] || statusKey}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-6">Sản phẩm</h2>
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  >
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-neutral-100 rounded-lg" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-1">{item.productName}</p>
                      {item.skuValue && (
                        <p className="text-sm text-neutral-600 mb-2">
                          {item.skuValue}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-600">
                          Số lượng: {item.quantity}
                        </span>
                        <span className="font-semibold text-primary">
                          {(Number(item.price) || 0).toLocaleString("vi-VN")}₫
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {/* Receiver Info */}
            {order.receiver && (
              <div className="bg-card rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Thông tin nhận hàng</h2>
                </div>
                <div className="text-sm space-y-1">
                  {order.receiver.name && (
                    <p className="font-semibold">{order.receiver.name}</p>
                  )}
                  {order.receiver.phone && (
                    <p className="text-neutral-600">{order.receiver.phone}</p>
                  )}
                  {order.receiver.address && (
                    <p className="text-neutral-600">{order.receiver.address}</p>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Info */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Vận chuyển</h2>
              </div>
              {shippingLoading ? (
                <p className="text-sm text-neutral-500">
                  Đang tải thông tin vận chuyển...
                </p>
              ) : shipping ? (
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Đơn vị</span>
                    <span className="font-medium">
                      {shipping.provider || "Chưa xác định"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Trạng thái</span>
                    <span className="font-medium">
                      {shipping.providerStatus ||
                        `Trạng thái #${shipping.status}`}
                    </span>
                  </div>
                  {shipping.providerOrderCode && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Mã vận đơn</span>
                      <span className="font-medium">
                        {shipping.providerOrderCode}
                      </span>
                    </div>
                  )}
                  {shipping.expectedDeliveryTime && (
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Dự kiến giao</span>
                      <span className="font-medium">
                        {formatDate(shipping.expectedDeliveryTime)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Phí vận chuyển</span>
                    <span className="font-medium">
                      {(Number(shipping.totalFee) || 0).toLocaleString("vi-VN")}
                      ₫
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500">
                  Chưa có thông tin vận chuyển.
                </p>
              )}
            </div>

            {/* Payment Info */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Thanh toán</h2>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Phương thức</span>
                  <span className="font-medium">
                    {PAYMENT_METHOD_LABELS[paymentMethodKey] ||
                      paymentMethodKey}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Trạng thái</span>
                  <Badge
                    variant={
                      paymentStatus === "Success" ? "success" : "warning"
                    }
                  >
                    {paymentStatus === "Success"
                      ? "Đã thanh toán"
                      : paymentStatus === "Failed"
                        ? "Thất bại"
                        : paymentStatus === "Pending"
                          ? "Chờ thanh toán"
                          : "Đang xử lý"}
                  </Badge>
                </div>

                {order.paymentMethod === 0 && paymentStatus !== "Success" && (
                  <div className="mt-6 pt-6 border-t border-border space-y-4">
                    <p className="text-center font-medium text-neutral-800 text-sm">
                      Quét mã QR dưới đây để thanh toán trực tuyến qua SePay:
                    </p>

                    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm max-w-[240px] mx-auto">
                      <div className="flex h-[240px] items-center justify-center p-2 bg-white">
                        {paymentLoading ? (
                          <div className="text-neutral-400 text-xs animate-pulse">
                            Đang tải mã QR...
                          </div>
                        ) : paymentUrl ? (
                          <img
                            src={paymentUrl}
                            alt="Mã QR thanh toán"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <div className="text-neutral-400 text-xs">
                            Không thể tải mã QR
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-center text-xs text-neutral-500">
                      Hệ thống tự động xác nhận đơn hàng sau khi nhận tiền.
                    </p>

                    <div className="space-y-2 pt-2">
                      <Button
                        variant="primary"
                        onClick={handleCheckPaymentStatus}
                        className="w-full text-xs font-semibold"
                        disabled={paymentLoading || switchingCOD}
                      >
                        Kiểm tra thanh toán
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleSwitchToCOD}
                        className="w-full text-xs font-semibold border-primary/20 text-primary hover:bg-primary/5"
                        disabled={switchingCOD || paymentLoading}
                      >
                        {switchingCOD ? "Đang xử lý..." : "Đổi sang thanh toán COD"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Tóm tắt</h2>
              </div>
              <div className="text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Tạm tính</span>
                  <span className="font-medium">
                    {totalPrice.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Giảm giá</span>
                    <span>-{discount.toLocaleString("vi-VN")}₫</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="font-semibold">Tổng cộng</span>
                  <span className="text-xl font-bold text-primary">
                    {grandTotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {order.status === 0 && (
              <Button
                variant="danger"
                className="w-full"
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleCancel();
                }}
              >
                Hủy đơn hàng
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

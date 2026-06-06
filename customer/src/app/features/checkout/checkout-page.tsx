import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router";
import { MapPin, CreditCard, Plus } from "lucide-react";
import { Button } from "../../shared/ui/button";
import { PAYMENT_METHOD_LABELS } from "../../shared/constants";
import {
  cartService,
  CartItemResponse,
} from "../../../shared/services/cart.service";
import { orderService, OrderResponse } from "../../../shared/services/order.service";
import {
  profileService,
  AddressResponse,
} from "../../../shared/services/profile.service";
import {
  accountService,
  MeAccountResponse,
} from "../../../shared/services/account.service";
import { paymentService } from "../../../shared/services/payment.service";
import { shippingService } from "../../../shared/services/shipping.service";
import {
  productService,
  ProductResponse,
} from "../../../shared/services/product.service";
import { useAuth } from "../../../shared/contexts/auth-context";
import { AddressLabelMap } from "../../../shared/types/domain";
import { toast } from "sonner";
import { Link } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [productMap, setProductMap] = useState<Record<string, ProductResponse>>(
    {},
  );
  const [me, setMe] = useState<MeAccountResponse | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<0 | 1>(0); // 0=OnlineBanking, 1=COD
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingFeeEstimated, setShippingFeeEstimated] = useState(true);
  const [shippingFeeLoading, setShippingFeeLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentOrderCode, setPaymentOrderCode] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentSecondsLeft, setPaymentSecondsLeft] = useState(15 * 60);

  const [createdOrder, setCreatedOrder] = useState<OrderResponse | null>(null);
  const isPaymentSuccessRef = useRef(false);

  const profileId = user?.profile?.id || "";

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }
    void fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const meRes = await accountService.me();
      const profileId = meRes.profile?.id || user.profile?.id || "";
      setMe(meRes);

      const [cart, addrs] = await Promise.all([
        cartService.getCart(user.id),
        profileId
          ? profileService.getAddresses(profileId)
          : Promise.resolve([]),
      ]);
      const selectedItemIds = Array.isArray(location.state?.selectedItemIds)
        ? location.state.selectedItemIds
        : (() => {
          try {
            return JSON.parse(
              sessionStorage.getItem("e-verland-cart-selected-item-ids") ||
              "[]",
            ) as string[];
          } catch {
            return [];
          }
        })();
      const filteredItems = selectedItemIds.length
        ? (cart.items || []).filter((item) => selectedItemIds.includes(item.id))
        : cart.items || [];

      const productIds = Array.from(
        new Set(filteredItems.map((item) => item.productId).filter(Boolean)),
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

      setCartItems(
        filteredItems.map((item) => ({
          ...item,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
        })),
      );
      const addrList = addrs || [];
      setAddresses(addrList);
      const defaultAddr = addrList.find((a) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (addrList.length > 0) setSelectedAddressId(addrList[0].id);
    } catch {
      setCartItems([]);
      setAddresses([]);
      setMe(null);
      setProductMap({});
    } finally {
      setDataLoading(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // GHN wardCode là string của wardId (vd: wardId=80412 → wardCode="80412")
  const resolveWardCode = (addr: typeof selectedAddress): string | undefined => {
    if (!addr) return undefined;
    if (addr.wardCode && addr.wardCode.trim()) return addr.wardCode.trim();
    if (addr.wardId) return String(addr.wardId);
    return undefined;
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

  useEffect(() => {
    const fallbackFee = 5000;
    const packageLength = 30;
    const packageWidth = 20;
    const packageHeight = 10;

    if (!selectedAddress || cartItems.length === 0) {
      setShippingFee(0);
      setShippingFeeEstimated(true);
      return;
    }

    if (!selectedAddress.districtId) {
      setShippingFee(fallbackFee);
      setShippingFeeEstimated(true);
      return;
    }

    let isCancelled = false;
    const totalQuantity = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const estimatedWeight = Math.max(1, totalQuantity) * 500;

    setShippingFeeLoading(true);
    shippingService
      .calculateFee({
        toDistrictId: selectedAddress.districtId || 0,
        ...(resolveWardCode(selectedAddress) ? { toWardCode: resolveWardCode(selectedAddress) } : {}),
        weight: estimatedWeight,
        length: Math.max(1, packageLength),
        width: Math.max(1, packageWidth),
        height: Math.max(1, packageHeight),
      })
      .then((fee) => {
        if (isCancelled) return;
        setShippingFee(fee.total ?? fallbackFee);
        setShippingFeeEstimated(false);
      })
      .catch(() => {
        if (isCancelled) return;
        setShippingFee(fallbackFee);
        setShippingFeeEstimated(true);
      })
      .finally(() => {
        if (!isCancelled) setShippingFeeLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [
    selectedAddressId,
    selectedAddress?.districtId,
    selectedAddress?.wardCode,
    cartItems,
  ]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + resolveItemPrice(item) * (Number(item.quantity) || 0),
    0,
  );
  const finalShippingFee = subtotal >= 5000 ? 0 : shippingFee;
  const total = subtotal + finalShippingFee;

  useEffect(() => {
    if (!createdOrder) return;

    setPaymentSecondsLeft(15 * 60);
    const startedAt = Date.now();
    const expiresAt = startedAt + 15 * 60 * 1000;

    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setPaymentSecondsLeft(remaining);

      if (remaining <= 0) {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [createdOrder]);

  useEffect(() => {
    if (!createdOrder || createdOrder.paymentMethod !== 0) return;

    let pollInterval: number | undefined;
    pollInterval = window.setInterval(async () => {
      try {
        const paymentStatusRes = await paymentService.getPaymentByOrder(createdOrder.id);
        if (paymentStatusRes && paymentStatusRes.status === 1) {
          isPaymentSuccessRef.current = true;
          window.clearInterval(pollInterval);
          toast.success("Thanh toán thành công!");
          handleClosePaymentDialog();
          setCreatedOrder(null);
          navigate(`/order/success/${createdOrder.id}`);
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
      }
    }, 3000);

    return () => {
      if (pollInterval) window.clearInterval(pollInterval);
    };
  }, [createdOrder]);



  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${secs}`;
  };

  const getOrderPayload = (paymentMethodValue: number) => {
    if (!user) return null;
    const profile = me?.profile || user.profile;
    const receiverPhone = profile?.phoneNumber?.trim();
    const receiverName = [profile?.lastName, profile?.firstName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const receiverAddress = selectedAddress
      ? [
        selectedAddress.detail,
        selectedAddress.street,
        selectedAddress.ward,
        selectedAddress.district,
        selectedAddress.city,
      ]
        .filter(Boolean)
        .join(", ")
      : "";

    const packageWeight =
      Math.max(
        1,
        cartItems.reduce((sum, item) => sum + item.quantity, 0),
      ) * 500;
    const packageLength = 30;
    const packageWidth = 20;
    const packageHeight = 10;

    return {
      shippingAddressId: selectedAddress?.id,
      shippingAddress: selectedAddress
        ? {
          address: receiverAddress,
          districtId: selectedAddress.districtId || 0,
          ...(resolveWardCode(selectedAddress) ? { wardCode: resolveWardCode(selectedAddress) } : {}),
          wardName: selectedAddress.ward,
          districtName: selectedAddress.district,
          provinceName: selectedAddress.province,
        }
        : undefined,
      weight: packageWeight,
      length: packageLength,
      width: packageWidth,
      height: packageHeight,
      receiver: {
        name: receiverName || user.username,
        phone: receiverPhone,
      },
      paymentMethod: paymentMethodValue,
      items: cartItems.map((item) => {
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
  };

  const handlePlaceOrder = async () => {
    if (!user) return;
    if (!selectedAddress && addresses.length > 0) {
      toast.error("Vui lòng chọn địa chỉ giao hàng");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }

    const profile = me?.profile || user.profile;
    const receiverPhone = profile?.phoneNumber?.trim();
    if (!receiverPhone) {
      toast.error(
        "Vui lòng cập nhật số điện thoại trong hồ sơ trước khi đặt hàng",
      );
      navigate("/profile/edit");
      return;
    }

    const payload = getOrderPayload(selectedPayment);
    if (!payload) return;

    setLoading(true);
    try {
      const order = await orderService.createOrder(user.id, payload);

      // Only initiate payment for OnlineBanking (0)
      if (selectedPayment === 0) {
        const payment = await paymentService.initiatePayment({
          orderId: order.id,
          userId: user.id,
          amount: order.grandTotal || total,
          method: selectedPayment,
          items: cartItems.map((item) => {
            const skuId =
              item.skuId &&
              item.skuId.trim() !== "" &&
              item.skuId !== "null" &&
              item.skuId !== "undefined"
                ? item.skuId
                : "00000000-0000-0000-0000-000000000000";
            return {
              skuId: skuId,
              quantity: item.quantity,
            };
          }),
        });

        if (payment.paymentUrl) {
          localStorage.setItem(`payment_url_${order.id}`, payment.paymentUrl);
          setCreatedOrder(order);
          setPaymentUrl(payment.paymentUrl);
          setPaymentOrderId(order.id);
          setPaymentOrderCode(order.code || "");
          setPaymentAmount(order.grandTotal || total);
          setPaymentDialogOpen(true);
          return;
        } else {
          toast.error("Không thể tạo liên kết thanh toán online");
          return;
        }
      }

      toast.success("Đặt hàng thành công!");
      navigate(`/order/success/${order.id}`);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể đặt hàng, vui lòng thử lại",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setPaymentUrl("");
    setPaymentOrderId("");
    setPaymentOrderCode("");
    setPaymentAmount(0);
    setPaymentSecondsLeft(15 * 60);
  };

  const handleCancelPayment = () => {
    if (isPaymentSuccessRef.current) return;
    setPaymentDialogOpen(false);
    toast.info("Đơn hàng đã được tạo. Bạn có thể thanh toán tiếp qua mã QR hiển thị bên dưới hoặc đổi sang COD.");
  };

  const handleSwitchToCOD = async () => {
    if (!createdOrder) return;
    setLoading(true);
    try {
      await orderService.cancelOrder(createdOrder.id);
      
      const payload = getOrderPayload(1); // 1 = COD
      if (!payload) throw new Error("Không thể tạo thông tin đơn hàng");

      const newOrder = await orderService.createOrder(user.id, payload);
      setCreatedOrder(null);
      toast.success("Đã chuyển sang phương thức COD thành công!");
      navigate(`/order/success/${newOrder.id}`);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể chuyển phương thức thanh toán",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!createdOrder) return;
    setLoading(true);
    try {
      await orderService.cancelOrder(createdOrder.id);
      setCreatedOrder(null);
      handleClosePaymentDialog();
      toast.success("Đơn hàng đã được hủy thành công!");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể hủy đơn hàng",
      );
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-96 bg-neutral-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (createdOrder && createdOrder.paymentMethod === 0 && !isPaymentSuccessRef.current) {
    return (
      <div className="bg-neutral-50 min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card rounded-2xl p-8 shadow-md border border-neutral-100 text-center space-y-6">
            <div className="w-16 h-16 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto text-3xl">
              🕒
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-neutral-900">Đơn hàng đang chờ thanh toán</h1>
              <p className="text-neutral-500 text-sm">
                Vui lòng hoàn tất thanh toán bằng QR code. Mã QR sẽ hết hạn sau <span className="font-semibold text-primary">{formatCountdown(paymentSecondsLeft)}</span>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-left">
              <div>
                <p className="text-neutral-500 text-xs">Mã đơn hàng</p>
                <p className="font-semibold text-base text-neutral-900">{paymentOrderCode || createdOrder.code}</p>
              </div>
              <div className="text-right">
                <p className="text-neutral-500 text-xs">Số tiền cần thanh toán</p>
                <p className="font-bold text-lg text-primary">
                  {(paymentAmount || createdOrder.grandTotal || total).toLocaleString("vi-VN")}₫
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm max-w-sm mx-auto">
              <div className="flex h-[320px] items-center justify-center bg-white p-4">
                {paymentUrl ? (
                  <img
                    src={paymentUrl}
                    alt="Mã QR thanh toán"
                    className="max-h-full max-w-full object-contain animate-fade-in"
                  />
                ) : (
                  <div className="text-neutral-400 text-sm">
                    Đang tải mã QR thanh toán...
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-neutral-100 max-w-md mx-auto">
              <Button
                variant="primary"
                onClick={() => setPaymentDialogOpen(true)}
                className="w-full h-12 text-base"
                disabled={loading}
              >
                Tiếp tục thanh toán (Hiện QR lớn)
              </Button>
              
              <Button
                variant="outline"
                onClick={handleSwitchToCOD}
                className="w-full h-12 text-base border-primary/20 hover:bg-primary/5 text-primary"
                disabled={loading}
              >
                Đổi sang thanh toán khi nhận hàng (COD)
              </Button>

              <Button
                variant="ghost"
                onClick={handleCancelOrder}
                className="w-full h-12 text-base text-neutral-500 hover:text-error hover:bg-error/5"
                disabled={loading}
              >
                Hủy đơn hàng này
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Thanh toán</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Địa chỉ giao hàng</h2>
                </div>
                <Link to="/profile/addresses/new">
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm địa chỉ
                  </Button>
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-6 text-neutral-500">
                  <p className="mb-3">Bạn chưa có địa chỉ nào.</p>
                  <Link to="/profile/addresses/new">
                    <Button variant="outline" size="sm">
                      Thêm địa chỉ mới
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedAddressId === address.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                        className="mr-3"
                      />
                      <div className="inline-block">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {AddressLabelMap[address.label] || "Địa chỉ"}
                          </span>
                          {address.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-600">
                          {[
                            address.detail,
                            address.street,
                            address.ward,
                            address.district,
                            address.city,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">
                  Phương thức thanh toán
                </h2>
              </div>

              <div className="space-y-3">
                <label
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPayment === 0 ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPayment === 0}
                    onChange={() => setSelectedPayment(0)}
                    className="mr-3"
                  />
                  <span className="font-medium">
                    {PAYMENT_METHOD_LABELS.online_banking}
                  </span>
                  <p className="text-sm text-neutral-600 ml-7 mt-1">
                    Tạo QR SePay để thanh toán online
                  </p>
                </label>

                <label
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPayment === 1 ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={selectedPayment === 1}
                    onChange={() => setSelectedPayment(1)}
                    className="mr-3"
                  />
                  <span className="font-medium">
                    {PAYMENT_METHOD_LABELS.cod}
                  </span>
                  <p className="text-sm text-neutral-600 ml-7 mt-1">
                    Thanh toán khi nhận hàng
                  </p>
                </label>
              </div>
            </div>

            {/* Order Note */}
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Ghi chú đơn hàng</h2>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ghi chú cho người bán (không bắt buộc)"
                className="w-full px-4 py-3 rounded-lg border-2 border-border bg-input-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                rows={4}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-xl font-semibold mb-6">Đơn hàng</h2>

              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
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
                      <p className="font-medium text-sm line-clamp-2">
                        {item.productName}
                      </p>
                      {item.skuValue && (
                        <p className="text-xs text-neutral-600">
                          {item.skuValue}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm text-neutral-600">
                          x{item.quantity}
                        </span>
                        <span className="font-medium text-primary">
                          {resolveItemPrice(item).toLocaleString("vi-VN")}₫
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Tạm tính</span>
                  <span className="font-medium">
                    {subtotal.toLocaleString("vi-VN")}₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Phí vận chuyển</span>
                  <span className="font-medium">
                    {shippingFeeLoading
                      ? "Đang tính..."
                      : finalShippingFee === 0
                        ? "Miễn phí"
                        : `${finalShippingFee.toLocaleString("vi-VN")}₫`}
                  </span>
                </div>
                {!shippingFeeLoading &&
                  finalShippingFee > 0 &&
                  shippingFeeEstimated && (
                    <p className="text-xs text-neutral-500 text-right">
                      Ước tính theo địa chỉ
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
                onClick={handlePlaceOrder}
                loading={loading}
                disabled={cartItems.length === 0}
              >
                Đặt hàng
              </Button>

              <p className="text-xs text-center text-neutral-600 mt-4">
                Bằng việc đặt hàng, bạn đồng ý với{" "}
                <a href="#" className="text-primary hover:underline">
                  Điều khoản sử dụng
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelPayment();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Quét QR để thanh toán</DialogTitle>
            <DialogDescription className="text-center text-neutral-500">
              Mã QR sẽ hết hạn sau {formatCountdown(paymentSecondsLeft)}. Hoàn tất
              thanh toán trong thời gian này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm">
              <div>
                <p className="text-neutral-500 text-xs">Mã đơn hàng</p>
                <p className="font-semibold text-base text-neutral-900">{paymentOrderCode || "Đang tải..."}</p>
              </div>
              <div className="text-right">
                <p className="text-neutral-500 text-xs">Số tiền cần thanh toán</p>
                <p className="font-bold text-lg text-primary">
                  {(paymentAmount || total).toLocaleString("vi-VN")}₫
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
              <div className="flex h-[420px] items-center justify-center bg-white p-4">
                {paymentUrl ? (
                  <img
                    src={paymentUrl}
                    alt="Mã QR thanh toán"
                    className="max-h-full max-w-full object-contain animate-fade-in"
                  />
                ) : (
                  <div className="text-neutral-400 text-sm">
                    Đang tải mã QR thanh toán...
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3 text-sm border border-primary/10">
              <span className="font-medium text-neutral-700">Thời gian thanh toán còn lại</span>
              <span className="font-semibold text-primary">
                {formatCountdown(paymentSecondsLeft)}
              </span>
            </div>
          </div>

          <DialogFooter className="sm:justify-center gap-2 border-t pt-4">
            <div className="flex flex-col items-center gap-2 w-full">
              <p className="text-xs text-neutral-500 text-center">
                Sau khi thanh toán thành công, hệ thống sẽ tự động ghi nhận đơn hàng của bạn. Bạn có thể đóng hộp thoại này và xem trạng thái trong phần Quản lý đơn hàng.
              </p>
              <Button
                variant="outline"
                onClick={handleCancelPayment}
                className="sm:w-auto w-full"
              >
                Đóng
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MapPin, CreditCard, Plus } from "lucide-react";
import { Button } from "../../shared/ui/button";
import { PAYMENT_METHOD_LABELS } from "../../shared/constants";
import {
  cartService,
  CartItemResponse,
} from "../../../shared/services/cart.service";
import { orderService } from "../../../shared/services/order.service";
import {
  profileService,
  AddressResponse,
} from "../../../shared/services/profile.service";
import { paymentService } from "../../../shared/services/payment.service";
import { shippingService } from "../../../shared/services/shipping.service";
import { useAuth } from "../../../shared/contexts/auth-context";
import { AddressLabelMap } from "../../../shared/types/domain";
import { toast } from "sonner";
import { Link } from "react-router";

export function CheckoutPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedPayment, setSelectedPayment] = useState<0 | 1>(0); // 0=COD, 1=OnlineBanking
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingFeeEstimated, setShippingFeeEstimated] = useState(true);
  const [shippingFeeLoading, setShippingFeeLoading] = useState(false);

  const profileId = user?.profile?.id || "";

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [cart, addrs] = await Promise.all([
        cartService.getCart(user.id),
        profileId
          ? profileService.getAddresses(profileId)
          : Promise.resolve([]),
      ]);
      setCartItems(cart.items || []);
      const addrList = addrs || [];
      setAddresses(addrList);
      const defaultAddr = addrList.find((a) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (addrList.length > 0) setSelectedAddressId(addrList[0].id);
    } catch {
      setCartItems([]);
    } finally {
      setDataLoading(false);
    }
  };

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  useEffect(() => {
    const fallbackFee = 50000;

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
        toDistrictId: selectedAddress.districtId,
        toWardCode: selectedAddress.wardCode || undefined,
        weight: estimatedWeight,
        length: 30,
        width: 20,
        height: 10,
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
    (sum, item) =>
      sum + (Number(item.price) || 0) * (Number(item.quantity) || 0),
    0,
  );
  const finalShippingFee = subtotal >= 500000 ? 0 : shippingFee;
  const total = subtotal + finalShippingFee;

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

    setLoading(true);
    try {
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

      const order = await orderService.createOrder(user.id, {
        receiver: {
          name: user.profile?.firstName
            ? `${user.profile.lastName || ""} ${user.profile.firstName}`.trim()
            : user.username,
          phone: user.profile?.phoneNumber,
          address: receiverAddress,
        },
        paymentMethod: selectedPayment,
        items: cartItems.map((item) => ({
          productId: item.productId,
          skuId: item.skuId,
          quantity: item.quantity,
        })),
      });

      if (selectedPayment === 1) {
        const payment = await paymentService.initiatePayment({
          orderId: order.id,
          userId: user.id,
          amount: order.grandTotal || total,
          method: selectedPayment,
          items: cartItems.map((item) => ({
            skuId: item.skuId,
            quantity: item.quantity,
          })),
        });

        if (payment.paymentUrl) {
          window.location.href = payment.paymentUrl;
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

  if (dataLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-96 bg-neutral-200 rounded-xl animate-pulse" />
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
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAddressId === address.id
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
                    {PAYMENT_METHOD_LABELS.cod}
                  </span>
                  <p className="text-sm text-neutral-600 ml-7 mt-1">
                    Thanh toán khi nhận hàng
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
                    {PAYMENT_METHOD_LABELS.online_banking}
                  </span>
                  <p className="text-sm text-neutral-600 ml-7 mt-1">
                    Chuyển khoản qua ngân hàng
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
                          {(Number(item.price) || 0).toLocaleString("vi-VN")}₫
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
    </div>
  );
}

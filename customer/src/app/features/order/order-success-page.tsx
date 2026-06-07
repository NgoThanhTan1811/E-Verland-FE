import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { CheckCircle, Package, Home } from 'lucide-react';
import { Button } from '../../shared/ui/button';
import { orderService, OrderResponse } from '../../../shared/services/order.service';
import { PaymentMethodMap } from '../../../shared/types/domain';
import { PAYMENT_METHOD_LABELS } from '../../shared/constants';

export function OrderSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderResponse | null>(null);

  useEffect(() => {
    if (!orderId) return;
    orderService.getOrder(orderId).then(setOrder).catch(() => {});
  }, [orderId]);

  const paymentMethodKey = order
    ? (PaymentMethodMap[order.paymentMethod] || 'COD').toLowerCase() as keyof typeof PAYMENT_METHOD_LABELS
    : 'cod';

  return (
    <div className="bg-neutral-50 min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-card rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <CheckCircle className="h-20 w-20 text-success mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-success mb-2">Đặt hàng thành công!</h1>
            <p className="text-neutral-600">Cảm ơn bạn đã mua hàng tại E-Verland</p>
          </div>

          {order && (
            <>
              <div className="bg-accent rounded-lg p-6 mb-6">
                <p className="text-sm text-neutral-600 mb-1">Mã đơn hàng</p>
                <p className="text-2xl font-bold text-primary">{order.code}</p>
              </div>

              <div className="text-left space-y-3 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Tổng tiền</span>
                  <span className="font-semibold">{order.grandTotal.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Phương thức thanh toán</span>
                  <span className="font-medium">{PAYMENT_METHOD_LABELS[paymentMethodKey] || paymentMethodKey}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Thời gian dự kiến giao</span>
                  <span className="font-medium">3-5 ngày</span>
                </div>
              </div>
            </>
          )}

          <div className="space-y-3">
            <Link to={`/orders/${orderId}`} className="block">
              <Button className="w-full" size="lg">
                <Package className="h-5 w-5 mr-2" />
                Xem chi tiết đơn hàng
              </Button>
            </Link>
            <Link to="/" className="block">
              <Button variant="outline" className="w-full" size="lg">
                <Home className="h-5 w-5 mr-2" />
                Về trang chủ
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 bg-info/10 border border-info/20 rounded-lg p-4">
          <p className="text-sm text-info-foreground">
            Bạn có thể theo dõi trạng thái đơn hàng trong phần "Đơn hàng của tôi"
          </p>
        </div>
      </div>
    </div>
  );
}

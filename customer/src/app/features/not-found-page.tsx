import { Link } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../shared/ui/button';

export function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-neutral-50">
      <div className="text-center px-4">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-3xl font-semibold mb-4">Không tìm thấy trang</h2>
          <p className="text-neutral-600 mb-8 max-w-md mx-auto">
            Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
          </p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button onClick={() => window.history.back()} variant="outline" size="lg">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Quay lại
          </Button>
          <Link to="/">
            <Button size="lg">
              <Home className="h-5 w-5 mr-2" />
              Về trang chủ
            </Button>
          </Link>
        </div>

        <div className="mt-12">
          <p className="text-neutral-600 mb-4">Hoặc bạn có thể:</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link to="/products" className="text-primary hover:underline">
              Xem sản phẩm
            </Link>
            <span className="text-neutral-400">|</span>
            <Link to="/cart" className="text-primary hover:underline">
              Giỏ hàng
            </Link>
            <span className="text-neutral-400">|</span>
            <Link to="/my-orders" className="text-primary hover:underline">
              Đơn hàng của tôi
            </Link>
            <span className="text-neutral-400">|</span>
            <Link to="/profile" className="text-primary hover:underline">
              Tài khoản
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

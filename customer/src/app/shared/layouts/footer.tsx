import { Link } from 'react-router';
import { Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-100 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Về E-Verland</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-primary transition-colors">
                  Tuyển dụng
                </Link>
              </li>
              <li>
                <Link to="/policy" className="hover:text-primary transition-colors">
                  Chính sách
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Hỗ trợ khách hàng</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/help" className="hover:text-primary transition-colors">
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link to="/chat" className="hover:text-primary transition-colors">
                  Chat với chúng tôi
                </Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-primary transition-colors">
                  Hướng dẫn đặt hàng
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-primary transition-colors">
                  Chính sách đổi trả
                </Link>
              </li>
            </ul>
          </div>

          {/* Payment & Shipping */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Thanh toán & Vận chuyển</h3>
            <ul className="space-y-2 text-sm">
              <li>Thanh toán khi nhận hàng</li>
              <li>Chuyển khoản ngân hàng</li>
              <li>Ví điện tử</li>
              <li>Vận chuyển toàn quốc</li>
              <li>Miễn phí ship đơn từ 500k</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Liên hệ</h3>
            <ul className="space-y-2 text-sm mb-4">
              <li>Hotline: 1900-xxxx</li>
              <li>Email: support@everland.vn</li>
              <li>Địa chỉ: 123 Đường ABC, Hà Nội</li>
              <li>Giờ làm việc: 8:00 - 22:00</li>
            </ul>
            
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 bg-neutral-800 hover:bg-primary rounded-lg transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-neutral-800 hover:bg-primary rounded-lg transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-neutral-800 hover:bg-primary rounded-lg transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-neutral-800 hover:bg-primary rounded-lg transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-8 pt-8 text-sm text-center text-neutral-400">
          <p>© 2026 E-Verland. Tất cả quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}

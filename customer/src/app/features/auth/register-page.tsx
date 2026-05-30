import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Input } from "../../shared/ui/input";
import { Button } from "../../shared/ui/button";
import { authService } from "../../../shared/services/auth.service";
import { toast } from "sonner";

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      await authService.sendOtp(email);
      toast.success("Mã OTP đã được gửi đến email của bạn!");
      navigate("/otp-verification", {
        state: { email },
      });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra, vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-neutral-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">Đăng ký</h1>
            <p className="text-neutral-600">
              Nhập email để nhận mã OTP xác thực
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Gửi mã OTP
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-neutral-600">Đã có tài khoản? </span>
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

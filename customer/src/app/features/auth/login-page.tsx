import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "../../shared/ui/input";
import { Button } from "../../shared/ui/button";
import { useAuth } from "../../../shared/contexts/auth-context";
import { authService } from "../../../shared/services/auth.service";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authService.login({ email, password });

      if (!res.success || !res.user) {
        throw new Error(res.message || "Đăng nhập thất bại");
      }

      login({
        id: res.user.id,
        email: res.user.email || email,
        username: res.user.username,
        role: res.user.role,
      });

      toast.success("Đăng nhập thành công!");
      navigate("/", { replace: true });
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Đăng nhập thất bại. Vui lòng thử lại.",
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
            <h1 className="text-3xl font-bold text-primary mb-2">Đăng nhập</h1>
            <p className="text-neutral-600">Chào mừng bạn quay trở lại!</p>
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

            <div>
              <label className="block mb-2 text-sm text-foreground">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-12 rounded-lg border-2 border-border bg-input-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-primary hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={loading}
            >
              Đăng nhập
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-neutral-600">Chưa có tài khoản? </span>
            <Link
              to="/register"
              className="text-primary font-medium hover:underline"
            >
              Đăng ký ngay
            </Link>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-neutral-500">
                  Hoặc đăng nhập với
                </span>
              </div>
            </div>

            <div className="mt-4">
              <a href={authService.googleLoginUrl()} className="block">
                <Button variant="outline" type="button" className="w-full">
                  <img
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    className="h-5 w-5 mr-2"
                  />
                  Đăng nhập với Google
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

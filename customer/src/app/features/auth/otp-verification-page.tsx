import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "../../shared/ui/button";
import { Input } from "../../shared/ui/input";
import { authService } from "../../../shared/services/auth.service";
import { toast } from "sonner";

export function OTPVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const initialUsername = location.state?.username || "";
  const initialPassword = location.state?.password || "";

  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [confirmPassword, setConfirmPassword] = useState(initialPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!email) {
      toast.error("Vui lòng nhập email để nhận OTP");
      navigate("/register");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(
        () => setResendCountdown(resendCountdown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus last filled input or next empty
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Vui lòng nhập đầy đủ mã OTP");
      return;
    }

    if (!username.trim()) {
      toast.error("Vui lòng nhập tên đăng nhập");
      return;
    }

    if (!password || password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await authService.verifyOtp(email, otpCode);

      if (!verifyRes.success) {
        throw new Error(verifyRes.message || "Xác thực OTP thất bại");
      }

      const res = await authService.registerWithOtp({
        email,
        otpCode,
        username: username.trim(),
        password,
      });

      if (!res.success) {
        throw new Error(res.message || "Đăng ký thất bại");
      }

      toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Mã OTP không hợp lệ hoặc đã hết hạn.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    try {
      if (!email) {
        toast.error("Vui lòng nhập email để nhận OTP");
        return;
      }
      await authService.resendOtp(email);
      setResendCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      toast.success("Mã OTP mới đã được gửi đến email của bạn");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Không thể gửi lại OTP",
      );
    }
  };

  const otpComplete = otp.every((digit) => digit !== "");
  const canSubmit =
    otpComplete &&
    username.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-neutral-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-3xl">✉️</span>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">
              Xác thực OTP
            </h1>
            <p className="text-neutral-600">
              Vui lòng nhập mã OTP đã được gửi đến
            </p>
            <p className="font-medium text-primary mt-1">{email}</p>
          </div>

          <div className="mb-6">
            <div className="flex justify-center gap-2 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 text-center text-2xl font-semibold rounded-lg border-2 border-border bg-input-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              ))}
            </div>

            <div className="space-y-4 mb-6">
              <Input
                type="text"
                label="Tên đăng nhập"
                placeholder="nguyenvana"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                    minLength={6}
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

              <div>
                <label className="block mb-2 text-sm text-foreground">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 rounded-lg border-2 border-border bg-input-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleVerify}
              disabled={!canSubmit}
              loading={loading}
              className="w-full"
              size="lg"
            >
              Xác nhận
            </Button>
          </div>

          <div className="text-center text-sm">
            <p className="text-neutral-600 mb-2">Bạn không nhận được mã?</p>
            {resendCountdown > 0 ? (
              <p className="text-neutral-500">Gửi lại sau {resendCountdown}s</p>
            ) : (
              <button
                onClick={handleResend}
                className="text-primary font-medium hover:underline"
              >
                Gửi lại mã OTP
              </button>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <button
              onClick={() => navigate("/register")}
              className="text-sm text-neutral-600 hover:text-primary"
            >
              ← Quay lại đăng ký
            </button>
          </div>
        </div>

        <div className="mt-6 bg-info/10 border border-info/20 rounded-lg p-4 text-sm text-center">
          <p className="text-info-foreground">
            Mã OTP có hiệu lực trong 5 phút. Vui lòng kiểm tra cả thư mục spam
            nếu không thấy email.
          </p>
        </div>
      </div>
    </div>
  );
}

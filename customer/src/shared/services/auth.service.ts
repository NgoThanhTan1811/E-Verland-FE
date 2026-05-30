import { apiRequest } from "./api-client";
import { VITE_API_BASE_URL } from "../../app/shared/constants";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  refreshToken?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
  user?: {
    id: string;
    email?: string;
    username?: string;
    role?: string;
  };
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export const authService = {
  login: (data: LoginRequest) =>
    apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  refresh: (refreshToken: string) =>
    apiRequest<LoginResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),

  changePassword: (data: ChangePasswordRequest) =>
    apiRequest<{ success: boolean; message?: string }>(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    ),

  sendOtp: (email: string) =>
    apiRequest<{ success: boolean; message?: string }>("/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, otpCode: string) =>
    apiRequest<{ success: boolean; message?: string }>("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otpCode }),
    }),

  registerWithOtp: (data: {
    email: string;
    otpCode: string;
    username: string;
    password: string;
  }) =>
    apiRequest<LoginResponse>("/auth/register-with-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resendOtp: (email: string) =>
    apiRequest<{ success: boolean; message?: string }>("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  forgotPasswordRequestOtp: (email: string) =>
    apiRequest<{ success: boolean; message?: string }>(
      "/auth/forgot-password/request-otp",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
    ),

  forgotPasswordVerifyOtp: (email: string, otpCode: string) =>
    apiRequest<{ success: boolean; message?: string }>(
      "/auth/forgot-password/verify-otp",
      {
        method: "POST",
        body: JSON.stringify({ email, otpCode }),
      },
    ),

  forgotPasswordReset: (email: string, otpCode: string, newPassword: string) =>
    apiRequest<{ success: boolean; message?: string }>(
      "/auth/forgot-password/reset",
      {
        method: "POST",
        body: JSON.stringify({ email, otpCode, newPassword }),
      },
    ),

  googleLoginUrl: () => `${VITE_API_BASE_URL}/auth/google/login`,
  googleRegisterUrl: () => `${VITE_API_BASE_URL}/auth/google/register`,
};

import { VITE_API_BASE_URL } from "../../app/shared/constants";

const getToken = (): string | null => {
  try {
    const stored = localStorage.getItem("everland_auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.token || null;
    }
  } catch {}
  return null;
};

const getRefreshToken = (): string | null => {
  try {
    const stored = localStorage.getItem("everland_auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.refreshToken || null;
    }
  } catch {}
  return null;
};

const saveTokens = (token: string, refreshToken: string) => {
  try {
    const stored = localStorage.getItem("everland_auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);
      localStorage.setItem(
        "everland_auth",
        JSON.stringify({
          ...parsed,
          token,
          refreshToken,
          tokenExpiresAt: expiresAt.toISOString(),
        }),
      );
    }
  } catch {}
};

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await fetch(`${VITE_API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  if (data.token && data.refreshToken) {
    saveTokens(data.token, data.refreshToken);
    return data.token;
  }
  return null;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  // credentials: "include" là quan trọng nhất để gửi Cookie
  const res = await fetch(`${VITE_API_BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  // Xử lý lỗi 401
  if (res.status === 401) {
    // Nếu bị 401, server yêu cầu đăng nhập lại
    // Vì dùng Cookie, không còn cần logic refresh token phức tạp ở client
    window.location.href = "/login";
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed: ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}
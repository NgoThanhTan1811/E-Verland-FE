import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { VITE_API_BASE_URL } from "../../app/shared/constants";

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuthRedirect?: boolean;
  body?: unknown;
}

let isRedirectingToLogin = false;

const apiClient = axios.create({
  baseURL: VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const config = error.config as ApiRequestConfig | undefined;
    const requestUrl = config?.url || "";

    if (
      status === 401 &&
      !config?.skipAuthRedirect &&
      !requestUrl.startsWith("/auth/")
    ) {
      if (!isRedirectingToLogin && typeof window !== "undefined") {
        isRedirectingToLogin = true;
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

export async function apiRequest<T>(
  path: string,
  config: ApiRequestConfig = {},
): Promise<T> {
  const { body, ...requestConfig } = config;

  const response = await apiClient.request<T>({
    url: path,
    ...requestConfig,
    data: body ?? requestConfig.data,
  });

  return response.data;
}

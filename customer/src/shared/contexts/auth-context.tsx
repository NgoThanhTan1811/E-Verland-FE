import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthState, User } from "../types/domain";

interface AuthContextType extends AuthState {
  login: (user: User) => void;

  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "everland_auth";

const isDevEnv = Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!parsed?.user) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          return {
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
            tokenExpiresAt: null,
          };
        }

        // Check if token is expired (skip when using cookie auth)
        if (
          parsed.token &&
          parsed.tokenExpiresAt &&
          new Date(parsed.tokenExpiresAt) < new Date()
        ) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          return {
            isAuthenticated: false,
            user: null,
            token: null,
            refreshToken: null,
            tokenExpiresAt: null,
          };
        }

        return {
          ...parsed,
          isAuthenticated: true,
        };
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
    };
  });

  useEffect(() => {
    // Save to localStorage whenever auth state changes
    if (authState.isAuthenticated) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [authState]);

  useEffect(() => {
    // Load from localStorage on init
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!parsed?.user) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          return;
        }

        // Check if token is expired (skip when using cookie auth)
        if (
          parsed.token &&
          parsed.tokenExpiresAt &&
          new Date(parsed.tokenExpiresAt) < new Date()
        ) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          return;
        }

        setAuthState({
          ...parsed,
          isAuthenticated: true,
        });
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

const login = (user: User) => {
  const nextState: AuthState = {
    isAuthenticated: true,
    user,
    token: null, // Không lưu token
    refreshToken: null, // Không lưu refreshToken
    tokenExpiresAt: null, // Không cần thời hạn lưu cục bộ
  };

  // Bạn có thể xóa key trong localStorage để dọn dẹp dữ liệu cũ
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}

  setAuthState(nextState);
};

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {}
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
    });
  };

  const updateUser = (user: User) => {
    setAuthState((prev) => ({
      ...prev,
      user,
    }));
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

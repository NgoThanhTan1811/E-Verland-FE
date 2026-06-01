import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthState, User } from "../types/domain";
import { accountService } from "../services/account.service";
import { authService } from "../services/auth.service";

interface AuthContextType extends AuthState {
  login: (user: User) => void;

  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type SessionAccount = {
  account: {
    id: string;
    email: string;
    username?: string;
    role: number;
  };
  profile: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  } | null;
};

const emptyAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  tokenExpiresAt: null,
};

const mapSessionToUser = (session: SessionAccount): User => ({
  id: session.account.id,
  email: session.account.email,
  username: session.account.username,
  role: String(session.account.role),
  profile: session.profile
    ? {
        id: session.profile.id,
        firstName: session.profile.firstName,
        lastName: session.profile.lastName,
        avatarUrl: session.profile.avatarUrl,
      }
    : undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(emptyAuthState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrapSession = async () => {
      try {
        const session = (await accountService.me({
          skipAuthRedirect: true,
        })) as SessionAccount;

        if (cancelled) return;

        if (session?.account) {
          setAuthState({
            isAuthenticated: true,
            user: mapSessionToUser(session),
            token: null,
            refreshToken: null,
            tokenExpiresAt: null,
          });
        }
      } catch {
        if (!cancelled) {
          setAuthState(emptyAuthState);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = (user: User) => {
    setAuthState({
      isAuthenticated: true,
      user,
      token: null,
      refreshToken: null,
      tokenExpiresAt: null,
    });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Session may already be gone; clear client state anyway.
    }
    setAuthState(emptyAuthState);
  };

  const updateUser = (user: User) => {
    setAuthState((prev) => ({
      ...prev,
      user,
    }));
  };

  if (!isReady) {
    return null;
  }

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

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_SELLER_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api/";

export function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    void fetch(`${API_BASE_URL}auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // Best-effort server logout; local cleanup still runs.
    });

    logout();
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-sm w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-lg">
        <p className="text-slate-900 dark:text-white font-medium">
          Logging out...
        </p>
      </div>
    </div>
  );
}

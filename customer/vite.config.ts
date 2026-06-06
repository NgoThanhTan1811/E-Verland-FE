import { defineConfig, loadEnv } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env từ file .env (bao gồm cả VITE_ prefix và không có prefix)
  const env = loadEnv(mode, process.cwd(), "");

  // Target proxy: đọc từ API_TARGET (không có VITE_ prefix → không bị bundle vào client)
  const apiTarget = env.API_TARGET || "http://localhost:8080";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        protocol: "ws",
        host: "localhost",
      },
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          // Khi target là HTTPS server, cần forward cookie đúng
          cookieDomainRewrite: {
            "*": "",
          },
        },
      },
    },
    assetsInclude: ["**/*.svg", "**/*.csv"],
  };
});

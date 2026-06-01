import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // THÊM ĐOẠN NÀY ĐỂ FIX LỖI WEBSOCKET
  server: {
    port: 5173,
    strictPort: true, // Đảm bảo dùng đúng port 5173
    hmr: {
      protocol: "ws",
      host: "localhost",
    },
    // Nếu bạn cần proxy API sang backend
    proxy: {
      "/api": {
        target: "http://localhost:8080", // Thay đổi nếu backend của bạn chạy port khác
        changeOrigin: true,
        secure: false,
      },
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
});

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  build: { sourcemap: false, chunkSizeWarningLimit: 1000, target: "esnext", minify: "esbuild" },
  server: { host: true, port: 5173, hmr: { overlay: false } },
});

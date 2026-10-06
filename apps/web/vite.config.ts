import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const rawPort = process.env.PORT ?? "5173";
const port = Number(rawPort);
const webDir = process.cwd();

if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(webDir, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: webDir,
  build: {
    outDir: path.resolve(webDir, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8080",
      },
    },
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "127.0.0.1",
  },
});

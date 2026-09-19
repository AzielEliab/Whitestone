import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          pdf: ["pdfjs-dist"],
          docx: ["mammoth"],
        },
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        timeout: 2000,
        configure(proxy) {
          proxy.on("error", (_err, _req, res) => {
            const outgoing = res as { writeHead?: (code: number, headers: Record<string, string>) => void; end?: (body: string) => void; headersSent?: boolean };
            if (outgoing.writeHead && outgoing.end && !outgoing.headersSent) {
              outgoing.writeHead(503, { "content-type": "application/json" });
              outgoing.end(JSON.stringify({ ok: false, capability: "allowlisted-public-pages", unavailable: true }));
            }
          });
        },
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
  },
});

import react from "@vitejs/plugin-react";
import type { Connect, Plugin } from "vite";
import { defineConfig } from "vitest/config";
import { CONTENT_SIGNAL, matchDiscovery } from "./worker/discovery";

export default defineConfig({
  base: "./",
  plugins: [react(), discoveryPlugin()],
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
    include: ["src/**/*.test.ts", "worker/**/*.test.ts"],
  },
});

function discoveryPlugin(): Plugin {
  const attach = (middlewares: Connect.Server) => {
    middlewares.use((req, res, next) => {
      res.setHeader("Content-Signal", CONTENT_SIGNAL);
      const hit = matchDiscovery(req.url || "/", req.method || "GET");
      if (!hit) {
        next();
        return;
      }
      res.statusCode = hit.status;
      res.setHeader("content-type", hit.contentType);
      res.setHeader("cache-control", hit.status === 200 ? "public, max-age=3600" : "no-store");
      res.setHeader("x-content-type-options", "nosniff");
      if ((req.method || "GET") === "HEAD") {
        res.end();
        return;
      }
      res.end(hit.body);
    });
  };
  return {
    name: "whitestone-discovery",
    configureServer(server) {
      attach(server.middlewares);
    },
    configurePreviewServer(server) {
      attach(server.middlewares);
    },
  };
}

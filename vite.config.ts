import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";
import { setupSocketIO } from "./server/socket";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
    fs: {
      allow: [".", "./client", "./shared"],

    },
  },
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks - split large dependencies
          if (id.includes('node_modules/react')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/three')) {
            return 'vendor-three';
          }
          // Admin components (lazy loaded)
          if (id.includes('client/components/admin')) {
            return 'admin';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // App is feature-rich with comprehensive admin dashboard and multiple games
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      const app = createServer();

      if (server.httpServer) {
        setupSocketIO(server.httpServer as any);
      }

      // Add middleware that runs BEFORE SPA handler to intercept /api routes
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          console.log(`[ViteProxy] Intercepting: ${req.url}`);
          app(req, res);
        } else {
          next();
        }
      });
    },
  };
}

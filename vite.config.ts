import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/Solo-Leveling-MP4/" : "/",
  server: {
    port: 8081,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`
    },
    dedupe: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@tanstack/query-core"
    ]
  },
  optimizeDeps: {
    include: ["use-sync-external-store/shim/with-selector"],
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
      spa: { enabled: true }
    }),
    react(),
    tailwindcss(),
    tsconfigPaths({ projects: ["./tsconfig.json"] }),
  ],
});

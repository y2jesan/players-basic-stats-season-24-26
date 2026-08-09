import path from "node:path"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// tanstackRouter must come before react() — reversing the order breaks route-tree generation.
// This plugin is also the only thing that generates src/routeTree.gen.ts (gitignored, no
// standalone CLI in this setup) — it's written as a side effect of Vite actually running, which
// is why package.json's "build" script runs `vite build` before `tsc -b`, not after: on a fresh
// checkout with no stale routeTree.gen.ts already on disk, tsc would fail immediately with
// "Cannot find module '@/routeTree.gen'" if it ran first.
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
})

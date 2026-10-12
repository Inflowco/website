import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// VITE_BASE is "/" for a custom domain or local dev, and "/<repo>/" when the
// site is served from a GitHub Pages project URL. The deploy workflow sets it.
export default defineConfig(() => ({
  base: process.env.VITE_BASE || "/",
  plugins: [
    nodePolyfills({
      include: ["stream", "crypto", "process"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    react(),
  ],
  build: {
    assetsDir: "_assets",
  },
}));

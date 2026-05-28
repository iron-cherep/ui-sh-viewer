import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Tauri's `beforeDevCommand` waits for `devUrl` (http://localhost:5173), so
    // fail rather than silently hop to another port if 5173 is taken.
    strictPort: true,
    proxy: {
      // Web/dev-browser path only. The desktop app talks to ui.sh directly via
      // the Tauri HTTP plugin (see src/effect/layers.ts) and never hits this.
      "/mcp": {
        target: "https://ui.sh",
        changeOrigin: true,
      },
    },
  },
});

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/mcp": {
        target: "https://ui.sh",
        changeOrigin: true,
      },
    },
  },
});

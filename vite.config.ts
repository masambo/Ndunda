import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 9010,
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@clerk")) return "clerk";
          if (id.includes("convex")) return "convex";
          if (id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("cmdk")) return "ui";
          if (id.includes("recharts")) return "charts";
          if (id.includes("react")) return "react-vendor";
          return "vendor";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

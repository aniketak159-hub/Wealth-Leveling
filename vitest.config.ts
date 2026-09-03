import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve("artifacts/wealth-levels/src"),
    },
  },
  test: {
    environment: "jsdom",
    restoreMocks: true,
    clearMocks: true,
  },
});

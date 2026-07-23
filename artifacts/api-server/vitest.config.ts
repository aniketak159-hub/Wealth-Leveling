import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/test/setup.ts"],
    // Run suites sequentially to avoid DB conflicts between test files
    fileParallelism: false,
    testTimeout: 20000,
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
    },
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**"],
      exclude: ["src/**/*.test.ts"],
      all: true,
      threshold: {
        global: {
          statements: 45,
          branches: 50,
          functions: 70,
          lines: 45,
        },
      },
    },
  },
});

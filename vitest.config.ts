import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    coverage: { reporter: ["text", "json-summary", "html"], thresholds: { lines: 70, functions: 70, statements: 70 } },
    environment: "jsdom",
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    setupFiles: ["./tests/setup.ts"],
  },
});

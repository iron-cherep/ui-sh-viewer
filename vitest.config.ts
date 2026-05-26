import { defineConfig } from "vitest/config";

// Unit tests run in Node. IndexedDB-backed services rely on the in-memory
// `fake-indexeddb` polyfill installed by tests/setup.ts.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
});

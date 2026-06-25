import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // Next.js "server-only" is a marker package; shim to empty module for vitest (pure fn tests).
      "server-only": path.resolve(__dirname, "lib/__shims__/server-only.ts"),
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "dist", "**/.worktrees/**", ".worktrees/**", "**/route.test.ts", "**/jobs/**", "**/clips/**"],
    env: {
      ALLOWED_TRANSCRIBE_MEDIA_HOSTS: "stream.mux.com,cdn.example.com",
    },
  },
});

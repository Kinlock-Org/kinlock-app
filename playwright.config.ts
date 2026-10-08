import { defineConfig } from "@playwright/test";

/** Tests run against a real production build, since /claim/*'s CSP differs by NODE_ENV
 *  (proxy.ts allows 'unsafe-eval' only in dev); a dev-mode run wouldn't test the real policy. */
export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: { baseURL: "http://localhost:3000" },
});

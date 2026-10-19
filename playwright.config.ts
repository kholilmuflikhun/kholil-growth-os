import { defineConfig, devices } from "@playwright/test";
const ci = Boolean(process.env.CI);
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 1,
  timeout: 120_000,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? "github" : "list",
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
  webServer: [
    { command: "pnpm --filter @kholil/web dev", url: "http://127.0.0.1:3000", reuseExistingServer: !ci, timeout: 120_000 },
    { command: "pnpm --filter @kholil/gos dev", url: "http://127.0.0.1:3001/login", reuseExistingServer: !ci, timeout: 120_000, env: { AUTH_SECRET: process.env.AUTH_SECRET || "local-e2e-secret-change-this-value-1234567890", DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/kholil_growth_os?schema=public", DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/kholil_growth_os?schema=public" } },
  ],
});

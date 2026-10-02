import { defineConfig, devices } from "@playwright/test";

// Separate from playwright.config.js on purpose: this is a media generator for the README,
// not a test suite, so it must never run in CI or under `npm run test:e2e`.
// Run:  npx playwright test -c playwright.capture.config.js   (backend must be running)
export default defineConfig({
  testDir: "./e2e-capture",
  testMatch: "**/*.capture.js",
  timeout: 180_000,
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30_000,
    env: { VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? "http://localhost:9090" },
  },
});
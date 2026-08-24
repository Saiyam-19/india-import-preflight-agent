import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3210",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
    {
      name: "mobile-360",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 360, height: 800 },
      },
    },
  ],
  webServer: {
    command:
      "PREFLIGHT_PROMOTION_HARNESS=1 node_modules/.bin/next dev --hostname 127.0.0.1 --port 3210",
    url: "http://127.0.0.1:3210/promotion-harness",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

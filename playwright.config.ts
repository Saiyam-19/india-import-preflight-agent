import { defineConfig, devices } from "@playwright/test";

const reuseRunningServer = process.env.BWMI_REUSE_SERVER === "1";

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
  ...(reuseRunningServer ? {} : {
    webServer: {
      command: "node_modules/.bin/next dev --hostname 127.0.0.1 --port 3210",
      ...(process.env.RUN_LIVE_OPENAI_GUIDANCE === "1" ? {} : {
        env: {
          ...process.env,
          BWMI_OPENAI_BASE_URL: "",
          BWMI_OPENAI_MODEL: "",
          OPENAI_API_KEY: "",
          OPENROUTER_API_KEY: "",
        },
      }),
      url: "http://127.0.0.1:3210/",
      reuseExistingServer: true,
      timeout: 120_000,
    },
  }),
});

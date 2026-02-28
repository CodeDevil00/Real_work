import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 120000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    headless: true,
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "npm run dev",
      cwd: "../../api",
      env: {
        PORT: "5001",
      },
      url: "http://127.0.0.1:5001/health",
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: "npm run dev -- --host 127.0.0.1 --port 5173",
      cwd: ".",
      env: {
        VITE_API_URL: "http://127.0.0.1:5001",
      },
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});

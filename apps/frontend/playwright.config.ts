import { defineConfig, devices } from "@playwright/test"

// Runs against the app that is already up (`pnpm dev`): no webServer here, so the
// tests never start a second instance. Seeded accounts come from the backend seed.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3050",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})

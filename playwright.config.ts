import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const DEV_PORT = 5174
const CI = !!process.env.CI
// Point the suite at a server that is already running (e.g. the preview on a LAN address).
const EXTERNAL_URL = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: EXTERNAL_URL ?? `http://localhost:${PORT}`,
    trace: 'on-first-retry',
    // The LAN preview can serve a self-signed certificate (LAN_HTTPS=1).
    ignoreHTTPSErrors: true,
  },
  webServer: EXTERNAL_URL
    ? []
    : [
        {
          command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
          url: `http://localhost:${PORT}`,
          reuseExistingServer: !CI,
          timeout: 120_000,
        },
        // Dev server for specs that import source modules directly (e2e/engine.spec.ts).
        {
          command: `npm run dev -- --port ${DEV_PORT} --strictPort`,
          url: `http://localhost:${DEV_PORT}`,
          reuseExistingServer: !CI,
          timeout: 120_000,
        },
      ],
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'desktop-webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'phone-android', use: { ...devices['Pixel 7'] } },
    { name: 'phone-ios', use: { ...devices['iPhone 14'] } },
    { name: 'tablet-ios', use: { ...devices['iPad (gen 7)'] } },
    { name: 'tablet-ios-landscape', use: { ...devices['iPad (gen 7) landscape'] } },
  ],
})

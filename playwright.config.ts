import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const CI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'on-first-retry' },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
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

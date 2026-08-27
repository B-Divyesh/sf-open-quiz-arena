import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  retries: 1,
  workers: 1,
  use: { baseURL: process.env.BASE_URL ?? 'http://127.0.0.1:8080', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 360, height: 780 } }, testMatch: /mobile/ }
  ],
  webServer: process.env.BASE_URL ? undefined : { command: 'npm run build && cargo run', url: 'http://127.0.0.1:8080/health', reuseExistingServer: true, timeout: 120_000 }
});

import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * Usage:
 * - Run against local dev: npx playwright test
 * - Run against deployed URL: BASE_URL=https://your-deployment.com npx playwright test
 * 
 * Environment variables:
 * - BASE_URL: The base URL to test against (default: http://localhost:5173)
 * - SUPABASE_URL: Supabase project URL for cleanup/setup
 * - SUPABASE_ANON_KEY: Supabase anon key for cleanup/setup
 */

const isLocalDev = !process.env.BASE_URL || process.env.BASE_URL.includes('localhost');

export default defineConfig({
  testDir: './tests/e2e',
  FullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  ...(isLocalDev && {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  }),
});
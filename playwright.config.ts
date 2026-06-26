import { defineConfig, devices } from '@playwright/test';

/**
 * P2-15 Playwright E2E config (added for CI hygiene).
 * Uses webServer to auto start `npm run start` (after build in CI) for tests.
 * Basic projects: chromium only for speed in gates.
 * baseURL for relative goto in specs.
 * In local: reuse server if running; CI always fresh.
 * To run: npm run e2e (or npx playwright test).
 * See .github/workflows/ci.yml for install + test step.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Mobile profiles run ONLY the mobile spec (desktop-oriented specs like
    // live.spec.ts assume a wide nav and would false-fail on small viewports).
    {
      name: 'iphone-13',
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'pixel-7',
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://127.0.0.1:3000',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
  },
});

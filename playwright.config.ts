import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const env = {
  DATABASE_URL: `postgresql://${process.env.USER}@localhost:5432/mstech_test?schema=public`,
  NEXTAUTH_URL: `http://localhost:${PORT}`,
  NEXTAUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-e2e',
  ENCRYPTION_KEY: 'a'.repeat(64),
  CRON_SECRET: 'e2e-cron',
  ENABLE_SANDBOX: '1',
  DISABLE_RATE_LIMIT: '1',
  FX_OFFLINE: '1',
  IBKR_FLEX_ENABLED: '1', E2E_EXPOSE_RESET: '1',
  NEXT_TELEMETRY_DISABLED: '1',
};

// Runs against a production build: what a user gets, without dev-only overlays.
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: process.env.CI ? 1 : 2,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/report.json' }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'iphone', use: { ...devices['iPhone 15 Pro'] } },
    { name: 'iphone-se', use: { ...devices['iPhone SE'] } },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: true,
    env,
    timeout: 60_000,
  },
});

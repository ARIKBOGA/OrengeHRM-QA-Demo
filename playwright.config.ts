import { defineConfig, devices } from '@playwright/test';
import { config } from './src/config/env';

export default defineConfig({
  testDir:       './tests',
  fullyParallel: false,
  forbidOnly:    !!process.env.CI,
  retries:       process.env.CI ? 2 : 0,
  workers:       process.env.CI ? 2 : 1,
  timeout:       45_000,
  expect:        { timeout: 10_000 },

  reporter: [
    ['list'],
    ['allure-playwright', {
      resultsDir:  'reports/allure-results',
      detail:      true,
      suiteTitle:  true,
      environmentInfo: {
        Environment: config.env,
        BaseURL:     config.baseUrl,
        DBEnabled:   String(config.dbEnabled),
      },
    }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  use: {
    baseURL:           config.baseUrl,
    headless:          true,
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'on-first-retry',
    actionTimeout:     15_000,
    navigationTimeout: 45_000,
  },

  projects: [
    {
      name:      'integration',
      testMatch: /.*\.integration\.spec\.ts/,
      use:       { ...devices['Desktop Chrome'] },
    },
    {
      name:      'system',
      testMatch: /.*\.system\.spec\.ts/,
      use:       { ...devices['Desktop Chrome'] },
    },
    {
      name:      'e2e',
      testMatch: /.*\.e2e\.spec\.ts/,
      use:       { ...devices['Desktop Chrome'] },
    },
  ],
});

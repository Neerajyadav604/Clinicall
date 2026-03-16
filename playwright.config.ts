import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  outputDir: 'test-artifacts',

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list']
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    actionTimeout:     30000,
    navigationTimeout: 30000,
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'retain-on-failure',
  },

  projects: [
    // ✅ Setup project: runs auth.setup.ts EXACTLY ONCE per run (workers: 1)
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      workers: 1, // ← CRITICAL: prevents multiple workers from hitting login endpoint simultaneously
    },

    // ✅ Main test project: runs in parallel AFTER setup completes
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json', // ← all workers share this single saved auth
      },
      dependencies: ['setup'], // ← waits for setup to finish first
      fullyParallel: true,
      workers: process.env.CI ? 2 : 4, // ← parallel execution only AFTER auth is cached
    },

    // ✅ Teardown project (optional): removes stale auth to prevent credential issues in next run
    {
      name: 'teardown',
      testMatch: /.*\.teardown\.ts/,
      use: { ...devices['Desktop Chrome'] },
      workers: 1,
    },
  ],
});

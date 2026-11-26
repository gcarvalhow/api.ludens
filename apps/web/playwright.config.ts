import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3100', ...(!process.env.CI ? { channel: 'chrome' } : {}), headless: true },
  webServer: {
    command: 'npm run start -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/login',
    reuseExistingServer: false,
    timeout: 60000,
  },
});

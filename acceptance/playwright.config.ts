import { defineConfig } from '@playwright/test';

const baseURL = process.env.ACCEPTANCE_BASE_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
});

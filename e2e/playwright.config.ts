import { defineConfig } from '@playwright/test';
import * as path from 'path';

// Browsers use Playwright's default cache (~/.cache/ms-playwright) — the same
// location `npx playwright install` writes to, and what CI caching expects.

// e2e/ sits at the repo root — resolve rather than hardcode the checkout path.
const REPO = path.resolve(__dirname, '..');

export default defineConfig({
  testDir: './specs',
  workers: 1,
  fullyParallel: false,
  retries: 0, // a failing test is a finding, never retried into passing
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  globalSetup: './global-setup',
  globalTeardown: './global-teardown',
  use: {
    baseURL: 'http://localhost:3000', // Vite dev server (live source; :8000 serves a stale dist)
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'uv run uvicorn app.main:app --host 127.0.0.1 --port 8000',
      cwd: `${REPO}/server`,
      url: 'http://localhost:8000/api/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      cwd: `${REPO}/client`,
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});

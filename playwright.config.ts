import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'

// Credentials live in .env.e2e (git-ignored). Never hard-code them here.
config({ path: '.env.e2e', quiet: true })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    // basePath is /trackfolio: keep the trailing slash and use relative paths in goto().
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000/trackfolio/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['Desktop Chrome']
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'e2e', dependencies: ['setup'], use: { storageState: 'e2e/.auth/user.json' } }
  ]
})

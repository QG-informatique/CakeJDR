import { defineConfig, devices } from '@playwright/test'

const port = 3000
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run start',
    port,
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      // Chrome installé sur le poste : rien à télécharger pour lancer les tests.
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
})

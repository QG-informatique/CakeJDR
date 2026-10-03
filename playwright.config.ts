import { defineConfig, devices } from '@playwright/test'

const port = 3000
// E2E_BASE_URL=https://cakejdr.qg-informatique.fr npx playwright test
// vise le site en ligne au lieu de lancer le serveur local.
const remoteURL = process.env.E2E_BASE_URL
const baseURL = remoteURL || `http://localhost:${port}`

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
  webServer: remoteURL ? undefined : {
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

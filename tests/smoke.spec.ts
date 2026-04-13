import { expect, test } from '@playwright/test'

test('landing redirects to menu', async ({ page }) => {
  await page.goto('/')
  await page.waitForFunction(() => window.location.pathname === '/menu')
  await expect(page.getByPlaceholder(/pseudo|username/i)).toBeVisible()
})

test('menu accueil loads with a stored profile', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'jdr_profile',
      JSON.stringify({
        pseudo: 'SmokeMJ',
        color: '#1d4ed8',
        isMJ: true,
        loggedIn: true,
      }),
    )
  })

  await page.goto('/menu-accueil')
  await expect(page.getByText(/fiches|character/i).first()).toBeVisible()
})

test('timestamp API returns monotonic payload', async ({ request }) => {
  const first = await request.get('/api/timestamp')
  expect(first.ok()).toBeTruthy()
  const firstBody = await first.json()
  expect(firstBody.ok).toBe(true)
  expect(typeof firstBody.ts).toBe('number')

  const second = await request.get('/api/timestamp')
  expect(second.ok()).toBeTruthy()
  const secondBody = await second.json()
  expect(secondBody.ok).toBe(true)
  expect(secondBody.ts).toBeGreaterThanOrEqual(firstBody.ts)
})

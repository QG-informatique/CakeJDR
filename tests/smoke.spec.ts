import { expect, test } from '@playwright/test'

// Parcours d'un visiteur non connecté. Les parcours avec compte (Google,
// Discord) restent dans MANUAL_TEST_PLAN.md : ils passent par de vrais
// fournisseurs d'identité.

test('landing leads to the sign-in menu', async ({ page }) => {
  await page.goto('/')
  await page.waitForURL(/\/menu-accueil/)
  await expect(page.getByRole('button', { name: /Discord/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /Google/ })).toBeVisible()
})

test('QG Informatique credit is visible and links to the site', async ({ page }) => {
  await page.goto('/menu-accueil')
  const credit = page.getByRole('link', { name: 'QG Informatique' })
  await expect(credit).toBeVisible()
  await expect(credit).toHaveAttribute('href', 'https://www.qg-informatique.fr')
})

test('legal pages render', async ({ page }) => {
  await page.goto('/confidentialite')
  await expect(page.getByRole('heading', { name: /confidentialité/i })).toBeVisible()
  await page.goto('/conditions')
  await expect(page.getByRole('heading').first()).toBeVisible()
})

test('a guest can open the demo table', async ({ page }) => {
  await page.setViewportSize({ width: 1500, height: 900 })
  await page.goto('/menu-accueil')
  await page.getByRole('button', { name: /invité|guest/i }).click()
  await page.waitForURL(/\/room\//, { timeout: 15_000 })
  // La table est chargée quand la connexion Liveblocks est établie et que
  // la barre d'outils du canevas apparaît.
  await expect(page.getByRole('button', { name: /^(Dessin|Draw)$/ })).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('canvas').first()).toBeVisible()
  // Pas de bandeau de connexion perdue une fois la table ouverte.
  await expect(page.getByText(/Connexion perdue|Connection lost/)).toHaveCount(0)
})

test('on a phone, the table shows one panel at a time', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/menu-accueil')
  await page.getByRole('button', { name: /invité|guest/i }).click()
  await page.waitForURL(/\/room\//, { timeout: 15_000 })
  // Onglet Table par défaut : canevas et dés, avec une vraie hauteur.
  await expect(page.getByRole('tab', { name: /^(Table)$/ })).toHaveAttribute('aria-selected', 'true', { timeout: 20_000 })
  const canvasBox = await page.locator('canvas').first().boundingBox()
  expect(canvasBox?.height ?? 0).toBeGreaterThan(200)
  await expect(page.getByRole('button', { name: /^(Lancer|Roll)$/ })).toBeVisible()

  await page.getByRole('tab', { name: /^(Chat)$/ }).click()
  await expect(page.getByPlaceholder(/Votre message|Your message/)).toBeVisible()
  await expect(page.getByRole('button', { name: /^(Lancer|Roll)$/ })).toBeHidden()

  await page.getByRole('tab', { name: /^(Fiche|Sheet)$/ }).click()
  await expect(page.getByRole('tab', { name: /^(Statistiques|Stats)$/ })).toBeVisible()
  // Rien ne déborde sur la droite.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

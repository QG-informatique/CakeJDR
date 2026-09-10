import { expect, test } from '@playwright/test'

test('rooms list exposes normalized response shape', async ({ request }) => {
  const res = await request.get('/api/rooms/list')
  expect(res.status()).toBeLessThan(600)
  const body = await res.json()
  expect(typeof body.ok).toBe('boolean')
  if (body.ok) {
    expect(Array.isArray(body.rooms)).toBeTruthy()
  } else {
    expect(typeof body.error).toBe('string')
  }
})

test('deprecated blob delete route is gone', async ({ request }) => {
  // /api/blop/delete supprimait n'importe quel fichier sans aucun controle.
  // Elle n'avait plus d'appelant : retiree plutot que verrouillee.
  const res = await request.get('/api/blop/delete')
  expect(res.status()).toBe(404)
})

test('roomstorage refuses access without a room token', async ({ request }) => {
  const res = await request.get('/api/roomstorage?roomId=whatever')
  expect(res.status()).toBe(403)
  const body = await res.json()
  expect(body.ok).toBe(false)
})

test('character sheets require an account', async ({ request }) => {
  const res = await request.get('/api/characters')
  expect(res.status()).toBe(401)
})

test('security headers are present', async ({ request }) => {
  const res = await request.get('/menu')
  const headers = res.headers()
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
})

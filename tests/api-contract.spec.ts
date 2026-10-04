import { expect, test } from '@playwright/test'

// Contrat des routes API vu par un visiteur non connecté : ce qu'il peut lire,
// et surtout tout ce qui doit lui être refusé.

test('rooms list is empty for an anonymous visitor', async ({ request }) => {
  const res = await request.get('/api/rooms/list')
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.ok).toBe(true)
  expect(body.rooms).toEqual([])
})

test('there is no public listing of every table', async ({ request }) => {
  // GET /api/rooms listait toutes les tables à n'importe qui : retiré.
  const res = await request.get('/api/rooms')
  expect(res.status()).toBe(405)
})

test('creating a table requires an account', async ({ request }) => {
  const res = await request.post('/api/rooms', { data: { name: 'Table e2e' } })
  expect(res.status()).toBe(401)
  const body = await res.json()
  expect(body.ok).toBe(false)
})

test('deleting or renaming a table is refused to a stranger', async ({ request }) => {
  const del = await request.delete('/api/rooms', { data: { id: 'table-e2e-inexistante' } })
  expect([401, 403]).toContain(del.status())
  const patch = await request.patch('/api/rooms', {
    data: { id: 'table-e2e-inexistante', name: 'Piratée' },
  })
  expect([401, 403]).toContain(patch.status())
})

test('room token is not issued for an unknown table', async ({ request }) => {
  const missing = await request.post('/api/rooms/verify', { data: {} })
  expect(missing.status()).toBe(400)
  const unknown = await request.post('/api/rooms/verify', { data: { id: 'table-e2e-inexistante' } })
  expect(unknown.status()).toBe(404)
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

test('cleanup cron refuses calls without its secret', async ({ request }) => {
  const res = await request.get('/api/cron/cleanup-rooms')
  expect(res.status()).toBe(403)
})

test('removed routes stay removed', async ({ request }) => {
  // /api/blop/delete supprimait n'importe quel fichier sans contrôle ;
  // /api/timestamp et /rooms n'avaient plus d'usage.
  for (const path of ['/api/blop/delete', '/api/timestamp', '/rooms']) {
    const res = await request.get(path)
    expect(res.status(), path).toBe(404)
  }
})

test('security headers are present', async ({ request }) => {
  const res = await request.get('/')
  const headers = res.headers()
  expect(headers['content-security-policy']).toContain("default-src 'self'")
  expect(headers['x-frame-options']).toBe('DENY')
  expect(headers['x-content-type-options']).toBe('nosniff')
})

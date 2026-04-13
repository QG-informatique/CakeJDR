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

test('legacy blob delete route returns explicit status contract', async ({ request }) => {
  const res = await request.get('/api/blop/delete')
  expect(res.status()).toBe(405)
  const body = await res.json()
  expect(body.ok).toBe(false)
  expect(typeof body.error).toBe('string')
})

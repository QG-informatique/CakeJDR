export const runtime = 'nodejs'

import { randomUUID } from 'crypto'
import { NextRequest } from 'next/server'
import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { creations } from '@/lib/db/schema'
import { isCreationKind, parseCreation, readCreation } from '@/lib/db/creations'
import { currentUserId, syncCurrentUser } from '@/lib/db/users'
import { rateLimit } from '@/lib/rateLimit'
import { fail, ok } from '@/lib/api-response'

/**
 * Créations d'un MJ, faites dans l'atelier (`/atelier`) : systèmes de jeu et
 * campagnes. Chacun ne voit, n'écrit et ne supprime que les siennes ; une
 * création partagée se lit aussi par son lien, pour en faire une copie.
 * Tout ce qui arrive est remis en forme (`lib/customSystem.ts`,
 * `lib/autoGm/custom.ts`) avant d'être rangé.
 */

const MAX_BYTES = 512 * 1024
const MAX_PER_KIND = 30
const SAFE_ID = /^[\w-]{1,60}$/
const WRITE_LIMIT = 60
const WRITE_WINDOW_MS = 10 * 60 * 1000

export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams
  const kind = params.get('kind')
  if (!isCreationKind(kind)) return fail('invalid kind', 400)
  const id = params.get('id')

  // Une seule création : la sienne, ou une création partagée (lien de partage).
  if (id !== null) {
    if (!SAFE_ID.test(id)) return fail('invalid id', 400)
    const accountId = await currentUserId().catch(() => null)
    const row = await readCreation(id, kind, accountId)
    if (!row) return fail('not found', 404)
    return ok({
      creation: { id: row.id, kind: row.kind, name: row.name, data: row.data, shared: row.shared, mine: row.ownerId === accountId },
    })
  }

  const account = await syncCurrentUser().catch(() => null)
  if (!account) return fail('sign in to see your creations', 401)
  const rows = await db
    .select({ id: creations.id, name: creations.name, data: creations.data, shared: creations.shared, updatedAt: creations.updatedAt })
    .from(creations)
    .where(and(eq(creations.ownerId, account.id), eq(creations.kind, kind)))
    .orderBy(desc(creations.updatedAt))
  return ok({ creations: rows })
}

export async function PUT(req: NextRequest) {
  const account = await syncCurrentUser().catch(() => null)
  if (!account) return fail('sign in to save', 401)

  const limit = rateLimit(`creations-write:${account.id}`, WRITE_LIMIT, WRITE_WINDOW_MS)
  if (!limit.allowed) {
    const res = fail('too many saves', 429)
    res.headers.set('Retry-After', String(limit.retryAfter))
    return res
  }

  const body = (await req.json().catch(() => null)) as { id?: unknown; kind?: unknown; data?: unknown; shared?: unknown } | null
  if (!body || !isCreationKind(body.kind)) return fail('invalid kind', 400)
  const kind = body.kind
  const data = parseCreation(kind, body.data)
  if (!data) return fail('invalid data', 400)
  if (Buffer.byteLength(JSON.stringify(data), 'utf8') > MAX_BYTES) return fail('too large', 413)
  const name = ('title' in data ? data.title : data.name).slice(0, 120)
  const shared = body.shared === true
  const now = new Date()

  if (body.id !== undefined) {
    const id = typeof body.id === 'string' && SAFE_ID.test(body.id) ? body.id : ''
    if (!id) return fail('invalid id', 400)
    // Seul l'auteur réécrit sa création ; l'identifiant d'un autre est refusé.
    const [row] = await db.select({ ownerId: creations.ownerId }).from(creations).where(eq(creations.id, id)).limit(1)
    if (row && row.ownerId !== account.id) return fail('forbidden', 403)
    if (row) {
      await db.update(creations).set({ name, data, shared, updatedAt: now }).where(and(eq(creations.id, id), eq(creations.ownerId, account.id)))
      return ok({ id, data })
    }
  }

  const [{ n } = { n: 0 }] = await db
    .select({ n: count() })
    .from(creations)
    .where(and(eq(creations.ownerId, account.id), eq(creations.kind, kind)))
  if (n >= MAX_PER_KIND) return fail('creation limit reached', 403)
  const id = randomUUID()
  await db.insert(creations).values({ id, ownerId: account.id, kind, name, data, shared, updatedAt: now })
  return ok({ id, data })
}

export async function DELETE(req: NextRequest) {
  const account = await syncCurrentUser().catch(() => null)
  if (!account) return fail('sign in to delete', 401)

  const id = new URL(req.url).searchParams.get('id') ?? ''
  if (!SAFE_ID.test(id)) return fail('invalid id', 400)

  const deleted = await db
    .delete(creations)
    .where(and(eq(creations.id, id), eq(creations.ownerId, account.id)))
    .returning({ id: creations.id })
  if (deleted.length === 0) return fail('not found', 404)
  return ok({ id })
}

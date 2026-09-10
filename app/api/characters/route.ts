export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { characters } from '@/lib/db/schema'
import { syncCurrentUser } from '@/lib/db/users'
import { rateLimit } from '@/lib/rateLimit'
import { fail, ok } from '@/lib/api-response'

/**
 * Fiches de personnage enregistrées sur le compte du joueur.
 *
 * Elles vivaient dans Vercel Blob, sous un préfixe commun : n'importe qui, même
 * sans compte, listait, importait ou supprimait les fiches de tout le monde.
 * Elles sont désormais en base, et chaque méthode exige une session : on ne
 * voit, n'écrit et ne supprime que ses propres fiches.
 */

/** Une fiche sérialisée n'a aucune raison de dépasser cette taille. */
const MAX_BYTES = 256 * 1024
const SAFE_ID = /^[\w\-.:]{1,120}$/
const WRITE_LIMIT = 60
const WRITE_WINDOW_MS = 10 * 60 * 1000

/**
 * Clé en base : compte + identifiant de la fiche. Deux joueurs qui importent
 * le même fichier de fiche, donc le même identifiant, ne s'écrasent pas.
 */
const rowId = (userId: string, characterId: string) => `${userId}:${characterId}`

export async function GET() {
  const account = await syncCurrentUser().catch(() => null)
  if (!account) return fail('sign in to access your character sheets', 401)

  const rows = await db
    .select({ data: characters.data })
    .from(characters)
    .where(eq(characters.ownerId, account.id))
    .orderBy(desc(characters.updatedAt))

  return ok({ characters: rows.map((r) => r.data) })
}

export async function PUT(req: NextRequest) {
  const account = await syncCurrentUser().catch(() => null)
  if (!account) return fail('sign in to save a character sheet', 401)

  const limit = rateLimit(`characters-write:${account.id}`, WRITE_LIMIT, WRITE_WINDOW_MS)
  if (!limit.allowed) {
    const res = fail('too many saves', 429)
    res.headers.set('Retry-After', String(limit.retryAfter))
    return res
  }

  const body = (await req.json().catch(() => null)) as { character?: unknown } | null
  const character = body?.character
  if (!character || typeof character !== 'object' || Array.isArray(character)) {
    return fail('missing character', 400)
  }

  const c = character as Record<string, unknown>
  const id = typeof c.id === 'string' ? c.id : ''
  if (!SAFE_ID.test(id)) return fail('invalid character id', 400)

  // Le propriétaire est celui du compte, jamais celui qu'annonce le client.
  const data = { ...c, owner: account.pseudo }
  if (Buffer.byteLength(JSON.stringify(data), 'utf8') > MAX_BYTES) {
    return fail('character sheet too large', 413)
  }
  const name = typeof c.nom === 'string' ? c.nom.slice(0, 120) : ''
  const now = new Date()

  await db
    .insert(characters)
    .values({ id: rowId(account.id, id), ownerId: account.id, name, data, updatedAt: now })
    .onConflictDoUpdate({ target: characters.id, set: { name, data, updatedAt: now } })

  return ok({ id })
}

export async function DELETE(req: NextRequest) {
  const account = await syncCurrentUser().catch(() => null)
  if (!account) return fail('sign in to delete a character sheet', 401)

  const id = new URL(req.url).searchParams.get('id') ?? ''
  if (!SAFE_ID.test(id)) return fail('invalid character id', 400)

  const deleted = await db
    .delete(characters)
    .where(and(eq(characters.id, rowId(account.id, id)), eq(characters.ownerId, account.id)))
    .returning({ id: characters.id })

  if (deleted.length === 0) return fail('character sheet not found', 404)
  return ok({ id })
}

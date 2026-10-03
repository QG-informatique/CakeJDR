export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import { LiveMap as LiveMapValue, type LiveMap as LiveMapType } from '@liveblocks/client'
import { verifyRoomToken } from '@/lib/roomAuth'
import { debug } from '@/lib/debug'
import type { Character } from '@/types/character'
import { fail, ok } from '@/lib/api-response'

/**
 * Fiches de personnage stockées dans le Storage Liveblocks d'une room.
 *
 * Chaque méthode exige un jeton d'accès à la room, obtenu via
 * `/api/rooms/verify`. Sans lui, cette route laissait n'importe qui lire,
 * écraser ou supprimer les fiches de n'importe quelle room.
 */

/** Regex permissive pour valider owner/id : alphanum, tirets, underscores, points, espaces limités. */
const SAFE_ID = /^[\w\-.@: ]{1,120}$/

/** Garde-fou de taille : une fiche de personnage n'a aucune raison d'être énorme. */
const MAX_CHARACTER_BYTES = 256 * 1024

type Guard = { ok: true; secret: string } | { ok: false; response: Response }

/**
 * Vérifie le jeton d'accès porté par les en-têtes de la requête.
 * Le client l'obtient auprès de `/api/rooms/verify` et le conserve en
 * sessionStorage pour la durée de sa visite.
 */
function guardRoom(req: NextRequest, roomId: string): Guard {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) return { ok: false, response: fail('Liveblocks key missing', 500) }

  const token = req.headers.get('x-room-token')
  const ts = req.headers.get('x-room-token-ts')

  if (!verifyRoomToken(roomId, token, ts, secret)) {
    return {
      ok: false,
      response: fail('forbidden: missing or expired room access token', 403),
    }
  }
  return { ok: true, secret }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  if (!roomId) return fail('roomId missing', 400)

  const guard = guardRoom(req, roomId)
  if (!guard.ok) return guard.response

  const client = new Liveblocks({ secret: guard.secret })
  const doc = await client.getStorageDocument(roomId, 'json').catch(() => null)
  const data = doc as { characters?: Record<string, Character> } | null
  debug('roomstorage get', roomId)
  return ok({ characters: data?.characters || {} })
}

export async function POST(req: NextRequest) {
  try {
    const { roomId, id, owner, character } = (await req.json()) as {
      roomId?: string
      id?: string
      owner?: string
      character?: Character
    }
    if (!roomId || !id || !owner || !character) {
      return fail('missing data', 400)
    }

    const guard = guardRoom(req, roomId)
    if (!guard.ok) return guard.response

    if (!SAFE_ID.test(String(id)) || !SAFE_ID.test(String(owner))) {
      return fail('invalid id or owner format', 400)
    }
    if (String(character.id) !== String(id) || String(character.owner) !== String(owner)) {
      return fail('id/owner mismatch between params and character data', 400)
    }
    if (Buffer.byteLength(JSON.stringify(character), 'utf8') > MAX_CHARACTER_BYTES) {
      return fail('character sheet too large', 413)
    }

    const client = new Liveblocks({ secret: guard.secret })
    await client.mutateStorage(roomId, ({ root }) => {
      let map = root.get('characters') as LiveMapType<string, Character> | undefined
      if (!map) {
        root.set('characters', new LiveMapValue<string, Character>())
        map = root.get('characters') as LiveMapType<string, Character>
      }
      map.set(`${owner}:${id}`, character)
    })
    debug('roomstorage upsert', roomId, id)
    return ok()
  } catch {
    return fail('update failed', 500)
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const id = searchParams.get('id')
  const owner = searchParams.get('owner')
  if (!roomId || !id || !owner) {
    return fail('missing data', 400)
  }

  const guard = guardRoom(req, roomId)
  if (!guard.ok) return guard.response

  const client = new Liveblocks({ secret: guard.secret })
  try {
    await client.mutateStorage(roomId, ({ root }) => {
      const map = root.get('characters') as LiveMapType<string, Character> | undefined
      if (map) map.delete(`${owner}:${id}`)
    })
    debug('roomstorage delete', roomId, id)
    return ok()
  } catch {
    return fail('delete failed', 500)
  }
}

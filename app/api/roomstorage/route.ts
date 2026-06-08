export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import type { LiveMap as LiveMapType } from '@liveblocks/core'
import { LiveMap as LiveMapValue } from '@liveblocks/client' // FIX: use ESM import instead of require
import { debug } from '@/lib/debug'
import type { Character } from '@/types/character'
import { fail, ok } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  if (!roomId) return fail('roomId missing', 400)
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) return fail('Liveblocks key missing', 500)
  const client = new Liveblocks({ secret })
  const doc = await client.getStorageDocument(roomId, 'json').catch(() => null)
  const data = doc as { characters?: Record<string, Character> } | null
  debug('roomstorage get', roomId)
  return ok({ characters: data?.characters || {} })
}

/** Regex permissive pour valider owner/id : alphanum, tirets, underscores, points, espaces limités. */
const SAFE_ID = /^[\w\-.@: ]{1,120}$/

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
    // Validation basique d'ownership : les champs déclarés doivent correspondre
    // à ce qui est dans l'objet character, et respecter un format sûr.
    if (!SAFE_ID.test(String(id)) || !SAFE_ID.test(String(owner))) {
      return fail('invalid id or owner format', 400)
    }
    if (String(character.id) !== String(id) || String(character.owner) !== String(owner)) {
      return fail('id/owner mismatch between params and character data', 400)
    }
    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) return fail('Liveblocks key missing', 500)
    const client = new Liveblocks({ secret })
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
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) return fail('Liveblocks key missing', 500)
  const client = new Liveblocks({ secret })
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

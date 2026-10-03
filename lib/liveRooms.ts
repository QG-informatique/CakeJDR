import { Liveblocks } from '@liveblocks/node'
import { randomBytes } from 'crypto'

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const SAFE_METADATA_KEY = /^[a-zA-Z0-9:_-]{1,64}$/
const BLOCKED_METADATA_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

function isSafeMetadataKey(key: string) {
  return SAFE_METADATA_KEY.test(key) && !BLOCKED_METADATA_KEYS.has(key)
}

function getClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) throw new Error('Liveblocks key missing')
  return new Liveblocks({ secret })
}

export type RoomSummary = {
  id: string
  name: string
  createdAt: string
  updatedAt?: string
  usersConnected: number
}

export async function listRooms(): Promise<RoomSummary[]> {
  const client = getClient()
  const rooms: RoomSummary[] = []
  let cursor: string | undefined
  do {
    const { data, nextCursor } = await client.getRooms({ startingAfter: cursor, limit: 50 })
    for (const r of data) {
      if (r.id === 'rooms-index' || r.metadata?.name === 'rooms-index') continue
      const count = (r as { usersCount?: number }).usersCount
      const roomName =
        typeof r.metadata?.name === 'string' && r.metadata.name
          ? r.metadata.name
          : r.id.includes('-')
            ? r.id.substring(0, r.id.lastIndexOf('-'))
            : r.id
      const meta = (r.metadata ?? {}) as Record<string, unknown>
      rooms.push({
        id: r.id,
        name: roomName,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.lastConnectionAt ? r.lastConnectionAt.toISOString() : undefined,
        usersConnected: typeof count === 'number' ? count : 0
      })
    }
    cursor = nextCursor ?? undefined
  } while (cursor)
  return rooms
}

/**
 * Crée la table chez Liveblocks. L'identifiant reprend le nom pour rester
 * lisible dans l'adresse, suivi d'un suffixe aléatoire : deux MJ peuvent donc
 * donner le même nom à leur table. La propriété est portée par la base
 * (`recordRoom`), pas par Liveblocks.
 */
export async function createRoom(name: string) {
  const client = getClient()
  const id = `${slugify(name).slice(0, 40) || 'table'}-${randomBytes(4).toString('hex')}`
  const room = await client.createRoom(id, {
    defaultAccesses: ['room:write'],
    metadata: { name },
  })
  return { id: room.id }
}

export async function deleteRoom(id: string) {
  const client = getClient()
  await client.deleteRoom(id)
}

export async function renameRoom(id: string, name: string) {
  const client = getClient()
  const room = await client.getRoom(id)
  const entries: Array<[string, string | string[]]> = []
  if (typeof room.metadata === 'object' && room.metadata !== null) {
    for (const [k, v] of Object.entries(room.metadata as Record<string, unknown>)) {
      if (!isSafeMetadataKey(k)) continue
      if (typeof v === 'string') entries.push([k, v])
      else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
        entries.push([k, v as string[]])
      }
    }
  }
  const metadata = Object.fromEntries(entries) as Record<string, string | string[]>
  await client.updateRoom(id, { metadata: { ...metadata, name } })
}

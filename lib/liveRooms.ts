import { Liveblocks } from '@liveblocks/node'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { hashRoomPassword, roomHasPassword } from './roomAuth'

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

/**
 * Preuve de propriété d'une room.
 *
 * À la création, le serveur tire un secret aléatoire, en stocke le hash dans
 * les metadata et renvoie le secret en clair une seule fois au créateur, qui
 * le conserve localement. Toute mutation ultérieure (suppression, renommage)
 * exige soit ce secret, soit une session admin.
 *
 * Ce n'est pas un système de comptes : c'est une capacité porteuse (bearer
 * token) liée au navigateur du créateur. Suffisant pour empêcher un tiers de
 * supprimer la room d'autrui, insuffisant pour de vraies invitations — ça
 * viendra avec l'identité serveur.
 */
const hashOwnerSecret = (secret: string) =>
  createHash('sha256').update(secret).digest('hex')

function safeEqualHex(a: string, b: string) {
  const bufA = Buffer.from(a, 'hex')
  const bufB = Buffer.from(b, 'hex')
  if (bufA.length === 0 || bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function getClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) throw new Error('Liveblocks key missing')
  return new Liveblocks({ secret })
}

export type RoomSummary = {
  id: string
  name: string
  // FIX: Do not expose raw passwords; only expose a boolean flag
  hasPassword?: boolean
  /** True si la room a un propriétaire enregistré (rooms créées avant cette version : false). */
  hasOwner?: boolean
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
      // On n'expose qu'un booléen, jamais la valeur (hash ou clair).
      const hasPassword = roomHasPassword(meta)
      rooms.push({
        id: r.id,
        name: roomName,
        hasPassword,
        hasOwner: typeof meta.ownerHash === 'string' && meta.ownerHash.length > 0,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.lastConnectionAt ? r.lastConnectionAt.toISOString() : undefined,
        usersConnected: typeof count === 'number' ? count : 0
      })
    }
    cursor = nextCursor ?? undefined
  } while (cursor)
  return rooms
}

export async function createRoom(name: string, password?: string) {
  const client = getClient()

  // 1) Si une room avec ce nom existe déjà, refuser la création
  let cursor: string | undefined
  do {
    const { data, nextCursor } = await client.getRooms({ startingAfter: cursor, limit: 50 })
    for (const r of data) {
      const metaName = typeof r.metadata?.name === 'string' ? r.metadata.name : undefined
      if (metaName && metaName.trim().toLowerCase() === name.trim().toLowerCase()) {
        throw new Error('name_exists')
      }
    }
    cursor = nextCursor ?? undefined
  } while (cursor)

  // 2) ID stable pour résister aux doubles soumissions simultanées (sans changer ton format global)
  const base = slugify(name)
  const stableId = `${base}-${Buffer.from(name).toString('hex').slice(0, 8)}`

  // 3) Idempotence côté serveur
  // FIX: only keep a password hash in metadata
  const metadata: Record<string, string | string[]> = { name }
  if (password) {
    metadata.passwordHash = hashRoomPassword(password)
    metadata.hasPassword = '1'
  }

  // 4) Secret de propriété : renvoyé une seule fois, seul son hash est stocké
  const ownerSecret = randomBytes(24).toString('hex')
  metadata.ownerHash = hashOwnerSecret(ownerSecret)

  const room = await client.getOrCreateRoom(stableId, {
    defaultAccesses: ['room:write'],
    metadata,
  })

  return { id: room.id, ownerSecret }
}

/** True si `secret` correspond au propriétaire enregistré de la room. */
export async function verifyRoomOwner(id: string, secret: string | null | undefined) {
  if (!secret) return false
  const client = getClient()
  const room = await client.getRoom(id).catch(() => null)
  if (!room) return false
  const meta = (room.metadata ?? {}) as Record<string, unknown>
  const stored = typeof meta.ownerHash === 'string' ? meta.ownerHash : null
  if (!stored) return false
  return safeEqualHex(hashOwnerSecret(secret), stored)
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

/** Retire le mot de passe d'une room (action admin). */
export async function clearRoomPassword(id: string) {
  const client = getClient()
  const room = await client.getRoom(id)
  const entries: Array<[string, string | string[] | null]> = []
  if (typeof room.metadata === 'object' && room.metadata !== null) {
    for (const [k, v] of Object.entries(room.metadata as Record<string, unknown>)) {
      if (!isSafeMetadataKey(k)) continue
      if (k === 'password' || k === 'passwordHash' || k === 'hasPassword') continue
      if (typeof v === 'string') entries.push([k, v])
      else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
        entries.push([k, v as string[]])
      }
    }
  }
  // `null` demande explicitement à Liveblocks de supprimer la clé.
  entries.push(['password', null], ['passwordHash', null], ['hasPassword', null])
  await client.updateRoom(id, {
    metadata: Object.fromEntries(entries) as Record<string, string | string[] | null>,
  })
}

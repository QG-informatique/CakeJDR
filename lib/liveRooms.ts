import { Liveblocks } from '@liveblocks/node'

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function listRooms() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) throw new Error('Liveblocks key missing')
  const client = new Liveblocks({ secret })
  const rooms: Array<{
    id: string
    name: string
    // FIX: Do not expose raw passwords; only expose a boolean flag
    hasPassword?: boolean
    createdAt: string
    updatedAt?: string
    usersConnected: number
  }> = []
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
      // FIX: compute boolean without leaking value
      const hasPassword =
        typeof meta.password === 'string' && meta.password.length > 0
          ? true
          : typeof meta.passwordHash === 'string' && meta.passwordHash.length > 0
            ? true
            : meta.hasPassword === true
      rooms.push({
        id: r.id,
        name: roomName,
        hasPassword,
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
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) throw new Error('Liveblocks key missing')
  const client = new Liveblocks({ secret })

  // 1) Si une room avec ce nom existe déjà (metadata.name), renvoyer son id
  let cursor: string | undefined
  do {
    const { data, nextCursor } = await client.getRooms({ startingAfter: cursor, limit: 50 })
    for (const r of data) {
      const metaName = typeof r.metadata?.name === 'string' ? r.metadata.name : undefined
      if (metaName && metaName.trim().toLowerCase() === name.trim().toLowerCase()) {
        return r.id
      }
    }
    cursor = nextCursor ?? undefined
  } while (cursor)

  // 2) ID stable pour résister aux doubles soumissions simultanées (sans changer ton format global)
  const base = slugify(name)
  const stableId = `${base}-${Buffer.from(name).toString('hex').slice(0, 8)}`

  // 3) Idempotence côté serveur
  // FIX: mark hasPassword in metadata, but never expose raw password via listRooms
  const room = await client.getOrCreateRoom(stableId, {
    defaultAccesses: ['room:write'],
    metadata: { name, ...(password ? { password, hasPassword: true } : {}) }, // FIX: hasPassword flag
  })

  return room.id
}

export async function deleteRoom(id: string) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) throw new Error('Liveblocks key missing')
  const client = new Liveblocks({ secret })
  await client.deleteRoom(id)
}

export async function renameRoom(id: string, name: string) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) throw new Error('Liveblocks key missing')
  const client = new Liveblocks({ secret })
  const room = await client.getRoom(id)
  const metadata = typeof room.metadata === 'object' && room.metadata !== null ? room.metadata : {}
  await client.updateRoom(id, { metadata: { ...metadata, name } })
}

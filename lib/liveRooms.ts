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
    password?: string
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
          : r.id.split('-')[0]
      rooms.push({
        id: r.id,
        name: roomName,
        password: typeof r.metadata?.password === 'string' ? r.metadata.password : undefined,
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
  const existing = new Set<string>()
  let cursor: string | undefined
  do {
    const { data, nextCursor } = await client.getRooms({ startingAfter: cursor, limit: 50 })
    for (const r of data) {
      if (typeof r.metadata?.name === 'string') existing.add(r.metadata.name)
    }
    cursor = nextCursor ?? undefined
  } while (cursor)
  if (existing.has(name)) throw new Error('name_exists')
  const id = `${slugify(name)}-${Date.now()}`
  await client.createRoom(id, {
    defaultAccesses: ['room:write'],
    metadata: { name, ...(password ? { password } : {}) }
  })
  return id
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
  await client.updateRoom(id, { metadata: { name } })
}

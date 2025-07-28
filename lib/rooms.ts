import { promises as fs } from 'fs'
import path from 'path'
import { Liveblocks } from '@liveblocks/node'

const FILE_PATH = path.resolve(process.cwd(), 'rooms.json')
const ROOMS_ID = 'rooms-index'
const secret = process.env.LIVEBLOCKS_SECRET_KEY

export interface Room {
  id: string
  name: string
  password?: string
  owner?: string
  emptySince?: number | null
}

const CACHE_TTL = 60000
let cached: { rooms: Room[]; ts: number } | null = null

export async function readRooms(): Promise<Room[]> {
  const now = Date.now()
  if (cached && now - cached.ts < CACHE_TTL) return cached.rooms
  try {
    const txt = await fs.readFile(FILE_PATH, 'utf8')
    const data = JSON.parse(txt)
    if (Array.isArray(data)) {
      cached = { rooms: data, ts: Date.now() }
      return data
    }
    return []
  } catch {
    // ignore
  }

  if (secret) {
    try {
      const client = new Liveblocks({ secret })
      const doc = (await client.getStorageDocument(ROOMS_ID, 'json').catch(() => null)) as { rooms?: Room[] } | null
      const rooms = Array.isArray(doc?.rooms) ? doc!.rooms : []
      cached = { rooms, ts: Date.now() }
      return rooms
    } catch {
      /* ignore */
    }
  }
  return []
}

export async function saveRooms(rooms: Room[]) {
  await fs.writeFile(FILE_PATH, JSON.stringify(rooms, null, 2), 'utf8')
  cached = { rooms, ts: Date.now() }
  if (secret) {
    try {
      const client = new Liveblocks({ secret })
      await client
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .initializeStorageDocument(ROOMS_ID, { rooms } as any)
        .catch(async () => {
          await client.mutateStorage(ROOMS_ID, ({ root }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ;(root as any).set('rooms', rooms as any)
          })
        })
    } catch {
      /* ignore */
    }
  }
}

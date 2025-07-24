import { put, list } from '@vercel/blob'

const FILE = 'rooms.json'

export interface Room {
  id: string
  name: string
  password?: string
  emptySince?: number | null
}

const CACHE_TTL = 60000
let cached: { rooms: Room[]; ts: number } | null = null

export async function readRooms(): Promise<Room[]> {
  const now = Date.now()
  if (cached && now - cached.ts < CACHE_TTL) return cached.rooms

  const { blobs } = await list({ prefix: FILE })
  if (blobs.length === 0) return []
  const url = blobs[0].downloadUrl || blobs[0].url
  const res = await fetch(url)
  const data = await res.json().catch(() => [])
  if (!Array.isArray(data)) return []
  const valid = data.filter((r: Room) => !(r.emptySince && now - r.emptySince > 120000))
  if (valid.length !== data.length) {
    await put(FILE, JSON.stringify(valid), { access: 'public', addRandomSuffix: false, allowOverwrite: true })
  }
  cached = { rooms: valid, ts: Date.now() }
  return valid
}

export function updateRoomsCache(rooms: Room[]) {
  cached = { rooms, ts: Date.now() }
}

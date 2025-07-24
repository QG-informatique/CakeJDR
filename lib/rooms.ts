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
let roomsUrl: string | null = null

export async function readRooms(): Promise<Room[]> {
  const now = Date.now()
  if (cached && now - cached.ts < CACHE_TTL) return cached.rooms
  if (!roomsUrl) {
    const { blobs } = await list({ prefix: FILE })
    if (blobs.length === 0) return []
    roomsUrl = blobs[0].downloadUrl || blobs[0].url
  }
  const res = await fetch(roomsUrl)
  const data = await res.json().catch(() => [])
  if (!Array.isArray(data)) return []
  const valid = data.filter((r: Room) => !(r.emptySince && now - r.emptySince > 120000))
  if (valid.length !== data.length) {
    const uploaded = await put(FILE, JSON.stringify(valid), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    })
    roomsUrl = uploaded.downloadUrl || uploaded.url
  }
  cached = { rooms: valid, ts: Date.now() }
  return valid
}

export function updateRoomsCache(rooms: Room[], url?: string) {
  cached = { rooms, ts: Date.now() }
  if (url) roomsUrl = url
}

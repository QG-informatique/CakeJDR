import { list } from '@vercel/blob'

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
  cached = { rooms: data, ts: Date.now() }
  return data
}

export function updateRoomsCache(rooms: Room[], url?: string) {
  cached = { rooms, ts: Date.now() }
  if (url) roomsUrl = url
}

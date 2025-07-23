import { put, list } from '@vercel/blob'

const FILE = 'rooms.json'

export interface Room {
  id: string
  name: string
  password?: string
  emptySince?: number | null
}

export async function readRooms(): Promise<Room[]> {
  const { blobs } = await list({ prefix: FILE })
  if (blobs.length === 0) return []
  const url = blobs[0].downloadUrl || blobs[0].url
  const res = await fetch(url)
  const data = await res.json().catch(() => [])
  if (!Array.isArray(data)) return []
  const now = Date.now()
  const valid = data.filter((r: Room) => !(r.emptySince && now - r.emptySince > 120000))
  if (valid.length !== data.length) {
    await put(FILE, JSON.stringify(valid), { access: 'public', addRandomSuffix: false, allowOverwrite: true })
  }
  return valid
}

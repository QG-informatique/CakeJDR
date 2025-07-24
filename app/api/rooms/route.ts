import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { readRooms, updateRoomsCache } from '@/lib/rooms'

const FILE = 'rooms.json'

export async function GET() {
  try {
    const rooms = await readRooms();
    return NextResponse.json({ rooms });
  } catch {
    return NextResponse.json({ error: "Failed to list rooms" }, { status: 500 });
  }
}
export async function POST(req: Request) {
  try {
    const { name, password } = await req.json()
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
  const rooms = await readRooms()
  rooms.push({ id, name, password, emptySince: null })
  const blob = await put(FILE, JSON.stringify(rooms), {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
  })
  updateRoomsCache(rooms, blob.downloadUrl || blob.url)
  return NextResponse.json({ id })
  } catch {
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, empty } = await req.json()
    const rooms = await readRooms()
    const idx = rooms.findIndex((r) => r.id === id)
    if (idx !== -1) {
      rooms[idx].emptySince = empty ? Date.now() : null
      const blob = await put(FILE, JSON.stringify(rooms), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
      })
      updateRoomsCache(rooms, blob.downloadUrl || blob.url)
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { readRooms, saveRooms } from '@/lib/rooms'


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
    const { name, password, owner } = await req.json()
    const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
    const rooms = await readRooms()
    rooms.push({ id, name, password, owner })
    await saveRooms(rooms)
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
      await saveRooms(rooms)
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
    const rooms = await readRooms()
    const idx = rooms.findIndex(r => r.id === id)
    if (idx !== -1) {
      rooms.splice(idx, 1)
      await saveRooms(rooms)
    }
    try {
      await fs.unlink(path.resolve(process.cwd(), 'RoomData', `${id}.json`))
    } catch {
      /* ignore */
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}

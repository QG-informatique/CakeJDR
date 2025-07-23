/* eslint-disable @typescript-eslint/no-explicit-any */
import { put, list } from '@vercel/blob'
import { NextResponse } from 'next/server'

const FILE = 'rooms.json'

async function readRooms(): Promise<any[]> {
  const { blobs } = await list({ prefix: FILE })
  if (blobs.length === 0) return []
  const url = blobs[0].downloadUrl || blobs[0].url
  const res = await fetch(url)
  const data = await res.json().catch(() => [])
  if (!Array.isArray(data)) return []
  const now = Date.now()
  // On conserve les salles pendant 2 minutes après le départ du dernier joueur
  const valid = data.filter((r: any) => !(r.emptySince && now - r.emptySince > 120000))
  if (valid.length !== data.length) {
    await put(FILE, JSON.stringify(valid), { access: 'public', addRandomSuffix: false, allowOverwrite: true })
  }
  return valid
}

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
    await put(FILE, JSON.stringify(rooms), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    })
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
      await put(FILE, JSON.stringify(rooms), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
      })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

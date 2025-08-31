export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { listRooms, createRoom, deleteRoom, renameRoom } from '@/lib/liveRooms'
import { debug } from '@/lib/debug'

export async function GET() {
  try {
    const rooms = await listRooms()
    debug('rooms list', rooms.length)
    return NextResponse.json({ rooms })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, password } = await req.json()
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'missing name' }, { status: 400 })
    }
    const id = await createRoom(name, typeof password === 'string' ? password : undefined)
    debug('room created', name, id)
    return NextResponse.json({ id })
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'name_exists') {
      return NextResponse.json({ error: 'name already used' }, { status: 400 })
    }
    if (msg === 'Liveblocks key missing') {
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'missing id' }, { status: 400 })
    }
    await deleteRoom(id)
    debug('room deleted', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'Liveblocks key missing') {
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name } = await req.json()
    if (!id || typeof id !== 'string' || !name || typeof name !== 'string') {
      return NextResponse.json({ error: 'missing data' }, { status: 400 })
    }
    await renameRoom(id, name)
    debug('room renamed', id, name)
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'Liveblocks key missing') {
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Failed to rename room' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { listRooms, createRoom, deleteRoom, renameRoom } from '@/lib/liveRooms'
import { z } from 'zod'

export async function GET() {
  try {
    const rooms = await listRooms()
    const roomSchema = z.object({
      id: z.string(),
      name: z.string(),
      password: z.string().optional(),
      createdAt: z.string(),
      updatedAt: z.string().optional(),
      usersConnected: z.number(),
    })
    const parsed = z.array(roomSchema).safeParse(rooms)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid room data' }, { status: 500 })
    }
    return NextResponse.json({ rooms: parsed.data })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const schema = z.object({
      name: z.string().min(1),
      password: z.string().optional(),
    })
    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { name, password } = parsed.data
    const id = await createRoom(name, password)
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
    const schema = z.object({ id: z.string().min(1) })
    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { id } = parsed.data
    await deleteRoom(id)
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
    const schema = z.object({ id: z.string().min(1), name: z.string().min(1) })
    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }
    const { id, name } = parsed.data
    await renameRoom(id, name)
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

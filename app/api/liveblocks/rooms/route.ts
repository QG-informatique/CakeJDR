import { NextRequest, NextResponse } from 'next/server'
import { Liveblocks } from '@liveblocks/node'

function getClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) throw new Error('Liveblocks key missing')
  return new Liveblocks({ secret })
}

export async function GET() {
  try {
    const client = getClient()
    const rooms: Array<{ id: string; createdAt: string; metadata: unknown }> = []
    for await (const room of client.iterRooms({}, { pageSize: 50 })) {
      rooms.push({ id: room.id, createdAt: room.createdAt.toISOString(), metadata: room.metadata })
    }
    return NextResponse.json({ rooms })
  } catch {
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
    const client = getClient()
    await client.deleteRoom(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}

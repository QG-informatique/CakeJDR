import { NextResponse } from 'next/server'
import { listRooms } from '@/lib/liveRooms'
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

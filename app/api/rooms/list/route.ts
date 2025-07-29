import { NextResponse } from 'next/server'
import { listRooms } from '@/lib/liveRooms'

export async function GET() {
  try {
    const rooms = await listRooms()
    return NextResponse.json({ rooms })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to list rooms' }, { status: 500 })
  }
}

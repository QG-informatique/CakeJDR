export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { listRooms } from '@/lib/liveRooms'
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

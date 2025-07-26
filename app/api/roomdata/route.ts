import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  if (!roomId) return NextResponse.json({ error: 'roomId missing' }, { status: 400 })
  try {
    const { blobs } = await list({ prefix: `RoomData/${roomId}.json` })
    if (blobs.length === 0) return NextResponse.json({ data: null })
    const url = blobs[0].downloadUrl || blobs[0].url
    const res = await fetch(url)
    const data = await res.json().catch(() => null)
    return NextResponse.json({ data })
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}

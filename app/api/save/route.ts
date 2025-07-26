import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { Liveblocks } from '@liveblocks/node'

export async function POST(req: NextRequest) {
  try {
    const { roomId, chatHistory = '[]', diceHistory = '[]', summary = '[]', events = '[]' } = await req.json()
    if (!roomId) {
      return NextResponse.json({ error: 'roomId missing' }, { status: 400 })
    }
    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ error: 'Liveblocks key missing' }, { status: 500 })
    }
    const client = new Liveblocks({ secret })
    const storage = await client.getStorageDocument(roomId, 'json').catch(() => null)
    const storageData = storage as Record<string, unknown> | null
    const characters = storageData && storageData.characters ? storageData.characters : {}
    const data = {
      characters,
      chat: JSON.parse(chatHistory),
      dice: JSON.parse(diceHistory),
      summary: JSON.parse(summary),
      events: JSON.parse(events)
    }
    const blob = await put(`RoomData/${roomId}.json`, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true
    })
    return NextResponse.json({ url: blob.url || blob.downloadUrl })
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 })
  }
}

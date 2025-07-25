import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { Liveblocks } from '@liveblocks/node'

export async function POST(req: NextRequest) {
  try {
    const { roomId, chatHistory = '' } = await req.json()
    if (!roomId) {
      return NextResponse.json({ error: 'roomId missing' }, { status: 400 })
    }
    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) {
      return NextResponse.json({ error: 'Liveblocks key missing' }, { status: 500 })
    }
    const client = new Liveblocks({ secret })
    const storage = await client.getStorageDocument(roomId, 'json').catch(() => null)
    const data = storage as Record<string, unknown> | null
    const characters = data && data.characters ? data.characters : {}
    const ts = Date.now()
    const charPath = `FichesSauvegardes/${roomId}-${ts}.json`
    const chatPath = `HistoriqueChat/${roomId}-${ts}.txt`
    const [charBlob, chatBlob] = await Promise.all([
      put(charPath, JSON.stringify(characters), { access: 'public' }),
      put(chatPath, chatHistory, { access: 'public' })
    ])
    return NextResponse.json({
      characters: charBlob.url || charBlob.downloadUrl,
      chat: chatBlob.url || chatBlob.downloadUrl,
    })
  } catch {
    return NextResponse.json({ error: 'save failed' }, { status: 500 })
  }
}

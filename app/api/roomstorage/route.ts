export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import type { LiveMap, Lson } from '@liveblocks/core'
import { debug } from '@/lib/debug'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  if (!roomId) return NextResponse.json({ error: 'roomId missing' }, { status: 400 })
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Liveblocks key missing' }, { status: 500 })
  const client = new Liveblocks({ secret })
  const doc = await client.getStorageDocument(roomId, 'json').catch(() => null)
  const data = doc as { characters?: Record<string, unknown> } | null
  debug('roomstorage get', roomId)
  return NextResponse.json({ characters: data?.characters || {} })
}

export async function POST(req: NextRequest) {
  try {
    const { roomId, id, owner, character } = await req.json()
    if (!roomId || !id || !owner || !character) {
      return NextResponse.json({ error: 'missing data' }, { status: 400 })
    }
    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Liveblocks key missing' }, { status: 500 })
    const client = new Liveblocks({ secret })
    await client.mutateStorage(roomId, ({ root }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (root as any).get('characters') as LiveMap<string, Lson>
      map.set(`${owner}:${id}`, character as Lson)
    })
    debug('roomstorage upsert', roomId, id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'update failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const id = searchParams.get('id')
  const owner = searchParams.get('owner')
  if (!roomId || !id || !owner) {
    return NextResponse.json({ error: 'missing data' }, { status: 400 })
  }
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Liveblocks key missing' }, { status: 500 })
  const client = new Liveblocks({ secret })
  try {
    await client.mutateStorage(roomId, ({ root }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (root as any).get('characters') as LiveMap<string, Lson>
      map.delete(`${owner}:${id}`)
    })
    debug('roomstorage delete', roomId, id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }
}

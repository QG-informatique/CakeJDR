export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import type { LiveMap as LiveMapType } from '@liveblocks/core'
import { LiveMap as LiveMapValue } from '@liveblocks/client' // FIX: use ESM import instead of require
import { debug } from '@/lib/debug'
import type { Character } from '@/types/character'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  if (!roomId) return NextResponse.json({ error: 'roomId missing' }, { status: 400 })
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) return NextResponse.json({ error: 'Liveblocks key missing' }, { status: 500 })
  const client = new Liveblocks({ secret })
  const doc = await client.getStorageDocument(roomId, 'json').catch(() => null)
  const data = doc as { characters?: Record<string, Character> } | null
  debug('roomstorage get', roomId)
  return NextResponse.json({ characters: data?.characters || {} })
}

export async function POST(req: NextRequest) {
  try {
    const { roomId, id, owner, character } = (await req.json()) as {
      roomId?: string
      id?: string
      owner?: string
      character?: Character
    }
    if (!roomId || !id || !owner || !character) {
      return NextResponse.json({ error: 'missing data' }, { status: 400 })
    }
    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) return NextResponse.json({ error: 'Liveblocks key missing' }, { status: 500 })
    const client = new Liveblocks({ secret })
    await client.mutateStorage(roomId, ({ root }) => {
      let map = root.get('characters') as LiveMapType<string, Character> | undefined
      if (!map) {
        root.set('characters', new LiveMapValue<string, Character>())
        map = root.get('characters') as LiveMapType<string, Character>
      }
      map.set(`${owner}:${id}`, character)
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
      const map = root.get('characters') as LiveMapType<string, Character> | undefined
      if (map) map.delete(`${owner}:${id}`)
    })
    debug('roomstorage delete', roomId, id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }
}

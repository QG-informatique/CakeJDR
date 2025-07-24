/* eslint-disable @typescript-eslint/no-explicit-any */
import { put, del, list } from '@vercel/blob'
import { NextResponse } from 'next/server'

const CACHE_TTL = 60000
const listCache: Record<string, { ts: number; files: any }> = {}

function invalidate(prefix: string) {
  delete listCache[prefix]
}

// Handler POST (upload)
export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  if (!filename) return NextResponse.json({ error: 'filename missing' }, { status: 400 })

  try {
    const body = request.body as any
    const blob = await put(filename, body, { access: 'public' })
    invalidate(filename.substring(0, filename.lastIndexOf('/') + 1) || '')
    return NextResponse.json(blob)
  } catch {
    return NextResponse.json({ error: 'upload failed' }, { status: 500 })
  }
}

// Handler DELETE (suppression d'un fichier)
export async function DELETE(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  if (!filename) return NextResponse.json({ error: 'filename missing' }, { status: 400 })

  try {
    await del(filename)
    invalidate(filename.substring(0, filename.lastIndexOf('/') + 1) || '')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }
}

// Handler GET (liste tous les fichiers avec un prefix)
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const prefix = searchParams.get('prefix') || 'FichePerso/'
  const cached = listCache[prefix]
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ files: cached.files })
  }
  try {
    const files = await list({ prefix })
    listCache[prefix] = { files, ts: Date.now() }
    return NextResponse.json({ files })
  } catch {
    return NextResponse.json({ error: 'list failed' }, { status: 500 })
  }
}

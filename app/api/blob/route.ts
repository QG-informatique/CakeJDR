export const runtime = 'nodejs'
import { put, del, list } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { debug } from '@/lib/debug'

const CACHE_TTL = 60000
type BlobList = Awaited<ReturnType<typeof list>>
const listCache = new Map<string, { ts: number; files: BlobList }>()

function invalidate(prefix: string) {
  listCache.delete(prefix)
}

// Handler POST (upload)
export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  if (!filename) return NextResponse.json({ error: 'filename missing' }, { status: 400 })

  try {
    const body = request.body
    if (!body) return NextResponse.json({ error: 'missing body' }, { status: 400 })
    const blob = await put(filename, body, { access: 'public' })
    debug('blob upload', filename)
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
    debug('blob delete', filename)
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
  const cached = listCache.get(prefix)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    debug('blob list cache hit', prefix)
    return NextResponse.json({ files: cached.files })
  }
  try {
    const files = await list({ prefix })
    listCache.set(prefix, { files, ts: Date.now() })
    debug('blob list', prefix, files?.blobs?.length)
    return NextResponse.json({ files })
  } catch {
    return NextResponse.json({ error: 'list failed' }, { status: 500 })
  }
}

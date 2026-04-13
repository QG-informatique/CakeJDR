export const runtime = 'nodejs'
import { put, del, list } from '@vercel/blob'
import { debug } from '@/lib/debug'
import { fail, ok } from '@/lib/api-response'

const CACHE_TTL = 60000
type BlobList = Awaited<ReturnType<typeof list>>
const listCache = new Map<string, { ts: number; files: BlobList }>()

function invalidate(prefix: string) {
  listCache.delete(prefix)
}

// Handler POST (upload)
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  if (!filename) return fail('filename missing', 400)

  try {
    const body = request.body
    if (!body) return fail('missing body', 400)
    const blob = await put(filename, body, { access: 'public' })
    debug('blob upload', filename)
    invalidate(filename.substring(0, filename.lastIndexOf('/') + 1) || '')
    return ok({ blob, url: blob.url, pathname: blob.pathname })
  } catch {
    return fail('upload failed', 500)
  }
}

// Handler DELETE (suppression d'un fichier)
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  if (!filename) return fail('filename missing', 400)

  try {
    await del(filename)
    debug('blob delete', filename)
    invalidate(filename.substring(0, filename.lastIndexOf('/') + 1) || '')
    return ok({ success: true })
  } catch {
    return fail('delete failed', 500)
  }
}

// Handler GET (liste tous les fichiers avec un prefix)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const prefix = searchParams.get('prefix') || 'FichePerso/'
  const cached = listCache.get(prefix)
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    debug('blob list cache hit', prefix)
    return ok({ files: cached.files })
  }
  try {
    const files = await list({ prefix })
    listCache.set(prefix, { files, ts: Date.now() })
    debug('blob list', prefix, files?.blobs?.length)
    return ok({ files })
  } catch {
    return fail('list failed', 500)
  }
}

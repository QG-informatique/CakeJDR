export const runtime = 'nodejs'
import { put, del, list } from '@vercel/blob'
import { debug } from '@/lib/debug'
import { fail, ok } from '@/lib/api-response'
// Note : le cache in-memory a été supprimé — en serverless (Vercel), chaque invocation
// peut être un process isolé, donc le Map était systématiquement vide et créait une
// illusion de cache sans bénéfice réel. Pour un vrai cache, utiliser Vercel KV / Redis.

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
    // del() expects a full blob URL, not a pathname — look it up first
    const blobList = await list({ prefix: filename })
    const blob = blobList.blobs.find((b) => b.pathname === filename)
    if (!blob) return fail('file not found', 404)
    await del(blob.url)
    debug('blob delete', filename)
    return ok({ success: true })
  } catch {
    return fail('delete failed', 500)
  }
}

// Handler GET (liste tous les fichiers avec un prefix)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const prefix = searchParams.get('prefix') || 'FichePerso/'
  try {
    const files = await list({ prefix })
    debug('blob list', prefix, files?.blobs?.length)
    return ok({ files })
  } catch {
    return fail('list failed', 500)
  }
}

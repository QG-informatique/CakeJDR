export const runtime = 'nodejs'

import { put, del, list } from '@vercel/blob'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { debug } from '@/lib/debug'
import { fail, ok } from '@/lib/api-response'

/**
 * Fiches de personnage sauvegardées dans Vercel Blob.
 *
 * Cette route n'avait aucune contrainte : n'importe qui pouvait déposer un
 * fichier de n'importe quel nom et de n'importe quelle taille, ou supprimer
 * celui d'un autre. Faute d'identité utilisateur (elle arrive en phase 1), on
 * verrouille ici ce qui peut l'être sans compte : un espace de noms imposé,
 * un type et une taille bornés, et une limite de débit.
 */

/** Tout est confiné sous ce préfixe — rien d'autre n'est acceptable. */
const REQUIRED_PREFIX = 'FichePerso/'

/** Une fiche de personnage sérialisée ne dépasse pas cette taille. */
const MAX_BYTES = 256 * 1024

const WRITE_LIMIT = 30
const WRITE_WINDOW_MS = 10 * 60 * 1000

/**
 * Valide un chemin de blob.
 * Refuse tout ce qui sort du préfixe, remonte l'arborescence, ou n'est pas
 * du JSON — les trois façons de détourner cette route.
 */
function invalidPathname(pathname: string): string | null {
  if (!pathname) return 'filename missing'
  if (!pathname.startsWith(REQUIRED_PREFIX)) {
    return `filename must start with ${REQUIRED_PREFIX}`
  }
  if (!pathname.endsWith('.json')) return 'only .json files are allowed'
  if (pathname.includes('..') || pathname.includes('\\')) {
    return 'invalid characters in filename'
  }
  if (pathname.length > 300) return 'filename too long'
  return null
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename') ?? ''

  const bad = invalidPathname(filename)
  if (bad) return fail(bad, 400)

  const limit = rateLimit(`blob-write:${clientIp(request)}`, WRITE_LIMIT, WRITE_WINDOW_MS)
  if (!limit.allowed) {
    const res = fail('too many uploads', 429)
    res.headers.set('Retry-After', String(limit.retryAfter))
    return res
  }

  try {
    if (!request.body) return fail('missing body', 400)

    // On matérialise le corps pour pouvoir en vérifier la taille et la validité
    // avant d'écrire quoi que ce soit — un flux ne permettrait ni l'un ni l'autre.
    const buffer = Buffer.from(await request.arrayBuffer())
    if (buffer.byteLength === 0) return fail('empty body', 400)
    if (buffer.byteLength > MAX_BYTES) {
      return fail(`file too large (max ${Math.round(MAX_BYTES / 1024)} KB)`, 413)
    }
    try {
      JSON.parse(buffer.toString('utf8'))
    } catch {
      return fail('body must be valid JSON', 400)
    }

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: 'application/json',
    })
    debug('blob upload', filename, buffer.byteLength)
    return ok({ blob, url: blob.url, pathname: blob.pathname })
  } catch {
    return fail('upload failed', 500)
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename') ?? ''

  const bad = invalidPathname(filename)
  if (bad) return fail(bad, 400)

  const limit = rateLimit(`blob-write:${clientIp(request)}`, WRITE_LIMIT, WRITE_WINDOW_MS)
  if (!limit.allowed) {
    const res = fail('too many requests', 429)
    res.headers.set('Retry-After', String(limit.retryAfter))
    return res
  }

  try {
    // del() attend une URL complète, pas un chemin — on la résout d'abord.
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const prefix = searchParams.get('prefix') || REQUIRED_PREFIX

  if (!prefix.startsWith(REQUIRED_PREFIX)) {
    return fail(`prefix must start with ${REQUIRED_PREFIX}`, 400)
  }
  if (prefix.includes('..')) return fail('invalid prefix', 400)

  try {
    const files = await list({ prefix })
    debug('blob list', prefix, files?.blobs?.length)
    return ok({ files })
  } catch {
    return fail('list failed', 500)
  }
}

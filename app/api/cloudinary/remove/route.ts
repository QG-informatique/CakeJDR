export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { syncCurrentUser } from '@/lib/db/users'
import { resolveRoomAccess } from '@/lib/db/roomAccess'
import { roomShowsImage } from '@/lib/liveRooms'
import { deleteCloudinaryImages, removableImageId } from '@/lib/cloudinaryCleanup'

/**
 * Supprime chez Cloudinary une image qu'on vient de retirer du plateau.
 *
 * Garde-fous : compte connecté et accès à la table ; l'image ne doit plus être
 * sur la table (on ne supprime que ce qui vient d'être retiré) ; seules nos
 * images du dossier `cakejdr/` sont visées, jamais celles d'une salle de
 * démonstration. Les adresses Cloudinary sont aléatoires : pour en connaître
 * une, il faut l'avoir vue sur une table, où l'on pouvait déjà la retirer.
 */
const REMOVE_LIMIT = 60
const REMOVE_WINDOW_MS = 10 * 60 * 1000
// Le retrait vient d'être envoyé à Liveblocks : on lui laisse le temps d'arriver.
const RECHECK_DELAY_MS = 1500

function fail(msg: string, code: number) {
  return NextResponse.json({ error: msg }, { status: code })
}

export async function POST(req: NextRequest) {
  const account = await syncCurrentUser().catch(() => null)
  if (!account) return fail('sign in required', 401)

  const limit = rateLimit(`cloudinary-remove:${account.id}:${clientIp(req)}`, REMOVE_LIMIT, REMOVE_WINDOW_MS)
  if (!limit.allowed) {
    const res = fail('too many requests', 429)
    res.headers.set('Retry-After', String(limit.retryAfter))
    return res
  }

  const body = (await req.json().catch(() => ({}))) as { roomId?: unknown; url?: unknown }
  const { roomId, url } = body
  if (typeof roomId !== 'string' || !roomId || typeof url !== 'string' || !url) {
    return fail('missing roomId or url', 400)
  }

  const access = await resolveRoomAccess(roomId, account)
  if (!access.allowed) return fail('forbidden', 403)

  const publicId = await removableImageId(url)
  if (!publicId) return NextResponse.json({ ok: true, deleted: false })

  try {
    if (await roomShowsImage(roomId, url)) {
      await new Promise((r) => setTimeout(r, RECHECK_DELAY_MS))
      if (await roomShowsImage(roomId, url)) return fail('image still on the table', 409)
    }
    await deleteCloudinaryImages([publicId])
  } catch (e) {
    console.error('cloudinary/remove', roomId, e)
    return fail('cloudinary delete failed', 502)
  }
  return NextResponse.json({ ok: true, deleted: true })
}

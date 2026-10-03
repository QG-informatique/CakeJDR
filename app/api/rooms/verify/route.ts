export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import { issueRoomToken } from '@/lib/roomAuth'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { resetDemoRoomIfEmpty } from '@/lib/db/demo'
import { syncCurrentUser } from '@/lib/db/users'
import { resolveRoomAccess } from '@/lib/db/roomAccess'
import { fail, ok } from '@/lib/api-response'

/**
 * Délivre un jeton d'accès aux données d'une table.
 *
 * Le jeton n'est remis qu'aux membres de la table (et à tous pour la salle de
 * démonstration, ainsi qu'à l'administrateur). Les routes de données
 * (`/api/roomstorage`) l'exigent. Il n'y a plus de mot de passe de table :
 * on entre sur invitation, avec le code donné par le MJ.
 */

/** Émission de jetons : large, juste pour borner l'abus. */
const TOKEN_ATTEMPTS = 60
const TOKEN_WINDOW_MS = 5 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { id?: unknown }
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    if (!id) return fail('Missing id', 400)

    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) return fail('Server misconfigured', 500)

    const limit = rateLimit(`room-token:${clientIp(req)}`, TOKEN_ATTEMPTS, TOKEN_WINDOW_MS)
    if (!limit.allowed) {
      const res = fail('Too many requests', 429)
      res.headers.set('Retry-After', String(limit.retryAfter))
      return res
    }

    const lb = new Liveblocks({ secret })
    const room = await lb.getRoom(id).catch(() => null)
    if (!room) return fail('Room not found', 404)

    // Connaître l'adresse d'une table ne suffit pas pour lire ses fiches.
    const account = await syncCurrentUser().catch(() => null)
    const access = await resolveRoomAccess(id, account)
    if (!access.allowed) {
      return fail(
        access.reason === 'sign-in-required'
          ? 'sign in to join this table'
          : 'not a member of this table — ask for its invitation code',
        403,
      )
    }

    // Salle de démonstration vide : on la remet dans son état de référence
    // avant de laisser entrer, pour que chaque visiteur la découvre intacte.
    const connected = (room as { usersCount?: number }).usersCount ?? 0
    await resetDemoRoomIfEmpty(id, connected).catch((e) =>
      console.error('resetDemoRoomIfEmpty', e),
    )

    const { accessToken, ts } = issueRoomToken(id, secret)
    return ok({ accessToken, ts })
  } catch (e: unknown) {
    console.error('rooms/verify', e)
    return fail('verify failed', 500)
  }
}

export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { addMember, findRoomByJoinCode } from '@/lib/db/rooms'
import { currentUserId, syncCurrentUser } from '@/lib/db/users'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { fail, ok } from '@/lib/api-response'

/**
 * Rejoindre une table avec un code d'invitation.
 *
 * C'est le seul moyen d'accéder à une table qu'on n'a pas créée. Le débit est
 * limité : sans cela, un code à six caractères se devine par force brute.
 */
const JOIN_ATTEMPTS = 15
const JOIN_WINDOW_MS = 10 * 60 * 1000

export async function POST(req: NextRequest) {
  const userId = await currentUserId()
  if (!userId) return fail('sign in to join a table', 401)

  const limit = rateLimit(`room-join:${clientIp(req)}`, JOIN_ATTEMPTS, JOIN_WINDOW_MS)
  if (!limit.allowed) {
    const res = fail('too many attempts', 429)
    res.headers.set('Retry-After', String(limit.retryAfter))
    return res
  }

  const body = (await req.json().catch(() => ({}))) as { code?: unknown }
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!code) return fail('missing code', 400)

  const room = await findRoomByJoinCode(code)
  if (!room) return fail('invalid invitation code', 404)

  // S'assure que le compte existe en base avant de créer l'appartenance.
  await syncCurrentUser()
  await addMember(room.id, userId)

  return ok({ id: room.id, name: room.name })
}

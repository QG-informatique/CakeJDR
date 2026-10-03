import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Jetons d'accès aux données d'une table.
 *
 * `/api/rooms/verify` en remet un aux membres de la table ; `/api/roomstorage`
 * l'exige. Les tables n'ont plus de mot de passe : on y entre sur invitation.
 */

function safeEqualHex(a: string, b: string): boolean {
  let bufA: Buffer
  let bufB: Buffer
  try {
    bufA = Buffer.from(a, 'hex')
    bufB = Buffer.from(b, 'hex')
  } catch {
    return false
  }
  if (bufA.length === 0 || bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/** Durée de validité d'un jeton d'accès. */
export const ROOM_TOKEN_TTL_MS = 10 * 60 * 1000

/** Émet un jeton prouvant que l'appelant a le droit d'accéder à cette table. */
export function issueRoomToken(
  roomId: string,
  secret: string,
): { accessToken: string; ts: number } {
  const ts = Date.now()
  const accessToken = createHmac('sha256', secret)
    .update(`${roomId}:${ts}`)
    .digest('hex')
  return { accessToken, ts }
}

/** Vérifie un jeton émis par `issueRoomToken`. */
export function verifyRoomToken(
  roomId: string,
  accessToken: string | null | undefined,
  ts: string | number | null | undefined,
  secret: string,
): boolean {
  if (!accessToken || ts === null || ts === undefined) return false

  const tsNum = Number(ts)
  if (!Number.isFinite(tsNum)) return false

  const age = Date.now() - tsNum
  if (age < 0 || age > ROOM_TOKEN_TTL_MS) return false

  const expected = createHmac('sha256', secret)
    .update(`${roomId}:${tsNum}`)
    .digest('hex')
  return safeEqualHex(expected, String(accessToken))
}

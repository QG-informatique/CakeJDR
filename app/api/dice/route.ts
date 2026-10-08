export const runtime = 'nodejs'

import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import { LiveList, type Lson } from '@liveblocks/client'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { syncCurrentUser } from '@/lib/db/users'
import { resolveRoomAccess } from '@/lib/db/roomAccess'
import { signDiceRoll } from '@/lib/diceSigning'
import { parseDiceThrow, revealAt, type SignedDiceRoll } from '@/lib/dicePayload'
import { isDiceType, POOL_MAX, validResults } from '@/lib/dicePool'

/**
 * Lancer de dés libre.
 *
 * Les dés roulent dans le navigateur du lanceur, et la physique décide : le
 * navigateur envoie les faces sur lesquelles ils se sont posés. Le serveur
 * vérifie qu'elles existent sur ces dés, inscrit le lancer signé dans la
 * liste partagée de la table, et chaque navigateur le rejoue sur ces faces.
 * La signature garantit que personne ne réécrit un lancer après coup.
 */
const ROLL_LIMIT = 30
const ROLL_WINDOW_MS = 60 * 1000
const MAX_PLAYER_LENGTH = 60
/** Messages et lancers gardés par table, comme dans `useEventLog`. */
const MAX_EVENTS = 2000

function fail(msg: string, code: number) {
  return NextResponse.json({ error: msg }, { status: code })
}

export async function POST(req: NextRequest) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) return fail('Liveblocks key missing', 500)

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const { roomId } = body
  if (typeof roomId !== 'string' || !roomId) return fail('missing roomId', 400)
  const rawDice = body.dice
  if (!Array.isArray(rawDice) || rawDice.length < 1 || rawDice.length > POOL_MAX || !rawDice.every(isDiceType)) {
    return fail('bad dice', 400)
  }
  if (!validResults(rawDice, body.results)) return fail('bad results', 400)
  // Dés et résultats rangés ensemble, par type croissant.
  const raw = body.results
  const order = rawDice.map((d, i) => ({ d, r: raw[i] ?? 1 })).sort((a, b) => a.d - b.d)
  const dice = order.map((o) => o.d)
  const results = order.map((o) => o.r)

  const account = await syncCurrentUser().catch(() => null)
  const limit = rateLimit(`dice:${account?.id ?? 'guest'}:${clientIp(req)}`, ROLL_LIMIT, ROLL_WINDOW_MS)
  if (!limit.allowed) {
    const res = fail('too many rolls', 429)
    res.headers.set('Retry-After', String(limit.retryAfter))
    return res
  }

  const access = await resolveRoomAccess(roomId, account)
  if (!access.allowed) return fail('forbidden', 403)
  const liveblocks = new Liveblocks({ secret })

  const rawPlayer = typeof body.player === 'string' ? body.player.trim() : ''
  const player = (rawPlayer || account?.pseudo || 'Visiteur').slice(0, MAX_PLAYER_LENGTH)
  const gesture = parseDiceThrow(body.throw)
  const unsigned: Omit<SignedDiceRoll, 'sig'> = {
    id: randomUUID(),
    player,
    dice: dice[0] ?? 6,
    result: results.reduce((a, b) => a + b, 0),
    ts: revealAt(body.ms),
    ...(dice.length > 1 ? { pool: { dice, results } } : {}),
  }
  const roll: SignedDiceRoll = {
    ...unsigned,
    sig: signDiceRoll(roomId, unsigned),
    ...(gesture ? { throw: gesture } : {}),
  }

  try {
    await liveblocks.mutateStorage(roomId, ({ root }) => {
      let list = root.get('events') as LiveList<Lson> | undefined
      if (!list || typeof list.push !== 'function') {
        list = new LiveList<Lson>([])
        root.set('events', list as never)
      }
      list.push({ kind: 'dice', ...roll } as Lson)
      for (let i = list.length - MAX_EVENTS; i > 0; i -= 1) list.delete(0)
    })
  } catch (e) {
    console.error('dice: écriture du lancer impossible', roomId, e)
    return fail('roll not saved', 502)
  }
  // Annonce en direct ; la liste partagée reste la référence.
  await liveblocks
    .broadcastEvent(roomId, { type: 'dice-roll', player, dice: roll.dice, result: roll.result, ts: roll.ts })
    .catch(() => {})

  return NextResponse.json({ ok: true, roll })
}

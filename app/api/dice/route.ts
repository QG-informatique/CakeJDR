export const runtime = 'nodejs'

import { randomInt, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import { LiveList, type Lson } from '@liveblocks/client'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { syncCurrentUser } from '@/lib/db/users'
import { resolveRoomAccess } from '@/lib/db/roomAccess'
import { signDiceRoll } from '@/lib/diceSigning'
import { DICE_REVEAL_DELAY_MS, DICE_TYPES, type SignedDiceRoll } from '@/lib/dicePayload'
import { parseThrow, revealDelayMs } from '@/lib/diceThrow'
import { drawFaces, dropDraw, freeDrawKey, readDraw, saveDraw } from '@/lib/diceDraw'

/**
 * Lancer de dé tiré par le serveur.
 *
 * Avant, le navigateur tirait le dé et écrivait lui-même le résultat : un
 * joueur pouvait le choisir. Ici le serveur tire, signe, et inscrit le lancer
 * dans la liste partagée de la table avant de répondre : le joueur ne peut ni
 * choisir son résultat, ni relancer en silence jusqu'à en avoir un bon.
 *
 * Avec `peek`, le joueur qui attrape le dé reçoit d'avance le résultat de son
 * prochain jet (`lib/diceDraw.ts`), pour l'inscrire sur le dé dès le lâcher.
 */
const ROLL_LIMIT = 30
const ROLL_WINDOW_MS = 60 * 1000
const PEEK_LIMIT = 60
const MAX_PLAYER_LENGTH = 60
/** Messages et lancers gardés par table, comme dans `useEventLog`. */
const MAX_EVENTS = 2000

function fail(msg: string, code: number) {
  return NextResponse.json({ error: msg }, { status: code })
}

export async function POST(req: NextRequest) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) return fail('Liveblocks key missing', 500)

  const body = (await req.json().catch(() => ({}))) as {
    roomId?: unknown
    dice?: unknown
    player?: unknown
    throw?: unknown
    peek?: unknown
  }
  const { roomId, dice } = body
  if (typeof roomId !== 'string' || !roomId) return fail('missing roomId', 400)
  if (typeof dice !== 'number' || !(DICE_TYPES as readonly number[]).includes(dice)) return fail('bad dice', 400)

  const account = await syncCurrentUser().catch(() => null)
  const peek = body.peek === true
  const limit = peek
    ? rateLimit(`dice-peek:${account?.id ?? 'guest'}:${clientIp(req)}`, PEEK_LIMIT, ROLL_WINDOW_MS)
    : rateLimit(`dice:${account?.id ?? 'guest'}:${clientIp(req)}`, ROLL_LIMIT, ROLL_WINDOW_MS)
  if (!limit.allowed) {
    const res = fail('too many rolls', 429)
    res.headers.set('Retry-After', String(limit.retryAfter))
    return res
  }

  const access = await resolveRoomAccess(roomId, account)
  if (!access.allowed) return fail('forbidden', 403)
  const liveblocks = new Liveblocks({ secret })
  // Un visiteur n'a pas de compte où ranger son tirage : il est tiré au lancer.
  const slot = account ? freeDrawKey(account.id) : null

  if (peek) {
    if (!slot) return NextResponse.json({ ok: true, results: null })
    const draw = await readDraw(liveblocks, roomId, slot, 1)
    if (!draw.stored) {
      try {
        await saveDraw(liveblocks, roomId, slot, draw)
      } catch (e) {
        console.error('dice: tirage non rangé', roomId, e)
        return NextResponse.json({ ok: true, results: null })
      }
    }
    return NextResponse.json({ ok: true, results: drawFaces(draw.values, dice, 1) })
  }

  const rawPlayer = typeof body.player === 'string' ? body.player.trim() : ''
  const player = (rawPlayer || account?.pseudo || 'Visiteur').slice(0, MAX_PLAYER_LENGTH)
  // Le geste fixe la durée du roulement : le résultat paraît quand le dé se pose.
  const gesture = parseThrow(body.throw)
  const draw = slot ? await readDraw(liveblocks, roomId, slot, 1) : null
  const unsigned = {
    id: randomUUID(),
    player,
    dice,
    result: (draw && drawFaces(draw.values, dice, 1)[0]) || randomInt(1, dice + 1),
    ts: Date.now() + (gesture ? revealDelayMs(gesture, 1) : DICE_REVEAL_DELAY_MS),
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
      list.push({ kind: 'dice', ...roll })
      for (let i = list.length - MAX_EVENTS; i > 0; i -= 1) list.delete(0)
    })
  } catch (e) {
    console.error('dice: écriture du lancer impossible', roomId, e)
    return fail('roll not saved', 502)
  }
  if (slot && draw?.stored) await dropDraw(liveblocks, roomId, slot)
  // Annonce en direct ; la liste partagée reste la référence.
  await liveblocks
    .broadcastEvent(roomId, { type: 'dice-roll', player, dice, result: roll.result, ts: roll.ts })
    .catch(() => {})

  return NextResponse.json({ ok: true, roll })
}

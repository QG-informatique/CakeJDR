export const runtime = 'nodejs'

import { randomInt, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import { LiveList, LiveMap, type Lson } from '@liveblocks/client'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { syncCurrentUser } from '@/lib/db/users'
import { resolveRoomAccess } from '@/lib/db/roomAccess'
import { signDiceRoll } from '@/lib/diceSigning'
import { sealCheck, unsealCheck, type SealedCheck, type SealedRolls } from '@/lib/checkSeal'
import { DICE_REVEAL_DELAY_MS, DICE_TYPES, type SignedDiceRoll } from '@/lib/dicePayload'
import {
  CHECK_DC_MAX,
  CHECK_DC_MIN,
  CHECK_DICE,
  CHECK_MOD_RANGE,
  CHECK_NAME_MAX,
  CHECK_REASON_MAX,
  LEVEL_UP_TARGETS,
  ROLLS_MAX,
  isCheckStat,
  type CheckRequest,
  type GmRequest,
  type RollsRequest,
} from '@/lib/checks'

/**
 * Tests demandés par le MJ.
 *
 * - `ask` (MJ) : range la demande dans la liste partagée `checks` ; un test
 *   (`type: 'check'`, par défaut) ou plusieurs dés (`type: 'rolls'`, dont la
 *   montée de niveau) ;
 * - `cancel` (MJ) : la retire ;
 * - `roll` (le joueur visé) : le serveur tire les dés, calcule la réussite
 *   d'un test, et inscrit le résultat signé dans l'historique.
 */
const LIMIT = 30
const WINDOW_MS = 60 * 1000
const MAX_EVENTS = 2000
const MAX_PENDING = 50

function fail(msg: string, code: number) {
  return NextResponse.json({ error: msg }, { status: code })
}

const isInt = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max

function checksMap(root: { get(key: string): unknown; set(key: string, value: never): void }) {
  let map = root.get('checks') as LiveMap<string, Lson> | undefined
  if (!map || typeof map.set !== 'function') {
    map = new LiveMap<string, Lson>()
    root.set('checks', map as never)
  }
  return map
}

/** Valide un test demandé par le MJ et le scelle ; renvoie l'erreur sinon. */
function askCheck(
  roomId: string,
  b: { targetId: string; targetName: string; stat: unknown; mod: unknown; dc: unknown; showDc: unknown; reason: string },
): CheckRequest | string {
  const { targetId, targetName, stat, mod, dc, showDc, reason } = b
  if (!isCheckStat(stat)) return 'bad stat'
  if (!isInt(mod, -CHECK_MOD_RANGE, CHECK_MOD_RANGE)) return 'bad mod'
  if (!isInt(dc, CHECK_DC_MIN, CHECK_DC_MAX)) return 'bad dc'
  if (typeof showDc !== 'boolean') return 'bad showDc'
  const sealed: SealedCheck = {
    id: randomUUID(),
    targetId,
    targetName,
    stat,
    mod,
    dc,
    showDc,
    ...(reason ? { reason } : {}),
  }
  return {
    id: sealed.id,
    targetId,
    targetName,
    stat,
    mod,
    showDc,
    ...(showDc ? { dc } : {}),
    ...(reason ? { reason } : {}),
    createdAt: Date.now(),
    seal: sealCheck(roomId, sealed),
  }
}

async function savePending(liveblocks: Liveblocks, roomId: string, request: GmRequest) {
  let full = false as boolean
  try {
    await liveblocks.mutateStorage(roomId, ({ root }) => {
      const map = checksMap(root)
      if (map.size >= MAX_PENDING) {
        full = true
        return
      }
      map.set(request.id, request as unknown as Lson)
    })
  } catch (e) {
    console.error('check: demande non enregistrée', roomId, e)
    return fail('not saved', 502)
  }
  if (full) return fail('too many pending checks', 409)
  return NextResponse.json({ ok: true, id: request.id })
}

export async function POST(req: NextRequest) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) return fail('Liveblocks key missing', 500)

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const { roomId, action } = body
  if (typeof roomId !== 'string' || !roomId) return fail('missing roomId', 400)

  const account = await syncCurrentUser().catch(() => null)
  const limit = rateLimit(`check:${account?.id ?? 'guest'}:${clientIp(req)}`, LIMIT, WINDOW_MS)
  if (!limit.allowed) {
    const res = fail('too many requests', 429)
    res.headers.set('Retry-After', String(limit.retryAfter))
    return res
  }

  const access = await resolveRoomAccess(roomId, account)
  if (!access.allowed) return fail('forbidden', 403)
  const liveblocks = new Liveblocks({ secret })

  if (action === 'ask') {
    if (access.role !== 'gm') return fail('gm only', 403)
    const { targetId, stat, mod, dc, showDc } = body
    const targetName = typeof body.targetName === 'string' ? body.targetName.trim().slice(0, CHECK_NAME_MAX) : ''
    const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, CHECK_REASON_MAX) : ''
    if (typeof targetId !== 'string' || !targetId || targetId.length > 200) return fail('bad target', 400)
    if (!targetName) return fail('bad target name', 400)

    let request: GmRequest
    if (body.type === 'rolls') {
      const { dice, levelUp } = body
      if (typeof dice !== 'number' || !(DICE_TYPES as readonly number[]).includes(dice)) return fail('bad dice', 400)
      if (typeof levelUp !== 'boolean') return fail('bad levelUp', 400)
      // Montée de niveau : un dé pour les PV et un par caractéristique.
      const count = levelUp ? LEVEL_UP_TARGETS.length : body.count
      if (!isInt(count, 1, ROLLS_MAX)) return fail('bad count', 400)
      const sealed: SealedRolls = {
        type: 'rolls',
        id: randomUUID(),
        targetId,
        targetName,
        dice,
        count,
        levelUp,
        ...(reason ? { reason } : {}),
      }
      const rolls: RollsRequest = { ...sealed, createdAt: Date.now(), seal: sealCheck(roomId, sealed) }
      request = rolls
    } else {
      const made = askCheck(roomId, { targetId, targetName, stat, mod, dc, showDc, reason })
      if (typeof made === 'string') return fail(made, 400)
      request = made
    }
    return savePending(liveblocks, roomId, request)
  }

  const id = body.id
  if (typeof id !== 'string' || !id) return fail('missing id', 400)

  if (action === 'cancel') {
    if (access.role !== 'gm') return fail('gm only', 403)
    try {
      await liveblocks.mutateStorage(roomId, ({ root }) => {
        checksMap(root).delete(id)
      })
    } catch (e) {
      console.error('check: annulation impossible', roomId, e)
      return fail('not saved', 502)
    }
    return NextResponse.json({ ok: true })
  }

  if (action !== 'roll') return fail('bad action', 400)

  // Écrits dans le rappel de `mutateStorage` : on les déclare ainsi pour que
  // TypeScript ne les croie pas toujours nuls après l'appel.
  let roll = null as SignedDiceRoll | null
  let error = null as [string, number] | null
  try {
    await liveblocks.mutateStorage(roomId, ({ root }) => {
      const map = checksMap(root)
      const entry = map.get(id) as { seal?: unknown } | undefined
      if (!entry) {
        error = ['no such check', 409]
        return
      }
      const check = typeof entry.seal === 'string' ? unsealCheck(roomId, entry.seal) : null
      if (!check || check.id !== id) {
        // Demande modifiée par un navigateur : on la jette.
        map.delete(id)
        error = ['bad check', 400]
        return
      }
      // Seul le joueur visé lance. Un visiteur n'a pas de compte : son
      // identifiant change à chaque connexion et le serveur ne peut pas le
      // vérifier, on s'en tient donc à l'accès à la table.
      const isTarget = account ? check.targetId === account.id : check.targetId.startsWith('guest_')
      if (!isTarget) {
        error = ['not your check', 403]
        return
      }
      map.delete(id)

      const base = { id: randomUUID(), player: check.targetName, ts: Date.now() + DICE_REVEAL_DELAY_MS }
      let unsigned: Omit<SignedDiceRoll, 'sig'>
      if (check.type === 'rolls') {
        const results = Array.from({ length: check.count }, () => randomInt(1, check.dice + 1))
        unsigned = {
          ...base,
          dice: check.dice,
          result: results.reduce((a, b) => a + b, 0),
          rolls: {
            results,
            levelUp: check.levelUp,
            ...(check.reason ? { reason: check.reason } : {}),
          },
        }
      } else {
        const result = randomInt(1, CHECK_DICE + 1)
        const total = result + check.mod
        unsigned = {
          ...base,
          dice: CHECK_DICE,
          result,
          check: {
            stat: check.stat,
            mod: check.mod,
            total,
            dc: check.dc,
            showDc: check.showDc,
            success: total >= check.dc,
            ...(check.reason ? { reason: check.reason } : {}),
          },
        }
      }
      roll = { ...unsigned, sig: signDiceRoll(roomId, unsigned) }

      let list = root.get('events') as LiveList<Lson> | undefined
      if (!list || typeof list.push !== 'function') {
        list = new LiveList<Lson>([])
        root.set('events', list as never)
      }
      list.push({ kind: roll.rolls ? 'rolls' : 'check', ...roll } as Lson)
      for (let i = list.length - MAX_EVENTS; i > 0; i -= 1) list.delete(0)
    })
  } catch (e) {
    console.error('check: jet non enregistré', roomId, e)
    return fail('roll not saved', 502)
  }
  if (error) return fail(error[0], error[1])
  if (!roll) return fail('roll not saved', 502)
  return NextResponse.json({ ok: true, roll })
}

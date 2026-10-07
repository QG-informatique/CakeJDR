export const runtime = 'nodejs'

import { randomInt, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import { LiveList, LiveMap, type Lson } from '@liveblocks/client'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { syncCurrentUser } from '@/lib/db/users'
import { resolveRoomAccess } from '@/lib/db/roomAccess'
import { signDiceRoll } from '@/lib/diceSigning'
import { sealCheck, unsealCheck, type SealedCheck } from '@/lib/checkSeal'
import { DICE_REVEAL_DELAY_MS, type SignedDiceRoll } from '@/lib/dicePayload'
import {
  CHECK_DC_MAX,
  CHECK_DC_MIN,
  CHECK_DICE,
  CHECK_MOD_RANGE,
  CHECK_NAME_MAX,
  CHECK_REASON_MAX,
  isCheckStat,
  type CheckRequest,
} from '@/lib/checks'

/**
 * Tests demandés par le MJ.
 *
 * - `ask` (MJ) : range la demande dans la liste partagée `checks` ;
 * - `cancel` (MJ) : la retire ;
 * - `roll` (le joueur visé) : le serveur tire le D20, ajoute le modificateur,
 *   compare à la difficulté et inscrit le résultat signé dans l'historique.
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
    if (!isCheckStat(stat)) return fail('bad stat', 400)
    if (!isInt(mod, -CHECK_MOD_RANGE, CHECK_MOD_RANGE)) return fail('bad mod', 400)
    if (!isInt(dc, CHECK_DC_MIN, CHECK_DC_MAX)) return fail('bad dc', 400)
    if (typeof showDc !== 'boolean') return fail('bad showDc', 400)

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
    const request: CheckRequest = {
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

      const result = randomInt(1, CHECK_DICE + 1)
      const total = result + check.mod
      const unsigned = {
        id: randomUUID(),
        player: check.targetName,
        dice: CHECK_DICE,
        result,
        ts: Date.now() + DICE_REVEAL_DELAY_MS,
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
      roll = { ...unsigned, sig: signDiceRoll(roomId, unsigned) }

      let list = root.get('events') as LiveList<Lson> | undefined
      if (!list || typeof list.push !== 'function') {
        list = new LiveList<Lson>([])
        root.set('events', list as never)
      }
      list.push({ kind: 'check', ...roll } as Lson)
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

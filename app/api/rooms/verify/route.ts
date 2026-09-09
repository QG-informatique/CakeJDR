export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import {
  checkRoomPassword,
  issueRoomToken,
  roomHasPassword,
} from '@/lib/roomAuth'
import { clientIp, rateLimit, resetRateLimit } from '@/lib/rateLimit'
import { resetDemoRoomIfEmpty } from '@/lib/db/demo'
import { fail, ok } from '@/lib/api-response'

/**
 * Vérifie l'accès à une room et délivre un jeton d'accès.
 *
 * Le jeton est émis pour toute room à laquelle l'appelant a droit — protégée
 * (après un mot de passe correct) comme ouverte (immédiatement). Les routes de
 * données (`/api/roomstorage`, `/api/blob`) l'exigent : sans lui, une room
 * ouverte ne fournirait aucune preuve d'accès à vérifier.
 */

/** Tentatives de mot de passe : 8 par quart d'heure, par IP et par room. */
const PWD_ATTEMPTS = 8
const PWD_WINDOW_MS = 15 * 60 * 1000

/** Émission de jetons sur rooms ouvertes : large, juste pour borner l'abus. */
const TOKEN_ATTEMPTS = 60
const TOKEN_WINDOW_MS = 5 * 60 * 1000

type RoomMetadata = Record<string, unknown> & {
  password?: string | null
  passwordHash?: string | null
  hasPassword?: boolean | string
}

const SAFE_METADATA_KEY = /^[a-zA-Z0-9:_-]{1,64}$/
const BLOCKED_METADATA_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

function isSafeMetadataKey(key: string) {
  return SAFE_METADATA_KEY.test(key) && !BLOCKED_METADATA_KEYS.has(key)
}

/**
 * Reconstruit des métadonnées sûres en y plaçant le nouveau hash.
 * Le mot de passe en clair est explicitement effacé (`null`) : c'est tout
 * l'intérêt de la migration.
 */
function metadataWithUpgradedHash(
  meta: RoomMetadata,
  upgradedHash: string,
): Record<string, string | string[] | null> {
  const entries: Array<[string, string | string[] | null]> = []
  for (const [key, value] of Object.entries(meta)) {
    if (key === 'password' || key === 'passwordHash' || key === 'hasPassword') continue
    if (!isSafeMetadataKey(key)) continue
    if (typeof value === 'string') entries.push([key, value])
    else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      entries.push([key, value])
    }
  }
  entries.push(['passwordHash', upgradedHash])
  entries.push(['hasPassword', '1'])
  entries.push(['password', null])
  return Object.fromEntries(entries)
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      id?: unknown
      password?: unknown
    }
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!id) return fail('Missing id', 400)

    const secret = process.env.LIVEBLOCKS_SECRET_KEY
    if (!secret) return fail('Server misconfigured', 500)

    const ip = clientIp(req)
    const lb = new Liveblocks({ secret })
    const room = await lb.getRoom(id).catch(() => null)
    if (!room) return fail('Room not found', 404)

    const meta = ((room as { metadata?: RoomMetadata })?.metadata ?? {}) as RoomMetadata
    const guarded = roomHasPassword(meta)

    // Salle de démonstration vide : on la remet dans son état de référence
    // avant de laisser entrer, pour que chaque visiteur la découvre intacte.
    const connected = (room as { usersCount?: number }).usersCount ?? 0
    await resetDemoRoomIfEmpty(id, connected).catch((e) =>
      console.error('resetDemoRoomIfEmpty', e),
    )

    // Room ouverte : jeton immédiat, sous une limite large.
    if (!guarded) {
      const limit = rateLimit(`room-token:${ip}`, TOKEN_ATTEMPTS, TOKEN_WINDOW_MS)
      if (!limit.allowed) {
        const res = fail('Too many requests', 429)
        res.headers.set('Retry-After', String(limit.retryAfter))
        return res
      }
      const { accessToken, ts } = issueRoomToken(id, secret)
      return ok({ guarded: false, accessToken, ts })
    }

    // Room protégée : le mot de passe est requis, et les tentatives sont comptées.
    const key = `room-pwd:${ip}:${id}`
    const limit = rateLimit(key, PWD_ATTEMPTS, PWD_WINDOW_MS)
    if (!limit.allowed) {
      const res = fail('Too many attempts', 429)
      res.headers.set('Retry-After', String(limit.retryAfter))
      return res
    }

    if (!password) return fail('Invalid password', 401)

    const storedHash =
      typeof meta.passwordHash === 'string' && meta.passwordHash.length
        ? meta.passwordHash
        : null
    const storedPlain =
      typeof meta.password === 'string' && meta.password.length ? meta.password : null

    const check = checkRoomPassword(password, storedHash, storedPlain)
    if (!check.valid) return fail('Invalid password', 401)

    resetRateLimit(key)

    // Mot de passe stocké dans un ancien format : on le réécrit en scrypt.
    // Best-effort — un échec de réécriture ne doit pas bloquer l'utilisateur.
    if (check.upgradedHash) {
      try {
        await lb.updateRoom(id, {
          metadata: metadataWithUpgradedHash(meta, check.upgradedHash),
        })
      } catch {
        // ignoré volontairement
      }
    }

    const { accessToken, ts } = issueRoomToken(id, secret)
    return ok({ guarded: true, accessToken, ts })
  } catch (e: unknown) {
    console.error('rooms/verify', e)
    return fail('verify failed', 500)
  }
}

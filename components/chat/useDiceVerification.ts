'use client'
import { useEffect, useState } from 'react'
import { diceSignedPayload } from '@/lib/dicePayload'
import type { SessionEvent } from '@/components/app/hooks/useEventLog'

/**
 * Vérifie la signature du serveur sur chaque lancer de dé du chat.
 *
 * - `verified` : enregistré et signé par le serveur ;
 * - `unverified` : écrit par un navigateur (ancien lancer, ou tentative de triche) ;
 * - absent : vérification impossible ici (navigateur trop ancien pour Ed25519,
 *   clé injoignable) — on n'affiche alors rien plutôt qu'un faux soupçon.
 */
export type DiceCheck = 'verified' | 'unverified'

let keyPromise: Promise<CryptoKey | null> | null = null
function loadKey() {
  keyPromise ??= fetch('/api/dice/key')
    .then((r) => r.json() as Promise<{ key?: string }>)
    .then(({ key }) => {
      if (!key) return null
      return crypto.subtle.importKey('raw', fromBase64Url(key), { name: 'Ed25519' }, false, ['verify'])
    })
    .catch(() => null)
  return keyPromise
}

function fromBase64Url(text: string) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

// Un lancer vérifié une fois n'a pas besoin de l'être à chaque nouveau message.
const known = new Map<string, DiceCheck>()

async function check(key: CryptoKey, roomId: string, ev: SessionEvent): Promise<DiceCheck> {
  if (!ev.sig || ev.player == null || ev.dice == null || ev.result == null) return 'unverified'
  try {
    const payload = diceSignedPayload(roomId, {
      id: ev.id,
      player: ev.player,
      dice: ev.dice,
      result: ev.result,
      ts: ev.ts,
      ...(ev.check ? { check: ev.check } : {}),
      ...(ev.rolls ? { rolls: ev.rolls } : {}),
      ...(ev.pool ? { pool: ev.pool } : {}),
    })
    const ok = await crypto.subtle.verify(
      { name: 'Ed25519' },
      key,
      fromBase64Url(ev.sig),
      new TextEncoder().encode(payload),
    )
    return ok ? 'verified' : 'unverified'
  } catch {
    return 'unverified'
  }
}

/**
 * Vérifie un seul lancer, pour l'animer sur la table : `null` quand la
 * vérification est impossible ici (on montre alors le lancer quand même).
 */
export async function verifyDiceEvent(roomId: string, ev: SessionEvent): Promise<DiceCheck | null> {
  const key = await loadKey()
  if (!key) return null
  return check(key, roomId, ev)
}

export function useDiceVerification(roomId: string, events: SessionEvent[]) {
  const [checks, setChecks] = useState<Record<string, DiceCheck>>({})

  useEffect(() => {
    let cancelled = false
    const dice = events.filter((ev) => ev.kind !== 'chat')
    if (dice.length === 0) return
    void loadKey().then(async (key) => {
      if (!key || cancelled) return
      const next: Record<string, DiceCheck> = {}
      for (const ev of dice) {
        const cacheKey = `${roomId}:${ev.id}:${ev.sig ?? ''}:${ev.player}:${ev.dice}:${ev.result}:${ev.ts}:${JSON.stringify(ev.check ?? null)}:${JSON.stringify(ev.rolls ?? null)}:${JSON.stringify(ev.pool ?? null)}`
        let result = known.get(cacheKey)
        if (!result) {
          result = await check(key, roomId, ev)
          known.set(cacheKey, result)
        }
        next[ev.id] = result
      }
      if (!cancelled) setChecks(next)
    })
    return () => {
      cancelled = true
    }
  }, [roomId, events])

  return checks
}

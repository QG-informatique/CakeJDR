'use client'

import { useMutation } from '@liveblocks/react'
import { LiveMap, type LiveObject } from '@liveblocks/client'
import type { AutoGmMode } from '@/lib/autoGm/types'

type Root = LiveObject<Liveblocks['Storage']>

/** Retire les jets encore en attente de l'aventure : test en cours, attaques du combat. */
function dropPendingRolls(storage: Root) {
  const state = storage.get('autoGm')
  const check = state?.get('check')
  if (check) storage.get('checks')?.delete(check.id)
  for (const atk of state?.get('combat')?.attacks ?? []) storage.get('checks')?.delete(atk.id)
}

/** Arrête l'aventure : panneau du MJ automatique, interrupteur de la table. */
export function useStopAdventure() {
  return useMutation(({ storage }) => {
    dropPendingRolls(storage)
    storage.delete('autoGm')
  }, [])
}

/**
 * Secours : rejoue la scène en cours depuis son début (votes, jet, combat
 * remis à zéro, plateau reposé). La visite change, donc un clic ou un jet
 * arrivé de l'ancienne version n'a plus d'effet.
 */
export function useRestartScene() {
  return useMutation(({ storage }, expected: number) => {
    const state = storage.get('autoGm')
    if (!state || state.get('visit') !== expected) return
    dropPendingRolls(storage)
    state.update({ visit: expected + 1, votes: new LiveMap<string, string>() })
    for (const key of ['voteStart', 'tiebreak', 'check', 'combat', 'trial', 'partial'] as const) state.delete(key)
  }, [])
}

/** Secours : annule le jet qui bloque (joueur parti, dé jamais lancé) ; le meneur en redemande un. */
export function useCancelRoll() {
  return useMutation(({ storage }, expected: number) => {
    const state = storage.get('autoGm')
    if (!state || state.get('visit') !== expected) return
    const check = state.get('check')
    if (check) storage.get('checks')?.delete(check.id)
    state.delete('check')
  }, [])
}

/** Le MJ de la table reprend la main (`gm`) ou la rend au MJ automatique (`auto`). */
export function useSetGmMode() {
  return useMutation(({ storage }, mode: AutoGmMode) => {
    storage.get('autoGm')?.set('mode', mode)
  }, [])
}

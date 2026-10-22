'use client'

import { useMutation } from '@liveblocks/react'
import { LiveMap, LiveObject } from '@liveblocks/client'
import { ADVENTURES, startState } from '@/lib/autoGm'
import type { AutoGmMode } from '@/lib/autoGm/types'

/**
 * Lance une aventure toute prête, ou la relance du début : partie neuve,
 * jet encore en attente annulé. Utilisé par le panneau de l'aventure et par
 * le panneau du MJ. Sans `lobby`, la partie repart sans salon d'attente
 * (« Rejouer » : tout le monde est déjà là et réglé).
 */
export function useStartAdventure() {
  return useMutation(({ storage }, adventureKey: string, mode: AutoGmMode = 'auto', lobby = true) => {
    const adv = ADVENTURES[adventureKey]
    if (!adv) return
    const previous = storage.get('autoGm')?.get('check')
    if (previous) storage.get('checks')?.delete(previous.id)
    storage.set(
      'autoGm',
      new LiveObject({ ...startState(adv, mode, lobby), votes: new LiveMap<string, string>() }),
    )
  }, [])
}

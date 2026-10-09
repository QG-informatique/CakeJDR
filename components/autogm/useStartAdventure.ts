'use client'

import { useMutation } from '@liveblocks/react'
import { LiveMap, LiveObject } from '@liveblocks/client'
import { ADVENTURES } from '@/lib/autoGm'
import type { AutoGmMode } from '@/lib/autoGm/types'

/**
 * Lance une aventure toute prête, ou la relance du début : partie neuve,
 * jet encore en attente annulé. Utilisé par le panneau de l'aventure et par
 * le panneau du MJ.
 */
export function useStartAdventure() {
  return useMutation(({ storage }, adventureKey: string, mode: AutoGmMode = 'auto') => {
    const adv = ADVENTURES[adventureKey]
    if (!adv) return
    const previous = storage.get('autoGm')?.get('check')
    if (previous) storage.get('checks')?.delete(previous.id)
    storage.set(
      'autoGm',
      new LiveObject({
        run: crypto.randomUUID(),
        adventure: adv.id,
        mode,
        scene: adv.start,
        visit: 1,
        setup: 0,
        path: [adv.start],
        flags: [...(adv.scenes[adv.start]?.gains ?? [])],
        votes: new LiveMap<string, string>(),
      }),
    )
  }, [])
}

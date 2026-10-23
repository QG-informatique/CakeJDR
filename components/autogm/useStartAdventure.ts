'use client'

import { useMutation } from '@liveblocks/react'
import { LiveMap, LiveObject } from '@liveblocks/client'
import { ADVENTURES, startState } from '@/lib/autoGm'
import type { AutoGmMode } from '@/lib/autoGm/types'

/**
 * Lance une aventure toute prête, ou la relance du début : partie neuve,
 * jet encore en attente annulé. Utilisé par le panneau de l'aventure et par
 * le panneau du MJ. Sans `lobby`, la partie repart sans salon d'attente
 * (« Rejouer » : tout le monde est déjà là et réglé). Avec le salon, la
 * musique choisie par le MJ automatique se met en pause jusqu'au départ.
 * `newHeroes` : chacun reprend un héros niveau 1 dans le salon.
 */
export function useStartAdventure() {
  return useMutation(({ storage }, adventureKey: string, mode: AutoGmMode = 'auto', lobby = true, newHeroes = false) => {
    const adv = ADVENTURES[adventureKey]
    if (!adv) return
    const previous = storage.get('autoGm')?.get('check')
    if (previous) storage.get('checks')?.delete(previous.id)
    // Salon d'attente : la musique de la table attend que tout le monde soit
    // prêt (chacun essaie le son de son côté). Elle repart à la première scène.
    const music = storage.get('music')
    if (lobby && music instanceof LiveObject && music.get('playing') && storage.get('settings')?.get('autoMusic') !== false) {
      const now = Date.now()
      const pos = (music.get('pos') ?? 0) + (now - (music.get('at') ?? now)) / 1000
      music.update({ playing: false, pos, at: now })
    }
    storage.set(
      'autoGm',
      new LiveObject({ ...startState(adv, mode, lobby, newHeroes), votes: new LiveMap<string, string>() }),
    )
  }, [])
}

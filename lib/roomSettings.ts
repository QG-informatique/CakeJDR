'use client'

import { useMemo } from 'react'
import { useMutation, useStorage } from '@liveblocks/react'
import { LiveObject } from '@liveblocks/client'
import { DEFAULT_SYSTEM, gameSystem, type GameSystemId } from './gameSystems'
import { buildSystem, parseCustomSystem, type CustomSystemData } from './customSystem'

/** Qui modifie les fiches : chaque joueur la sienne, ou le MJ seulement. */
export type SheetEditMode = 'own' | 'gm'
/** Qui dessine : tout le monde, le MJ seulement, ou les joueurs cochés. */
export type DrawPermission = 'all' | 'gm' | 'some'

export type RoomSettings = {
  sheetEdit: SheetEditMode
  draw: DrawPermission
  /** Comptes autorisés à dessiner quand `draw` vaut « some ». */
  drawAllowed: string[]
  /** Votes du MJ automatique : chacun voit qui a voté quoi, sauf s'ils sont anonymes. */
  anonymousVotes: boolean
  /** Système de jeu de la table (`lib/gameSystems.ts`), choisi à sa création. */
  system: GameSystemId
  /**
   * Système créé par le MJ (`lib/customSystem.ts`), joué à la place du preset.
   * `system` vaut alors le preset dont il garde les règles.
   */
  customSystem?: CustomSystemData
  /**
   * « Nouveau héros pour cette aventure » : les fiches faites ailleurs sont
   * refusées, chacun crée un héros ou en prend un tout prêt en arrivant
   * (`Character.heroFor`). Coché d'office à la création d'une salle ; absent
   * des salles plus anciennes, qui gardent la fiche choisie.
   */
  newHeroes: boolean
  /**
   * Avec le MJ automatique, un héros dont la barre d'XP est pleine monte de
   * niveau tout seul, à un moment calme (jamais pendant un jet ni une scène
   * qui fait mal). Décoché, c'est le MJ qui choisit qui monte, et comment.
   */
  autoLevelUp: boolean
  /** Le MJ automatique change la musique selon la scène (`lib/autoGm/music.ts`). */
  autoMusic: boolean
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  sheetEdit: 'own',
  draw: 'all',
  drawAllowed: [],
  anonymousVotes: false,
  system: DEFAULT_SYSTEM,
  newHeroes: false,
  autoLevelUp: true,
  autoMusic: true,
}

/**
 * Réglages de la table, posés par le MJ et partagés par Liveblocks.
 *
 * Ils bloquent dans l'interface seulement : un joueur qui modifie son
 * navigateur peut passer outre. Suffisant entre amis ; une protection côté
 * serveur viendra si le besoin se présente.
 */
export function useRoomSettings() {
  const stored = useStorage((root) => root.settings)
  const settings: RoomSettings = { ...DEFAULT_ROOM_SETTINGS, ...(stored ?? {}) }

  const update = useMutation(({ storage }, patch: Partial<RoomSettings>) => {
    const current = storage.get('settings')
    if (!current) {
      storage.set('settings', new LiveObject({ ...DEFAULT_ROOM_SETTINGS, ...patch }))
      return
    }
    current.update(patch)
  }, [])

  return { settings, update }
}

/** Le système de jeu de la table : celui du MJ s'il en a créé un, sinon le preset. */
export function useGameSystem() {
  const id = useStorage((root) => root.settings?.system)
  const custom = useStorage((root) => root.settings?.customSystem)
  return useMemo(() => {
    const data = custom ? parseCustomSystem(custom) : null
    return data ? buildSystem(data) : gameSystem(id)
  }, [id, custom])
}

/**
 * Change le système de la table : un preset (le système perso est retiré) ou
 * un système créé par le MJ.
 */
export function useSetGameSystem() {
  return useMutation(({ storage }, choice: GameSystemId | CustomSystemData) => {
    let current = storage.get('settings')
    if (!current) {
      current = new LiveObject({ ...DEFAULT_ROOM_SETTINGS })
      storage.set('settings', current)
    }
    if (typeof choice === 'string') {
      current.set('system', choice)
      current.delete('customSystem')
    } else {
      current.update({ system: choice.base, customSystem: choice })
    }
  }, [])
}

export function canDraw(settings: RoomSettings, user: { id?: string; gm: boolean }) {
  if (user.gm || settings.draw === 'all') return true
  if (settings.draw === 'gm') return false
  return !!user.id && settings.drawAllowed.includes(user.id)
}

export function canEditSheet(settings: RoomSettings, gm: boolean) {
  return gm || settings.sheetEdit === 'own'
}

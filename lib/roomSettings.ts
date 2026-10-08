'use client'

import { useMutation, useStorage } from '@liveblocks/react'
import { LiveObject } from '@liveblocks/client'

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
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  sheetEdit: 'own',
  draw: 'all',
  drawAllowed: [],
  anonymousVotes: false,
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

export function canDraw(settings: RoomSettings, user: { id?: string; gm: boolean }) {
  if (user.gm || settings.draw === 'all') return true
  if (settings.draw === 'gm') return false
  return !!user.id && settings.drawAllowed.includes(user.id)
}

export function canEditSheet(settings: RoomSettings, gm: boolean) {
  return gm || settings.sheetEdit === 'own'
}

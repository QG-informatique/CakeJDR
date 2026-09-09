import 'server-only'
import { Liveblocks } from '@liveblocks/node'
import { LiveList, LiveMap, LiveObject } from '@liveblocks/client'

/**
 * Salle de démonstration : capture et restauration.
 *
 * Un visiteur doit pouvoir tout essayer — dessiner, déplacer les images,
 * modifier la fiche — sans abîmer la démonstration pour le suivant. On garde
 * donc un état de référence, qu'on réécrit périodiquement par-dessus.
 */

/** Valeur JSON quelconque : le contenu exact depend du modele de fiche. */
type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

export type DemoSnapshot = {
  images: Record<string, Json>
  strokes: Json[]
  characters: Record<string, Json>
  quickNote: { text: string; updatedAt: number }
  music: { id: string; playing: boolean; volume?: number }
  events: Json[]
  capturedAt: number
}

function client() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) throw new Error('LIVEBLOCKS_SECRET_KEY is not set')
  return new Liveblocks({ secret })
}

/** Lit l'état courant de la salle pour en faire la référence. */
export async function captureSnapshot(roomId: string): Promise<DemoSnapshot> {
  const doc = (await client().getStorageDocument(roomId, 'json')) as Record<string, unknown>
  return {
    images: (doc?.images as Record<string, Json>) ?? {},
    strokes: (doc?.strokes as Json[]) ?? [],
    characters: (doc?.characters as Record<string, Json>) ?? {},
    quickNote: (doc?.quickNote as DemoSnapshot['quickNote']) ?? { text: '', updatedAt: 0 },
    music: (doc?.music as DemoSnapshot['music']) ?? { id: '', playing: false },
    events: (doc?.events as Json[]) ?? [],
    capturedAt: Date.now(),
  }
}

/**
 * Réécrit l'état de référence par-dessus la salle.
 *
 * Les structures Liveblocks sont remplacées entières plutôt que modifiées clé
 * par clé : c'est plus court, et surtout ça supprime ce qu'un visiteur aurait
 * ajouté.
 */
export async function restoreSnapshot(roomId: string, snap: DemoSnapshot) {
  await client().mutateStorage(roomId, ({ root }) => {
    root.set(
      'images',
      new LiveMap(Object.entries(snap.images ?? {})) as never,
    )
    root.set('strokes', new LiveList(snap.strokes ?? []) as never)
    root.set(
      'characters',
      new LiveMap(Object.entries(snap.characters ?? {})) as never,
    )
    root.set('quickNote', new LiveObject(snap.quickNote) as never)
    root.set('music', new LiveObject(snap.music) as never)
    root.set('events', new LiveList(snap.events ?? []) as never)
  })
}

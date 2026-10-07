import 'server-only'
import { Liveblocks } from '@liveblocks/node'
import { LiveList, LiveMap, LiveObject } from '@liveblocks/client'
import { collectRoomImages, deleteCloudinaryImages } from './cloudinaryCleanup'

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
  /** Bibliothèque de la table ; absente des captures faites avant elle. */
  library?: Record<string, Json>
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

/**
 * Réécrit l'état de référence par-dessus la salle.
 *
 * Les structures Liveblocks sont remplacées entières plutôt que modifiées clé
 * par clé : c'est plus court, et surtout ça supprime ce qu'un visiteur aurait
 * ajouté. Les images que les visiteurs ont téléversées sont ensuite effacées
 * chez Cloudinary : plus rien ne les affiche. Celles de l'état de référence
 * sont épargnées (`collectRoomImages` les exclut).
 */
export async function restoreSnapshot(roomId: string, snap: DemoSnapshot) {
  const liveblocks = client()
  const added = await collectRoomImages(
    () => liveblocks.getStorageDocument(roomId, 'json') as Promise<{ images?: unknown; library?: unknown }>,
  ).catch((e: unknown) => {
    console.error('restoreSnapshot: lecture des images impossible', roomId, e)
    return []
  })
  await liveblocks.mutateStorage(roomId, ({ root }) => {
    root.set(
      'images',
      new LiveMap(Object.entries(snap.images ?? {})) as never,
    )
    root.set(
      'library',
      new LiveMap(Object.entries(snap.library ?? {})) as never,
    )
    root.set('strokes', new LiveList(snap.strokes ?? []) as never)
    root.set(
      'characters',
      new LiveMap(Object.entries(snap.characters ?? {})) as never,
    )
    root.set('quickNote', new LiveObject(snap.quickNote) as never)
    root.set('music', new LiveObject(snap.music) as never)
    root.set('events', new LiveList(snap.events ?? []) as never)
    root.set('checks', new LiveMap() as never)
  })
  await deleteCloudinaryImages(added).catch((e: unknown) => {
    console.error('restoreSnapshot: suppression des images Cloudinary impossible', roomId, e)
  })
}

import 'server-only'
import { Liveblocks } from '@liveblocks/node'
import { LiveList, LiveMap, LiveObject } from '@liveblocks/client'
import * as Y from 'yjs'
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

/**
 * Résumé déjà rempli à l'arrivée : un visiteur voit tout de suite que c'est
 * ici que la table garde son histoire d'une séance à l'autre. Le texte vit
 * dans le code plutôt que dans la capture, qui ne sait pas lire Yjs.
 */
const DEMO_SUMMARY: { title: string; text: string }[] = [
  {
    title: 'À quoi sert ce Résumé',
    text: [
      "Ici, la table garde son histoire d'une séance à l'autre.",
      '',
      "Après chaque partie, quelqu'un note ce qui s'est passé : où en est le groupe, qui a été rencontré, ce qui reste à faire. La semaine suivante, tout le monde relit la page et la partie reprend là où elle s'était arrêtée.",
      '',
      "Tout le monde peut écrire en même temps, comme dans un document partagé. Une page par séance, ou par acte : ajoute-en une avec le bouton +.",
      '',
      'Le Résumé reste dans la salle : tu le retrouves à chaque fois que tu reviens.',
    ].join('\n'),
  },
  {
    title: 'Séance 1 — La pâtisserie de Mila',
    text: [
      'Mila nous a accueillis dans sa pâtisserie, au petit matin. Ses levains disparaissent la nuit, et la porte de la cave est rayée de traces de croûte brûlée.',
      '',
      "On est descendus voir. Au fond de la cave, une chose faite de mie noircie s'est relevée et nous a barré le passage.",
      '',
      "À faire la prochaine fois : retourner à la cave avec une lanterne, et demander à Mila d'où vient le plus vieux de ses levains.",
    ].join('\n'),
  },
]

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
    // Pages neuves à chaque remise à zéro : leur texte passe par la copie
    // `editor`, que le Résumé verse dans Yjs à la première ouverture.
    const pages = DEMO_SUMMARY.map((p) => ({ id: crypto.randomUUID(), ...p }))
    root.set(
      'summary',
      new LiveObject({
        acts: new LiveList(pages.map(({ id, title }) => ({ id, title }))),
        currentId: pages[0]!.id,
      }) as never,
    )
    root.set('editor', new LiveMap(pages.map(({ id, text }) => [id, text])) as never)
  })
  await clearSummaryTexts(liveblocks, roomId).catch((e: unknown) => {
    console.error('restoreSnapshot: effacement des textes du Résumé impossible', roomId, e)
  })
  await deleteCloudinaryImages(added).catch((e: unknown) => {
    console.error('restoreSnapshot: suppression des images Cloudinary impossible', roomId, e)
  })
}

/**
 * Vide dans Yjs les textes des anciennes pages du Résumé. Plus aucune page ne
 * les affiche, mais ils pèseraient dans la salle à chaque remise à zéro.
 */
async function clearSummaryTexts(liveblocks: Liveblocks, roomId: string) {
  const doc = new Y.Doc()
  Y.applyUpdate(doc, new Uint8Array(await liveblocks.getYjsDocumentAsBinaryUpdate(roomId)))
  const before = Y.encodeStateVector(doc)
  doc.transact(() => {
    for (const key of Array.from(doc.share.keys())) {
      if (!key.startsWith('summary:')) continue
      const text = doc.getText(key)
      if (text.length > 0) text.delete(0, text.length)
    }
    const moved = doc.getMap('summaryMoved')
    for (const key of Array.from(moved.keys())) moved.delete(key)
  })
  const update = Y.encodeStateAsUpdate(doc, before)
  // Une mise à jour vide fait encore deux octets : rien à envoyer.
  if (update.length > 2) await liveblocks.sendYjsBinaryUpdate(roomId, update)
}

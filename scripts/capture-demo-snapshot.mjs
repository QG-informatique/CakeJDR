/**
 * Capture l'état actuel d'une salle de démonstration comme état de référence.
 *
 * À relancer après avoir modifié la salle d'exemple pour figer la nouvelle
 * version :
 *
 *   DEMO_ROOM_ID=... node scripts/capture-demo-snapshot.mjs
 */
import { Liveblocks } from '@liveblocks/node'
import { neon } from '@neondatabase/serverless'

const ROOM = process.env.DEMO_ROOM_ID
const lb = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY })
const sql = neon(process.env.DATABASE_URL)

const doc = await lb.getStorageDocument(ROOM, 'json')
const snapshot = {
  images: doc?.images ?? {},
  strokes: doc?.strokes ?? [],
  // Les fiches laissées par les visiteurs ne font pas partie de la démo.
  characters: Object.fromEntries(
    Object.entries(doc?.characters ?? {}).filter(([key]) => !key.startsWith('Visiteur:')),
  ),
  quickNote: doc?.quickNote ?? { text: '', updatedAt: 0 },
  music: doc?.music ?? { id: '', playing: false },
  events: doc?.events ?? [],
  capturedAt: Date.now(),
}

await sql`update rooms set demo_snapshot = ${JSON.stringify(snapshot)}::jsonb where id = ${ROOM}`

console.log(
  'Instantane capture —',
  'images:', Object.keys(snapshot.images).length,
  '| traits:', snapshot.strokes.length,
  '| fiches:', Object.keys(snapshot.characters).length,
)

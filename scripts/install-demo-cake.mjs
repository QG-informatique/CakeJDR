/**
 * Installe le set « Cake » (pack d'images n° 2) dans une salle :
 *
 * - la pâtisserie de Cake en fond ;
 * - le pion de Cake ;
 * - le Golem de Mie Brûlée et deux levains affamés ;
 * - la rencontre de Mila, l'apprentie ;
 * - le portrait de Cake sur sa fiche.
 *
 * Les images posées avant sont retirées du plateau, sans être effacées chez
 * Cloudinary.
 *
 * Les images viennent de public/bibliotheque/ : sur la salle de démonstration,
 * ne lancer le script qu'une fois le site en ligne avec ces fichiers, puis
 * figer le résultat :
 *
 *   DEMO_ROOM_ID=... node --env-file=.env.local scripts/install-demo-cake.mjs
 *   DEMO_ROOM_ID=... node --env-file=.env.local scripts/capture-demo-snapshot.mjs
 */
import { Liveblocks } from '@liveblocks/node'
import { LiveMap } from '@liveblocks/client'

const ROOM = process.env.DEMO_ROOM_ID
if (!ROOM) throw new Error('DEMO_ROOM_ID manquant')

const lib = (cat, id) => `/bibliotheque/${cat}/${id}.webp`
const now = Date.now()

// Positions en fraction du plateau, qui change de forme selon l'écran : la
// carte le couvre en restant centrée, et chaque image garde ses proportions
// dans sa case. Les cases sont donc larges, et tout reste près du centre.
const placed = [
  { id: 'demo-carte', url: lib('cartes', 'patisserie-cake'), kind: 'map', x: 0, y: 0, width: 1, height: 1 },
  { id: 'demo-golem', url: lib('ennemis', 'golem-mie-brulee'), x: 0.38, y: 0.08, width: 0.24, height: 0.24 },
  { id: 'demo-levain-1', url: lib('ennemis', 'levain-affame'), x: 0.225, y: 0.27, width: 0.14, height: 0.14 },
  { id: 'demo-levain-2', url: lib('ennemis', 'levain-affame'), x: 0.635, y: 0.3, width: 0.14, height: 0.14 },
  { id: 'demo-cake', url: lib('pions', 'cake-patissier'), x: 0.42, y: 0.58, width: 0.16, height: 0.16 },
  { id: 'demo-mila', url: lib('rencontres', 'apprentie-patissiere'), x: 0.74, y: 0.81, width: 0.24, height: 0.17 },
]

const lb = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY })

let portraits = 0
await lb.mutateStorage(ROOM, ({ root }) => {
  root.set(
    'images',
    new LiveMap(placed.map((img, i) => [img.id, { ...img, createdAt: now + i }])),
  )
  const characters = root.get('characters')
  if (characters) {
    for (const [key, fiche] of Array.from(characters.entries())) {
      if (fiche?.nom !== 'Cake') continue
      characters.set(key, { ...fiche, portrait: lib('portraits', 'cake-patissier'), updatedAt: now })
      portraits++
    }
  }
})

console.log('Set Cake installe —', 'images :', placed.length, '| portraits :', portraits)

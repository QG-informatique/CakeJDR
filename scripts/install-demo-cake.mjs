/**
 * Installe le set « Cake » (pack d'images n° 2) dans une salle :
 *
 * - la pâtisserie de Cake en fond ;
 * - le pion de Cake ;
 * - le Golem de Mie Brûlée et deux levains affamés ;
 * - la rencontre de Mila, l'apprentie ;
 * - le portrait de Cake sur sa fiche ;
 * - quelques traits, pour montrer qu'on peut dessiner sur le plateau : une
 *   croix sur un levain déjà vaincu, un cercle autour du Golem, une flèche
 *   pour le déplacement de Cake ;
 * - une note et un début de partie dans l'historique, qui racontent la même
 *   scène.
 *
 * Les images, les traits, la note et l'historique d'avant sont remplacés. Les images ne
 * sont pas effacées chez Cloudinary.
 *
 * Les images viennent de public/bibliotheque/ : sur la salle de démonstration,
 * ne lancer le script qu'une fois le site en ligne avec ces fichiers, puis
 * figer le résultat :
 *
 *   DEMO_ROOM_ID=... node --env-file=.env.local scripts/install-demo-cake.mjs
 *   DEMO_ROOM_ID=... node --env-file=.env.local scripts/capture-demo-snapshot.mjs
 */
import { Liveblocks } from '@liveblocks/node'
import { LiveList, LiveMap, LiveObject } from '@liveblocks/client'

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

// Traits en fraction du plateau, comme les images. L'épaisseur est une
// fraction du plus petit côté du plateau.
const TRAIT = 0.011
const ROUGE = '#FF0000'
const BLANC = '#FFFFFF'
const strokes = []
const segment = (x1, y1, x2, y2, color) =>
  strokes.push({ id: `demo-trait-${strokes.length}`, x1, y1, x2, y2, color, width: TRAIT, mode: 'draw', space: 'world' })

// Croix sur le premier levain : déjà vaincu.
segment(0.255, 0.29, 0.335, 0.39, ROUGE)
segment(0.335, 0.29, 0.255, 0.39, ROUGE)

// Cercle autour du Golem : la cible.
const N = 48
for (let i = 0; i < N; i++) {
  const a = (i / N) * 2 * Math.PI
  const b = ((i + 1) / N) * 2 * Math.PI
  segment(0.5 + 0.13 * Math.cos(a), 0.2 + 0.14 * Math.sin(a), 0.5 + 0.13 * Math.cos(b), 0.2 + 0.14 * Math.sin(b), ROUGE)
}

// Flèche en pointillés : Cake va vers le second levain.
const [ax, ay, bx, by] = [0.53, 0.57, 0.68, 0.455]
const PAS = 10
for (let i = 0; i < PAS; i += 2) {
  segment(ax + ((bx - ax) * i) / PAS, ay + ((by - ay) * i) / PAS, ax + ((bx - ax) * (i + 1)) / PAS, ay + ((by - ay) * (i + 1)) / PAS, BLANC)
}
const angle = Math.atan2(by - ay, bx - ax)
for (const d of [-0.5, 0.5]) {
  segment(bx, by, bx - 0.04 * Math.cos(angle + d), by - 0.04 * Math.sin(angle + d), BLANC)
}

const note = [
  'Séance 1 — La pâtisserie de Cake',
  "- Mila a donné l'alerte : des levains affamés sortent du four.",
  '- Un levain vaincu par Fournée ardente.',
  '- Reste un levain, et le Golem de Mie Brûlée devant le four.',
].join('\n')

const minute = 60_000
const events = [
  { kind: 'chat', isMJ: true, author: 'MJ', text: "Mila déboule dans la boutique : « Cake ! Le four s'est réveillé ! »" },
  { kind: 'chat', isMJ: true, author: 'MJ', text: 'Ta brioche enflammée touche le premier levain : il fond sur place.' },
  { kind: 'chat', isMJ: true, author: 'MJ', text: "Le Golem de Mie Brûlée s'extrait du four en grondant. À toi de jouer !" },
].map((e, i) => ({ id: `demo-evt-${i}`, ts: now - (3 - i) * minute, ...e }))

const lb = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY })

let portraits = 0
await lb.mutateStorage(ROOM, ({ root }) => {
  root.set(
    'images',
    new LiveMap(placed.map((img, i) => [img.id, { ...img, createdAt: now + i }])),
  )
  root.set('strokes', new LiveList(strokes))
  root.set('quickNote', new LiveObject({ text: note, updatedAt: now }))
  root.set('events', new LiveList(events))
  const characters = root.get('characters')
  if (characters) {
    for (const [key, fiche] of Array.from(characters.entries())) {
      if (fiche?.nom !== 'Cake') continue
      characters.set(key, { ...fiche, portrait: lib('portraits', 'cake-patissier'), updatedAt: now })
      portraits++
    }
  }
})

console.log('Set Cake installe —', 'images :', placed.length, '| traits :', strokes.length, '| historique :', events.length, '| portraits :', portraits)

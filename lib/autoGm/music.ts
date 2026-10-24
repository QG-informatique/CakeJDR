/**
 * Musique d'ambiance du MJ automatique : à chaque scène, un morceau lancé
 * pour toute la table, choisi d'après la carte (taverne, forêt, donjon…) ou
 * le combat en cours.
 *
 * Tous les morceaux sont de Kevin MacLeod (incompetech.com), sous licence
 * Creative Commons Attribution 4.0 : la page `/credits` les cite un par un,
 * comme la licence le demande. Ce sont les vidéos de sa chaîne YouTube
 * officielle, dont l'intégration est autorisée.
 */
import type { Adventure } from './types'

export type MusicMood =
  | 'voyage'
  | 'taverne'
  | 'village'
  | 'foret'
  | 'donjon'
  | 'combat'
  | 'boss'
  | 'victoire'
  | 'triste'

export type Track = { id: string; title: string; mood: MusicMood }

export const MUSIC_AUTHOR = 'Kevin MacLeod (incompetech.com)'
export const MUSIC_LICENSE = 'Creative Commons: By Attribution 4.0'
export const MUSIC_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/'

export const TRACKS: Track[] = [
  { id: 'MxMJmw71CMA', title: 'Teller of the Tales', mood: 'voyage' },
  { id: 'd8OHJqV9EBw', title: 'Lord of the Land', mood: 'voyage' },
  { id: 'jx83rMjic5w', title: 'Master of the Feast', mood: 'taverne' },
  { id: 'M_vxveM3d7Y', title: 'Pippin the Hunchback', mood: 'taverne' },
  { id: 'kGpGv0-4z0A', title: 'Thatched Villagers', mood: 'village' },
  { id: 'SocyXjeRQy4', title: 'Village Consort', mood: 'village' },
  { id: 'LpF9zRJmFjA', title: 'Enchanted Valley', mood: 'foret' },
  { id: 'm54qYljqp04', title: 'Shores of Avalon', mood: 'foret' },
  { id: 'LtVvLH6fgJ4', title: 'Celtic Impulse', mood: 'foret' },
  { id: 'e9zKKirJJbc', title: 'Darkling', mood: 'donjon' },
  { id: '7-LEBIfAh1A', title: 'Dark Fog', mood: 'donjon' },
  { id: 'aJ55nO02BRk', title: 'Ossuary 6 – Air', mood: 'donjon' },
  { id: 'VNctLX9oOJc', title: 'Midnight Tale', mood: 'donjon' },
  { id: 'CUsOCFuiyao', title: 'Five Armies', mood: 'combat' },
  { id: 'KKVgIrnlWDg', title: 'Clash Defiant', mood: 'combat' },
  { id: '2pXa5jzaOBg', title: 'Volatile Reaction', mood: 'combat' },
  { id: '8RaUPWhdeng', title: 'Crusade – Heavy Industry', mood: 'boss' },
  { id: '-FEaORNBJkg', title: 'Heroic Age', mood: 'victoire' },
  { id: '6d7Zd7hl6j4', title: 'The Pyre', mood: 'triste' },
]

/** Morceau du salon d'attente, avant que tout le monde soit prêt. */
export const LOBBY_TRACK = TRACKS[0]!.id

/** Ambiance de chaque carte de la bibliothèque ; les autres passent en « voyage ». */
const MAP_MOOD: Record<string, MusicMood> = {
  'ambiance-taverne': 'taverne',
  'taverne-interieur': 'taverne',
  'place-village': 'village',
  ferme: 'village',
  'patisserie-cake': 'village',
  'port-quais': 'village',
  'rues-ville': 'village',
  'ambiance-ville-royale': 'village',
  'foret-clairiere': 'foret',
  'ruines-elfiques': 'foret',
  'gue-riviere': 'foret',
  'grotte-gobelins': 'donjon',
  'camp-gobelins': 'donjon',
  'camp-orc': 'donjon',
  egouts: 'donjon',
  'cave-farine': 'donjon',
  'sanctuaire-culte': 'donjon',
  'mine-abandonnee': 'donjon',
  marais: 'donjon',
  cimetiere: 'donjon',
  crypte: 'donjon',
  'chateau-vampire': 'donjon',
  'donjon-salles': 'donjon',
  'repaire-dragon': 'donjon',
  'tour-mage': 'donjon',
  bibliotheque: 'donjon',
  temple: 'donjon',
}

/** Un ennemi aussi coriace (PV pour un héros seul) fait d'un combat un combat de boss. */
const BOSS_HP = 18

/**
 * Ambiance de la scène où mène `path` : celle qu'elle demande, sinon le
 * combat, la fin, ou la dernière carte posée en chemin (une scène sans carte
 * garde le décor d'avant).
 */
export function sceneMood(adventure: Adventure, path: string[]): MusicMood {
  const scene = adventure.scenes[path[path.length - 1] ?? '']
  if (scene?.setup?.music) return scene.setup.music
  const step = scene?.step
  if (step?.kind === 'combat') {
    return step.foes.some((f) => f.hp >= BOSS_HP || (f.attacks ?? 1) > 1) ? 'boss' : 'combat'
  }
  if (step?.kind === 'end') return 'victoire'
  for (let i = path.length - 1; i >= 0; i -= 1) {
    const map = adventure.scenes[path[i] ?? '']?.setup?.map
    if (map) return MAP_MOOD[map] ?? 'voyage'
  }
  return 'voyage'
}

/**
 * Morceau à jouer pour cette ambiance. Celui qui tourne déjà est gardé s'il
 * y correspond : on ne relance pas la musique à chaque scène. Sinon le choix
 * dépend de `seed`, pour varier d'une partie à l'autre.
 */
export function trackFor(mood: MusicMood, current: string | undefined, seed: string): string {
  const tracks = TRACKS.filter((t) => t.mood === mood)
  if (tracks.some((t) => t.id === current)) return current!
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0
  return tracks[Math.abs(h) % tracks.length]!.id
}

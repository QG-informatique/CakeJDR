/**
 * Ce que chaque classe peut faire à son tour de combat avec le MJ automatique
 * (`lib/autoGm/combat.ts`). Tout le monde peut attaquer avec son arme, se
 * défendre ou tenter de fuir ; chaque classe ajoute ses techniques, reprises
 * des compétences de départ de `lib/heroCreation.ts` quand elles existent.
 *
 * Les techniques fortes s'usent : `uses` fois par combat.
 */
import type { CheckStat } from '@/lib/checks'
import { classOf } from '@/lib/heroCreation'
import type { Objet } from '@/types/character'

export type ActionEffect =
  /** Jet d'attaque (d20 + caractéristique) contre la défense d'un ennemi ; dégâts s'il touche. */
  | 'hit'
  /** Touche un ennemi sans jet. */
  | 'auto'
  /** Touche tous les ennemis sans jet. */
  | 'area'
  /** Soigne l'allié le plus mal en point, à terre compris. */
  | 'heal'
  /** Se soigne soi-même. */
  | 'selfHeal'
  /** Dégâts reçus divisés par deux jusqu'à son prochain tour. */
  | 'guard'
  /** La prochaine attaque reçue rate. */
  | 'dodge'
  /** Les alliés ajoutent +2 à leur prochain jet d'attaque. */
  | 'inspire'
  /** Tout le groupe tente de fuir : un jet, réussi ou non. */
  | 'flee'

export type CombatAction = {
  id: string
  fr: string
  en: string
  /** Une ligne sous le bouton : ce que ça fait. */
  hintFr: string
  hintEn: string
  effect: ActionEffect
  /** Caractéristique du jet d'attaque, et du bonus de dégâts ou de soins. */
  stat?: CheckStat
  /** Bonus (ou malus) au jet d'attaque. */
  toHit?: number
  /** Dés de dégâts ou de soins (« 1d8+2 », « 1d4+1d6 ») ; « arme » : les dégâts de la fiche. */
  dice?: string
  /** Ajoute le modificateur de la caractéristique (s'il est positif). */
  mod?: boolean
  /** Ajoute le niveau du héros aux soins. */
  level?: boolean
  /** Fois par combat ; sans valeur, à volonté. */
  uses?: number
  /** L'ennemi touché perd sa prochaine attaque. */
  stun?: boolean
  /** L'ennemi touché a −3 à sa prochaine attaque. */
  weaken?: boolean
  /** `inspire` : le héros en profite aussi. */
  self?: boolean
  /** Objet du sac : `uses` est le nombre qu'en porte le héros, un de moins par usage. */
  item?: boolean
}

const ATTACK: CombatAction = {
  id: 'attaquer',
  fr: 'Attaquer',
  en: 'Attack',
  hintFr: 'Avec ton arme.',
  hintEn: 'With your weapon.',
  effect: 'hit',
  dice: 'arme',
  mod: true,
}
const DEFEND: CombatAction = {
  id: 'defendre',
  fr: 'Se défendre',
  en: 'Defend',
  hintFr: 'Sans jet : dégâts reçus divisés par deux ce tour.',
  hintEn: 'No roll: damage taken halved this round.',
  effect: 'guard',
}
export const FLEE: CombatAction = {
  id: 'fuir',
  fr: 'Fuir',
  en: 'Flee',
  hintFr: 'Tout le groupe tente de s\'échapper.',
  hintEn: 'The whole group tries to escape.',
  effect: 'flee',
}

const CLASS_ACTIONS: Record<string, CombatAction[]> = {
  guerrier: [
    { id: 'coup-puissant', fr: 'Coup puissant', en: 'Power Strike', hintFr: '−2 pour toucher, 1d8+2 dégâts.', hintEn: '−2 to hit, 1d8+2 damage.', effect: 'hit', stat: 'force', toHit: -2, dice: '1d8+2', mod: true },
    { id: 'second-souffle', fr: 'Second souffle', en: 'Second Wind', hintFr: 'Regagne 1d6 + niveau PV. Une fois.', hintEn: 'Regain 1d6 + level HP. Once.', effect: 'selfHeal', dice: '1d6', level: true, uses: 1 },
  ],
  mage: [
    { id: 'trait-de-feu', fr: 'Trait de feu', en: 'Fire Bolt', hintFr: 'Jet d\'Intelligence, 1d10 dégâts.', hintEn: 'Intelligence roll, 1d10 damage.', effect: 'hit', stat: 'intelligence', dice: '1d10', mod: true },
    { id: 'projectiles', fr: 'Projectiles magiques', en: 'Magic Missiles', hintFr: 'Touche à coup sûr : 1d4+2.', hintEn: 'Never misses: 1d4+2.', effect: 'auto', dice: '1d4+2' },
    { id: 'boule-de-feu', fr: 'Boule de feu', en: 'Fireball', hintFr: '1d6+1 à tous les ennemis. Une fois.', hintEn: '1d6+1 to every enemy. Once.', effect: 'area', dice: '1d6+1', uses: 1 },
    { id: 'bouclier', fr: 'Bouclier arcanique', en: 'Arcane Shield', hintFr: 'La prochaine attaque contre toi rate. Une fois.', hintEn: 'The next attack against you misses. Once.', effect: 'dodge', uses: 1 },
  ],
  rodeur: [
    { id: 'tir-precis', fr: 'Tir précis', en: 'Aimed Shot', hintFr: '+2 pour toucher, 1d8+1.', hintEn: '+2 to hit, 1d8+1.', effect: 'hit', stat: 'dexterite', toHit: 2, dice: '1d8+1', mod: true },
    { id: 'volee', fr: 'Volée de flèches', en: 'Volley', hintFr: '1d6 à tous les ennemis. Une fois.', hintEn: '1d6 to every enemy. Once.', effect: 'area', dice: '1d6', mod: true, stat: 'dexterite', uses: 1 },
  ],
  roublard: [
    { id: 'sournoise', fr: 'Attaque sournoise', en: 'Sneak Attack', hintFr: 'Jet de Dextérité, 1d4+1d6.', hintEn: 'Dexterity roll, 1d4+1d6.', effect: 'hit', stat: 'dexterite', dice: '1d4+1d6', mod: true },
    { id: 'coup-bas', fr: 'Coup bas', en: 'Low Blow', hintFr: '1d4, et l\'ennemi perd sa prochaine attaque.', hintEn: '1d4, and the enemy loses its next attack.', effect: 'hit', stat: 'dexterite', dice: '1d4', mod: true, stun: true, uses: 2 },
    { id: 'esquive', fr: 'Esquive', en: 'Evade', hintFr: 'La prochaine attaque contre toi rate.', hintEn: 'The next attack against you misses.', effect: 'dodge', uses: 2 },
  ],
  paladin: [
    { id: 'chatiment', fr: 'Châtiment', en: 'Smite', hintFr: 'Jet de Force, 1d8+1d6. Deux fois.', hintEn: 'Strength roll, 1d8+1d6. Twice.', effect: 'hit', stat: 'force', dice: '1d8+1d6', mod: true, uses: 2 },
    { id: 'imposition', fr: 'Imposition des mains', en: 'Lay on Hands', hintFr: 'Soigne l\'allié le plus blessé : 1d8 + niveau. Une fois.', hintEn: 'Heal the most hurt ally: 1d8 + level. Once.', effect: 'heal', dice: '1d8', level: true, uses: 1 },
  ],
  barde: [
    { id: 'moquerie', fr: 'Moquerie cinglante', en: 'Vicious Mockery', hintFr: 'Jet de Charisme, 1d6, et −3 à sa prochaine attaque.', hintEn: 'Charisma roll, 1d6, and −3 to its next attack.', effect: 'hit', stat: 'charisme', dice: '1d6', mod: true, weaken: true },
    { id: 'chant', fr: 'Chant inspirant', en: 'Inspiring Song', hintFr: 'Tes alliés ont +2 à leur prochain jet d\'attaque. Deux fois.', hintEn: 'Your allies get +2 on their next attack roll. Twice.', effect: 'inspire', uses: 2 },
  ],
  druide: [
    { id: 'ronces', fr: 'Ronces', en: 'Brambles', hintFr: '1d6 à tous les ennemis. Deux fois.', hintEn: '1d6 to every enemy. Twice.', effect: 'area', dice: '1d6', uses: 2 },
    { id: 'baies', fr: 'Baies soignantes', en: 'Goodberries', hintFr: 'Soigne l\'allié le plus blessé : 1d6 + Sagesse. Deux fois.', hintEn: 'Heal the most hurt ally: 1d6 + Wisdom. Twice.', effect: 'heal', dice: '1d6', stat: 'sagesse', mod: true, uses: 2 },
  ],
  clerc: [
    { id: 'lumiere', fr: 'Lumière sacrée', en: 'Sacred Flame', hintFr: 'Jet de Sagesse, 1d8.', hintEn: 'Wisdom roll, 1d8.', effect: 'hit', stat: 'sagesse', dice: '1d8', mod: true },
    { id: 'soins', fr: 'Soins', en: 'Cure Wounds', hintFr: 'Soigne l\'allié le plus blessé : 1d8 + Sagesse. Deux fois.', hintEn: 'Heal the most hurt ally: 1d8 + Wisdom. Twice.', effect: 'heal', dice: '1d8', stat: 'sagesse', mod: true, uses: 2 },
    { id: 'benediction', fr: 'Bénédiction', en: 'Bless', hintFr: 'Tout le groupe a +2 à son prochain jet d\'attaque. Une fois.', hintEn: 'The whole group gets +2 on its next attack roll. Once.', effect: 'inspire', self: true, uses: 1 },
  ],
  moine: [
    { id: 'deluge', fr: 'Déluge de coups', en: 'Flurry of Blows', hintFr: 'Jet de Dextérité, 1d6+1d6.', hintEn: 'Dexterity roll, 1d6+1d6.', effect: 'hit', stat: 'dexterite', dice: '1d6+1d6', mod: true },
    { id: 'etourdissant', fr: 'Coup étourdissant', en: 'Stunning Strike', hintFr: '1d6, et l\'ennemi perd sa prochaine attaque. Deux fois.', hintEn: '1d6, and the enemy loses its next attack. Twice.', effect: 'hit', stat: 'dexterite', dice: '1d6', mod: true, stun: true, uses: 2 },
    { id: 'pas-du-vent', fr: 'Pas du vent', en: 'Step of the Wind', hintFr: 'La prochaine attaque contre toi rate. Deux fois.', hintEn: 'The next attack against you misses. Twice.', effect: 'dodge', uses: 2 },
  ],
}

/** Armure portée par chaque classe, ajoutée à 10 + Dextérité quand la fiche n'a pas de défense. */
const ARMOR: Record<string, number> = {
  guerrier: 4,
  paladin: 4,
  clerc: 3,
  rodeur: 2,
  druide: 2,
  moine: 2,
  roublard: 1,
  barde: 1,
  mage: 2,
}

/** Caractéristique de l'arme : la Force ou la Dextérité, celle que la classe préfère. */
export function weaponStat(classe: string | undefined, mods: Record<string, number>): CheckStat {
  const hero = classOf(classe)
  if (hero) return hero.priorites.indexOf('force') < hero.priorites.indexOf('dexterite') ? 'force' : 'dexterite'
  return (mods.force ?? 0) >= (mods.dexterite ?? 0) ? 'force' : 'dexterite'
}

export function armorOf(classe: string | undefined): number {
  const hero = classOf(classe)
  return hero ? (ARMOR[hero.id] ?? 0) : 1
}

/**
 * Objets du sac utilisables en combat, reconnus à leur nom (français ou
 * anglais, accents ignorés). Chacun sert une fois.
 */
const ITEMS: { match: RegExp; action: CombatAction }[] = [
  {
    match: /potion/,
    action: { id: 'objet-potion', fr: 'Potion de soin', en: 'Healing potion', hintFr: 'Regagne 2d4+2 PV.', hintEn: 'Regain 2d4+2 HP.', effect: 'selfHeal', dice: '2d4+2', item: true },
  },
  {
    match: /herbe|herb/,
    action: { id: 'objet-herbes', fr: 'Herbes médicinales', en: 'Healing herbs', hintFr: 'Regagne 1d4+2 PV.', hintEn: 'Regain 1d4+2 HP.', effect: 'selfHeal', dice: '1d4+2', item: true },
  },
  {
    match: /bandage/,
    action: { id: 'objet-bandages', fr: 'Bandages', en: 'Bandages', hintFr: 'Soigne l\'allié le plus blessé : 1d4+2.', hintEn: 'Heal the most hurt ally: 1d4+2.', effect: 'heal', dice: '1d4+2', item: true },
  },
  {
    match: /baie|berr/,
    action: { id: 'objet-baies', fr: 'Baies', en: 'Berries', hintFr: 'Regagne 1d4+1 PV.', hintEn: 'Regain 1d4+1 HP.', effect: 'selfHeal', dice: '1d4+1', item: true },
  },
  {
    match: /eau benite|holy water/,
    action: { id: 'objet-eau-benite', fr: 'Eau bénite', en: 'Holy water', hintFr: 'Lancée sur un ennemi : 2d6, sans jet.', hintEn: 'Thrown at an enemy: 2d6, no roll.', effect: 'auto', dice: '2d6', item: true },
  },
  {
    match: /bombe|bomb|feu gregeois|fiole de feu|fire flask|alchemist/,
    action: { id: 'objet-bombe', fr: 'Fiole de feu', en: 'Fire flask', hintFr: '1d6+1 à tous les ennemis.', hintEn: '1d6+1 to every enemy.', effect: 'area', dice: '1d6+1', item: true },
  },
]

const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** L'action d'un objet du sac, d'après son nom. */
export function itemAction(nom: string | undefined): CombatAction | undefined {
  if (!nom) return undefined
  const name = plain(nom)
  return ITEMS.find((i) => i.match.test(name))?.action
}

/** Objets utilisables en combat dans un sac : identifiant de l'action → nombre. */
export function itemCounts(objets: readonly { nom?: string; quantite?: number | string }[] | undefined): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const o of objets ?? []) {
    const action = itemAction(o.nom)
    const n = Math.max(0, Math.floor(Number(o.quantite ?? 1) || 0))
    if (action && n > 0) counts[action.id] = (counts[action.id] ?? 0) + n
  }
  return counts
}

/**
 * Les actions d'un héros : attaquer, celles de sa classe, se défendre, fuir
 * quand la scène le permet, puis les objets de son sac.
 */
export function actionsFor(classe: string | undefined, canFlee: boolean, items?: Record<string, number>): CombatAction[] {
  const hero = classOf(classe)
  const bag = ITEMS.filter((i) => (items?.[i.action.id] ?? 0) > 0).map((i) => ({ ...i.action, uses: items![i.action.id] }))
  return [ATTACK, ...(hero ? (CLASS_ACTIONS[hero.id] ?? []) : []), DEFEND, ...(canFlee ? [FLEE] : []), ...bag]
}

export function actionById(classe: string | undefined, id: string, items?: Record<string, number>): CombatAction | undefined {
  return actionsFor(classe, true, items).find((a) => a.id === id)
}

/**
 * Le sac après un combat et une scène : les objets utilisés en moins (une
 * ligne vide disparaît), ceux trouvés en plus (ajoutés à une ligne du même nom).
 */
export function bagAfter(
  objets: readonly Objet[],
  consume?: Record<string, number>,
  loot?: readonly { nom: string; n: number }[],
): Objet[] {
  const left = { ...consume }
  const bag = objets.flatMap((o) => {
    const id = itemAction(o.nom)?.id
    const take = id ? Math.min(left[id] ?? 0, Number(o.quantite) || 0) : 0
    if (!take || !id) return [o]
    left[id] = (left[id] ?? 0) - take
    const quantite = (Number(o.quantite) || 0) - take
    return quantite > 0 ? [{ ...o, quantite }] : []
  })
  for (const { nom, n } of loot ?? []) {
    const same = bag.findIndex((o) => plain(o.nom) === plain(nom))
    if (same >= 0) bag[same] = { ...bag[same]!, quantite: (Number(bag[same]!.quantite) || 0) + n }
    else bag.push({ id: crypto.randomUUID(), nom, quantite: n })
  }
  return bag
}

/** Objets utilisés par un héros pendant un combat : identifiant de l'action → nombre. */
export function itemsUsed(used: readonly string[], heroId: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const u of used) {
    const [who, id = ''] = u.split(':')
    if (who === heroId && ITEMS.some((i) => i.action.id === id)) out[id] = (out[id] ?? 0) + 1
  }
  return out
}

/** Demande un jet de dé au joueur. */
export const needsRoll = (a: CombatAction) => a.effect === 'hit' || a.effect === 'flee'

/** Vise un ennemi choisi par le joueur. */
export const needsFoe = (a: CombatAction) => a.effect === 'hit' || a.effect === 'auto'

/** Le son d'une action : arme, sort, soins ou défense (`lib/sound.ts`). */
export function actionSound(id: string | undefined): 'strike' | 'spell' | 'heal' | 'shield' {
  const all = [ATTACK, DEFEND, FLEE, ...Object.values(CLASS_ACTIONS).flat(), ...ITEMS.map((i) => i.action)]
  const action = all.find((a) => a.id === id)
  if (!action) return 'strike'
  if (action.effect === 'heal' || action.effect === 'selfHeal') return 'heal'
  if (action.effect === 'guard' || action.effect === 'dodge') return 'shield'
  if (action.effect === 'auto' || action.effect === 'inspire') return 'spell'
  return action.stat === 'intelligence' || action.stat === 'sagesse' || action.stat === 'charisme' || (action.effect === 'area' && !action.stat)
    ? 'spell'
    : 'strike'
}

/** Nom d'une action, quelle que soit la classe, pour le récit du combat. */
export function actionName(id: string | undefined, lang: 'fr' | 'en'): string {
  const all = [ATTACK, DEFEND, FLEE, ...Object.values(CLASS_ACTIONS).flat(), ...ITEMS.map((i) => i.action)]
  const action = all.find((a) => a.id === id)
  return action ? action[lang] : (id ?? '')
}

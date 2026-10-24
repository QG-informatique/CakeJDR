/**
 * Systèmes de jeu (phase I de `PLAN-CAMPAGNES.md`).
 *
 * Un système décrit ce que la fiche contient et comment on joue : les
 * caractéristiques, les valeurs calculées, les ressources, les types de
 * compétences, les dés et la montée de niveau. La fiche, les tests demandés
 * par le MJ et la montée de niveau lisent ce qu'il faut ici plutôt que dans
 * des listes recopiées.
 *
 * Le MJ choisit le système à la création de la table ; il est rangé dans les
 * réglages de la table (`lib/roomSettings.ts`). Une table sans réglage joue
 * au narratif, comme avant l'existence du choix.
 *
 * Les règles des jeux publiés ne sont reprises que sous leur licence ouverte,
 * avec la mention qu'elle exige (`license`), montrée sur la page des conditions
 * (`app/conditions/page.tsx`, section « Systèmes de jeu »).
 */
import type { TranslationKey } from './translations'
import { DICE_TYPES } from './dicePayload'

export type GameSystemId = 'narratif' | 'srd5' | 'd100'

/** Champ de la fiche, avec son intitulé dans `lib/translations.ts`. */
export type SheetField = { readonly key: string; readonly label: TranslationKey }

/**
 * Ressource qui s'épuisent et remonte : la valeur courante (`key`) et le
 * maximum (`max`), rangés sur la fiche. Sans valeur sur la fiche, elle part
 * de `start` (calculée depuis les caractéristiques), ou de son maximum.
 */
export type SheetResource = {
  readonly key: string
  readonly max: string
  readonly label: TranslationKey
  readonly maxLabel: TranslationKey
  /** Couleur de la barre sur la fiche ; sans elle, selon ce qui reste. */
  readonly bar?: string
  readonly start?: (sheet: Record<string, unknown>) => number
}

export type GameSystem = {
  id: GameSystemId
  /** Nom du système, montré au MJ. */
  name: string
  /** Une ligne pour choisir : à quoi on joue avec. */
  pitch: TranslationKey
  /** Caractéristiques testées par les jets du MJ, dans l'ordre de la fiche. */
  stats: readonly SheetField[]
  /**
   * Ce qu'une caractéristique donne au test : un modificateur ajouté au dé,
   * ou, quand on lance sous un seuil, la chance de réussite en %.
   */
  modRule: { label: TranslationKey; detail: TranslationKey; mod: (value: number) => number }
  /** Valeurs tapées sur la fiche, à côté des caractéristiques. */
  basics: readonly SheetField[]
  /** Modificateurs d'attaque, tapés sur la fiche. */
  attacks: readonly SheetField[]
  /** Intitulés de l'origine et du métier du personnage (champs `race` et `classe`). */
  identity: { race: TranslationKey; classe: TranslationKey }
  /** Ressources qui s'épuisent et remontent ; la première, les PV, reste en tête de fiche. */
  resources: readonly SheetResource[]
  /** Types proposés pour une compétence ; le joueur peut en garder un autre. */
  skillTypes: readonly string[]
  /** Dés de la table, et celui des tests de caractéristique. */
  dice: readonly number[]
  checkDie: number
  /**
   * Test lancé sous un seuil (d100) : réussi si le dé fait au plus le seuil.
   * Sinon, réussi si le dé plus le modificateur atteint la difficulté.
   */
  rollUnder: boolean
  /**
   * Montée de niveau : un dé par cible, dans cet ordre. Une ressource reçoit
   * le dé sur son maximum (et sur sa valeur, sans dépasser) ; une
   * caractéristique, sur sa valeur. Vide : le système n'a pas de niveaux.
   */
  levelUp: readonly string[]
  /**
   * Caractéristiques qui montent à chaque niveau, en plus des PV : un dé
   * chacune, choisies à tour de rôle (`levelUpTargets` de `lib/levelUp.ts`).
   * Sans valeur, chaque cible de `levelUp` reçoit son dé.
   */
  levelUpStats?: number
  /** Bonus qui grandit avec le niveau, montré sur la fiche (bonus de maîtrise). */
  levelBonus?: { label: TranslationKey; value: (level: number) => number }
  /** Mention exigée par la licence des règles reprises, en anglais comme l'original. */
  license?: { lines: readonly string[]; url: string }
}

const SIX_STATS = [
  { key: 'force', label: 'strength' },
  { key: 'dexterite', label: 'dexterity' },
  { key: 'constitution', label: 'constitution' },
  { key: 'intelligence', label: 'intelligence' },
  { key: 'sagesse', label: 'wisdom' },
  { key: 'charisme', label: 'charisma' },
] as const

const ATTACKS = [
  { key: 'mod_contact', label: 'melee' },
  { key: 'mod_distance', label: 'ranged' },
  { key: 'mod_magique', label: 'magic' },
] as const

const HP = { key: 'pv', max: 'pv_max', label: 'hp', maxLabel: 'hpMax' } as const

/**
 * Calculs du modificateur, au choix d'un système créé dans l'atelier
 * (`lib/customSystem.ts`) : le style d20, la valeur × 5 en %, ou la valeur
 * telle quelle (un bonus tapé, ou un seuil déjà en %).
 */
export const MOD_RULES = {
  d20: { label: 'modRulesBase', detail: 'modRulesBaseDetail', mod: (v: number) => Math.floor((v - 10) / 2) },
  x5: { label: 'modRulesD100', detail: 'modRulesD100Detail', mod: (v: number) => v * 5 },
  direct: { label: 'modRulesDirect', detail: 'modRulesDirectDetail', mod: (v: number) => v },
} as const satisfies Record<string, GameSystem['modRule']>

export type ModRuleId = keyof typeof MOD_RULES

const num = (v: unknown) => Number(v) || 0
/** d100 : points de magie égaux au Pouvoir, santé mentale de départ à Pouvoir × 5. */
const MP: SheetResource = { key: 'pm', max: 'pm_max', label: 'magicPoints', maxLabel: 'magicPointsMax', bar: 'bg-sky-500', start: (s) => num(s.pouvoir) }
const SAN: SheetResource = { key: 'san', max: 'san_max', label: 'sanity', maxLabel: 'sanityMax', bar: 'bg-violet-500', start: (s) => num(s.pouvoir) * 5 }

/** Valeur courante et maximum d'une ressource sur cette fiche. */
export function resourceOf(sheet: object, res: SheetResource): { value: number; max: number } {
  const get = (k: string) => Reflect.get(sheet, k) as unknown
  const filled = (v: unknown) => v !== undefined && v !== null && v !== ''
  const start = res.start?.(sheet as Record<string, unknown>)
  const rawMax = get(res.max)
  const rawValue = get(res.key)
  const max = filled(rawMax) ? num(rawMax) : filled(rawValue) ? num(rawValue) : (start ?? 0)
  const value = filled(rawValue) ? num(rawValue) : (start ?? max)
  return { value, max }
}

export const NARRATIF = {
  id: 'narratif',
  name: 'Narratif CakeJDR',
  pitch: 'systemNarratifPitch',
  identity: { race: 'race', classe: 'class' },
  stats: SIX_STATS,
  // La règle de D&D : 10 donne +0, puis ±1 tous les 2 points.
  modRule: { label: 'modRulesBase', detail: 'modRulesBaseDetail', mod: (v: number) => Math.floor((v - 10) / 2) },
  basics: [
    { key: 'defense', label: 'defense' },
    { key: 'chance', label: 'luck' },
    { key: 'initiative', label: 'initiative' },
  ],
  attacks: ATTACKS,
  resources: [HP],
  skillTypes: ['Physique', 'Magique', 'Sociale', 'Technique', 'Spéciale', 'Passive', 'Active'] as readonly string[],
  dice: DICE_TYPES,
  checkDie: 20,
  rollUnder: false,
  levelUp: ['pv', ...SIX_STATS.map((s) => s.key)],
  levelUpStats: 2,
} as const satisfies GameSystem

/**
 * Fantasy héroïque, compatible avec la cinquième édition : les règles du
 * SRD 5.2.1, sous licence CC-BY-4.0. Le nom du jeu d'origine est une marque :
 * la licence autorise seulement « compatible avec la cinquième édition ».
 */
export const SRD5 = {
  id: 'srd5',
  name: 'Fantasy 5E (SRD 5.2)',
  pitch: 'systemSrd5Pitch',
  identity: { race: 'species', classe: 'class' },
  stats: SIX_STATS,
  modRule: { label: 'modRulesSrd5', detail: 'modRulesBaseDetail', mod: (v: number) => Math.floor((v - 10) / 2) },
  basics: [
    { key: 'defense', label: 'armorClass' },
    { key: 'initiative', label: 'initiative' },
  ],
  attacks: ATTACKS,
  resources: [HP],
  skillTypes: ['Action', 'Action bonus', 'Réaction', 'Sort', 'Aptitude de classe', 'Don', 'Passive'] as readonly string[],
  dice: DICE_TYPES,
  checkDie: 20,
  rollUnder: false,
  // On monte d'un dé de vie, que le MJ choisit selon la classe (D6 à D12) ;
  // le modificateur de Constitution s'ajoute à la main.
  levelUp: ['pv'],
  // +2 aux niveaux 1 à 4, puis +1 tous les 4 niveaux.
  levelBonus: { label: 'proficiencyBonus', value: (level: number) => 2 + Math.floor((Math.max(1, level) - 1) / 4) },
  license: {
    lines: [
      'This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.',
    ],
    url: 'https://www.dndbeyond.com/srd',
  },
} as const satisfies GameSystem

const D100_STATS = [
  { key: 'force', label: 'strength' },
  { key: 'constitution', label: 'constitution' },
  { key: 'corpulence', label: 'size' },
  { key: 'intelligence', label: 'intelligence' },
  { key: 'pouvoir', label: 'power' },
  { key: 'dexterite', label: 'dexterity' },
  { key: 'charisme', label: 'charisma' },
] as const

/**
 * Enquête et horreur au d100 : le moteur « Basic Roleplaying: Universal Game
 * Engine », sous licence ORC. Les noms des jeux de l'éditeur sont des marques
 * exclues de la licence : on n'en cite aucun.
 */
export const D100 = {
  id: 'd100',
  name: 'Enquête d100 (BRP)',
  pitch: 'systemD100Pitch',
  identity: { race: 'origin', classe: 'occupation' },
  stats: D100_STATS,
  // Le jet de caractéristique : valeur × 5, en %.
  modRule: { label: 'modRulesD100', detail: 'modRulesD100Detail', mod: (v: number) => v * 5 },
  basics: [
    { key: 'defense', label: 'armorPoints' },
    { key: 'initiative', label: 'initiative' },
    { key: 'chance', label: 'luck' },
  ],
  attacks: ATTACKS,
  resources: [HP, MP, SAN],
  skillTypes: ['Combat', 'Communication', 'Connaissance', 'Perception', 'Physique', 'Technique', 'Occulte'] as readonly string[],
  dice: DICE_TYPES,
  checkDie: 100,
  rollUnder: true,
  // Pas de niveaux : on progresse compétence par compétence, à la main.
  levelUp: [],
  license: {
    lines: [
      'This product is licensed under the ORC License held in the Library of Congress at TX 9-307-067 and available online at various locations including www.chaosium.com/orclicense.',
      'Based on "Basic Roleplaying: Universal Game Engine," copyright © 2024 Chaosium Inc., by Jason Durall and Steve Perrin.',
    ],
    url: 'https://www.chaosium.com/orclicense/',
  },
} as const satisfies GameSystem

export const GAME_SYSTEMS: Record<GameSystemId, GameSystem> = { narratif: NARRATIF, srd5: SRD5, d100: D100 }

/** Dans l'ordre du choix à la création d'une table. */
export const GAME_SYSTEM_IDS = ['narratif', 'srd5', 'd100'] as const satisfies readonly GameSystemId[]

/** Système d'une table qui n'en a pas choisi. */
export const DEFAULT_SYSTEM: GameSystemId = 'narratif'

export function isGameSystemId(value: unknown): value is GameSystemId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(GAME_SYSTEMS, value)
}

/** Le système d'une table ; un identifiant inconnu retombe sur le narratif. */
export function gameSystem(id: unknown): GameSystem {
  return GAME_SYSTEMS[isGameSystemId(id) ? id : DEFAULT_SYSTEM]
}

/** Toutes les caractéristiques connues, tous systèmes confondus. */
export const ALL_STATS: readonly SheetField[] = [
  ...new Map(Object.values(GAME_SYSTEMS).flatMap((s) => s.stats.map((f) => [f.key, f] as const))).values(),
]

/** Dés d'une montée de niveau : un pour les PV, plus un par caractéristique qui monte. */
export function levelUpDice(system: GameSystem): number {
  return system.levelUpStats ? 1 + system.levelUpStats : system.levelUp.length
}

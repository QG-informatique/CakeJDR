/**
 * Systèmes de jeu (phase I de `PLAN-CAMPAGNES.md`).
 *
 * Un système décrit ce que la fiche contient et comment on joue : les
 * caractéristiques, les valeurs calculées, les ressources, les types de
 * compétences, les dés et la montée de niveau. La fiche, les tests demandés
 * par le MJ et la montée de niveau lisent ce qu'il faut ici plutôt que dans
 * des listes recopiées.
 *
 * Un seul système pour l'instant, « Narratif CakeJDR » : la fiche
 * d'aujourd'hui, à l'identique. Les fiches gardent leurs champs actuels
 * (`types/character.ts`) ; le choix du système par table viendra avec une
 * colonne en base, après accord.
 */
import type { TranslationKey } from './translations'
import { DICE_TYPES } from './dicePayload'

export type GameSystemId = 'narratif'

/** Champ de la fiche, avec son intitulé dans `lib/translations.ts`. */
export type SheetField = { readonly key: string; readonly label: TranslationKey }

export type GameSystem = {
  id: GameSystemId
  /** Nom du système, montré au MJ. */
  name: string
  /** Caractéristiques testées par les jets du MJ, dans l'ordre de la fiche. */
  stats: readonly SheetField[]
  /** Comment une caractéristique donne son modificateur. */
  modRule: { label: TranslationKey; detail: TranslationKey; mod: (value: number) => number }
  /** Valeurs tapées sur la fiche, à côté des caractéristiques. */
  basics: readonly SheetField[]
  /** Modificateurs d'attaque, tapés sur la fiche. */
  attacks: readonly SheetField[]
  /** Ressources qui s'épuisent et remontent : valeur courante et maximum. */
  resources: readonly { key: string; max: string; label: TranslationKey }[]
  /** Types proposés pour une compétence ; le joueur peut en garder un autre. */
  skillTypes: readonly string[]
  /** Dés de la table, et celui des tests de caractéristique. */
  dice: readonly number[]
  checkDie: number
  /**
   * Montée de niveau : un dé par cible, dans cet ordre. Une ressource reçoit
   * le dé sur son maximum (et sur sa valeur, sans dépasser) ; une
   * caractéristique, sur sa valeur.
   */
  levelUp: readonly string[]
}

const NARRATIF_STATS = [
  { key: 'force', label: 'strength' },
  { key: 'dexterite', label: 'dexterity' },
  { key: 'constitution', label: 'constitution' },
  { key: 'intelligence', label: 'intelligence' },
  { key: 'sagesse', label: 'wisdom' },
  { key: 'charisme', label: 'charisma' },
] as const

export const NARRATIF = {
  id: 'narratif',
  name: 'Narratif CakeJDR',
  stats: NARRATIF_STATS,
  // La règle de D&D : 10 donne +0, puis ±1 tous les 2 points.
  modRule: { label: 'modRulesBase', detail: 'modRulesBaseDetail', mod: (v: number) => Math.floor((v - 10) / 2) },
  basics: [
    { key: 'defense', label: 'defense' },
    { key: 'chance', label: 'luck' },
    { key: 'initiative', label: 'initiative' },
  ],
  attacks: [
    { key: 'mod_contact', label: 'melee' },
    { key: 'mod_distance', label: 'ranged' },
    { key: 'mod_magique', label: 'magic' },
  ],
  resources: [{ key: 'pv', max: 'pv_max', label: 'hp' }],
  skillTypes: ['Physique', 'Magique', 'Sociale', 'Technique', 'Spéciale', 'Passive', 'Active'] as readonly string[],
  dice: DICE_TYPES,
  checkDie: 20,
  levelUp: ['pv', ...NARRATIF_STATS.map((s) => s.key)],
} as const satisfies GameSystem

export const GAME_SYSTEMS: Record<GameSystemId, GameSystem> = { narratif: NARRATIF }

/** Système d'une table ; toutes les tables jouent au narratif tant que le choix n'existe pas. */
export const DEFAULT_SYSTEM: GameSystemId = 'narratif'

/**
 * Systèmes de jeu créés par un MJ (phase J de `PLAN-CAMPAGNES.md`).
 *
 * Un système perso part d'un preset (`lib/gameSystems.ts`), puis le MJ change
 * tout ce que montre la fiche : les caractéristiques (renommées, retirées ou
 * ajoutées), les valeurs tapées à côté, les attaques, les ressources, les
 * types de compétences, les dés proposés et les intitulés d'identité. Il
 * choisit aussi les règles des tests : le dé, au-dessus ou sous un seuil, le
 * calcul du modificateur, et s'il y a des niveaux.
 *
 * Le système est rangé dans les réglages de la table : le serveur, qui
 * vérifie les tests (`app/api/check/route.ts`), le relit de là. `system.id`
 * reste celui du preset de départ.
 *
 * Les intitulés tapés par le MJ sont du texte libre, rangé tel quel :
 * `useT()` renvoie la clé elle-même quand elle n'a pas de traduction.
 */
import type { TranslationKey } from './translations'
import { DICE_TYPES } from './dicePayload'
import { CUSTOM_STAT_KEY } from './checks'
import {
  GAME_SYSTEMS,
  MOD_RULES,
  isGameSystemId,
  type GameSystem,
  type GameSystemId,
  type ModRuleId,
  type SheetField,
  type SheetResource,
} from './gameSystems'

/** Une ressource ajoutée par le MJ : valeur de départ fixe, couleur de barre au choix. */
export type CustomResource = { key: string; label: string; maxLabel: string; start: number; color: string }

export type CustomSystemData = {
  v: 1
  base: GameSystemId
  name: string
  pitch: string
  /** Caractéristiques : celles gardées du preset, renommées ou non, et celles ajoutées (`s_…`). */
  stats: { key: string; label: string }[]
  /** Valeurs tapées sur la fiche : celles du preset et celles ajoutées (`x_…`). */
  basics: { key: string; label: string }[]
  /** Modificateurs d'attaque tapés sur la fiche : ceux du preset et ceux ajoutés (`x_…`). */
  attacks: { key: string; label: string }[]
  /** Règles des tests. */
  rules: CustomRules
  /** Intitulés des PV, toujours en tête de fiche. */
  hp: { label: string; maxLabel: string }
  /** Ressources en plus des PV. */
  resources: CustomResource[]
  identity: { race: string; classe: string }
  skillTypes: string[]
  dice: number[]
}

export type CustomRules = {
  /** Dé des tests de caractéristique. */
  die: number
  /** Réussi si le dé fait au plus le seuil ; sinon, si dé + modificateur atteint la difficulté. */
  under: boolean
  /** Ce que la valeur de la caractéristique donne au test. */
  mod: ModRuleId
  /** Montée de niveau : les PV, et des caractéristiques quand le système de départ en monte. */
  levels: boolean
}

export const RESOURCE_COLORS = ['bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-slate-500'] as const

export const CUSTOM_LIMITS = { name: 60, pitch: 160, label: 40, stats: 12, basics: 8, attacks: 6, resources: 6, skillTypes: 12 } as const

/** Le calcul du modificateur d'un preset, parmi ceux de l'atelier. */
const presetModRule = (s: GameSystem): ModRuleId => (s.rollUnder ? 'x5' : 'd20')

/** Les règles d'un preset, telles que l'atelier les montre. */
export function presetRules(s: GameSystem): CustomRules {
  return { die: s.checkDie, under: s.rollUnder, mod: presetModRule(s), levels: s.levelUp.length > 0 }
}

const KEY = /^[a-z][a-z0-9_]{0,39}$/

/**
 * Point de départ de l'éditeur : un preset tel qu'il s'affiche, avec ses
 * intitulés traduits dans la langue du MJ.
 */
export function customFromPreset(id: GameSystemId, t: (key: TranslationKey) => string): CustomSystemData {
  const s = GAME_SYSTEMS[id]
  const [hp, ...rest] = s.resources
  return {
    v: 1,
    base: id,
    name: s.name,
    pitch: t(s.pitch),
    stats: s.stats.map((f) => ({ key: f.key, label: t(f.label) })),
    basics: s.basics.map((f) => ({ key: f.key, label: t(f.label) })),
    attacks: s.attacks.map((f) => ({ key: f.key, label: t(f.label) })),
    rules: presetRules(s),
    hp: { label: t(hp?.label ?? 'hp'), maxLabel: t(hp?.maxLabel ?? 'hpMax') },
    resources: rest.map((r, i) => ({
      key: r.key,
      label: t(r.label),
      maxLabel: t(r.maxLabel),
      start: 0,
      color: r.bar ?? RESOURCE_COLORS[i % RESOURCE_COLORS.length]!,
    })),
    identity: { race: t(s.identity.race), classe: t(s.identity.classe) },
    skillTypes: [...s.skillTypes],
    dice: [...s.dice],
  }
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : [])

/**
 * Un système perso venu d'ailleurs (fichier importé, navigateur, base),
 * remis en forme : ce qui manque ou déborde est retiré. `null` si ce n'est
 * pas un système.
 */
export function parseCustomSystem(raw: unknown): CustomSystemData | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (!isGameSystemId(r.base)) return null
  const base = GAME_SYSTEMS[r.base]
  const L = CUSTOM_LIMITS.label
  const field = (v: unknown) => {
    const f = (v ?? {}) as Record<string, unknown>
    return { key: typeof f.key === 'string' ? f.key : '', label: text(f.label, L) }
  }
  const seen = new Set<string>()
  const unique = <T extends { key: string }>(f: T) => !seen.has(f.key) && !!seen.add(f.key)

  const stats = list(r.stats, CUSTOM_LIMITS.stats)
    .map(field)
    .filter((f) => (base.stats.some((s) => s.key === f.key) || CUSTOM_STAT_KEY.test(f.key)) && unique(f))
  const added = (f: { key: string }) => f.key.startsWith('x_') && KEY.test(f.key)
  const basics = list(r.basics, CUSTOM_LIMITS.basics)
    .map(field)
    .filter((f) => (base.basics.some((b) => b.key === f.key) || added(f)) && unique(f))
  // Un système d'avant le choix des attaques garde celles du preset.
  const attacks = Array.isArray(r.attacks)
    ? list(r.attacks, CUSTOM_LIMITS.attacks)
        .map(field)
        .filter((f) => (base.attacks.some((a) => a.key === f.key) || added(f)) && unique(f))
    : base.attacks.map((a) => ({ key: a.key, label: a.label as string }))
  const rawRules = (r.rules ?? {}) as Record<string, unknown>
  const fallback = presetRules(base)
  const rules: CustomRules = {
    die: (DICE_TYPES as readonly unknown[]).includes(rawRules.die) ? (rawRules.die as number) : fallback.die,
    under: typeof rawRules.under === 'boolean' ? rawRules.under : fallback.under,
    mod: typeof rawRules.mod === 'string' && Object.prototype.hasOwnProperty.call(MOD_RULES, rawRules.mod) ? (rawRules.mod as ModRuleId) : fallback.mod,
    levels: typeof rawRules.levels === 'boolean' ? rawRules.levels : fallback.levels,
  }
  const hp = (r.hp ?? {}) as Record<string, unknown>
  const resources = list(r.resources, CUSTOM_LIMITS.resources)
    .map((v) => {
      const o = (v ?? {}) as Record<string, unknown>
      const color = RESOURCE_COLORS.find((c) => c === o.color) ?? RESOURCE_COLORS[0]
      return {
        key: typeof o.key === 'string' ? o.key : '',
        label: text(o.label, L),
        maxLabel: text(o.maxLabel, L),
        start: Math.max(0, Math.min(9999, Math.round(Number(o.start) || 0))),
        color,
      }
    })
    .filter((x) => KEY.test(x.key) && x.key !== 'pv' && unique(x))
  const identity = (r.identity ?? {}) as Record<string, unknown>
  const dice = list(r.dice, DICE_TYPES.length).filter((d): d is number => (DICE_TYPES as readonly unknown[]).includes(d))

  return {
    v: 1,
    base: r.base,
    name: text(r.name, CUSTOM_LIMITS.name) || base.name,
    pitch: text(r.pitch, CUSTOM_LIMITS.pitch),
    stats: stats.length > 0 ? stats : base.stats.map((s) => ({ key: s.key, label: s.label })),
    basics,
    attacks,
    rules,
    hp: { label: text(hp.label, L) || 'hp', maxLabel: text(hp.maxLabel, L) || 'hpMax' },
    resources,
    identity: { race: text(identity.race, L) || base.identity.race, classe: text(identity.classe, L) || base.identity.classe },
    skillTypes: list(r.skillTypes, CUSTOM_LIMITS.skillTypes).map((s) => text(s, L)).filter(Boolean),
    dice: dice.length > 0 ? [...new Set(dice)].sort((a, b) => a - b) : [...base.dice],
  }
}

/** Clé de fiche d'une valeur ou d'une ressource ajoutée, tirée de son intitulé. */
export function newFieldKey(prefix: 'x_' | 'r_' | 's_', label: string, taken: readonly string[]): string {
  const slug = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || 'champ'
  let key = `${prefix}${slug}`
  for (let i = 2; taken.includes(key); i += 1) key = `${prefix}${slug}_${i}`
  return key
}

const asKey = (label: string) => label as TranslationKey

/** Le système joué à la table, construit à partir d'un système perso. */
export function buildSystem(data: CustomSystemData): GameSystem {
  const base = GAME_SYSTEMS[data.base]
  const hpBase = base.resources[0]!
  const resources: SheetResource[] = [
    { ...hpBase, label: asKey(data.hp.label), maxLabel: asKey(data.hp.maxLabel) },
    ...data.resources.map((r) => {
      // Une ressource du preset garde son calcul de départ ; une ressource
      // ajoutée part de la valeur choisie par le MJ.
      const preset = base.resources.find((p) => p.key === r.key)
      return {
        key: r.key,
        max: preset?.max ?? `${r.key}_max`,
        label: asKey(r.label),
        maxLabel: asKey(r.maxLabel),
        bar: r.color,
        ...(preset?.start && !r.start ? { start: preset.start } : { start: () => r.start }),
      }
    }),
  ]
  const field = (f: { key: string; label: string }): SheetField => ({ key: f.key, label: asKey(f.label) })
  const { rules } = data
  // Le calcul du preset garde son nom (règle de la cinquième édition…).
  const modRule = rules.mod === presetModRule(base) ? base.modRule : MOD_RULES[rules.mod]
  return {
    ...base,
    name: data.name,
    pitch: asKey(data.pitch),
    stats: data.stats.map(field),
    modRule,
    basics: data.basics.map(field),
    attacks: data.attacks.map(field),
    resources,
    identity: { race: asKey(data.identity.race), classe: asKey(data.identity.classe) },
    skillTypes: data.skillTypes.length > 0 ? data.skillTypes : base.skillTypes,
    dice: data.dice,
    checkDie: rules.die,
    rollUnder: rules.under,
    ...levelRules(base, data),
  }
}

/**
 * Montée de niveau d'un système perso. Sans niveaux : rien. Un preset qui
 * monte des caractéristiques (le narratif) les monte parmi celles de la fiche,
 * ajoutées comprises ; un preset qui ne monte que les PV (la 5E) le reste ; un
 * preset sans niveaux (le d100) en reçoit à la façon du narratif.
 */
function levelRules(base: GameSystem, data: CustomSystemData): Pick<GameSystem, 'levelUp' | 'levelUpStats' | 'levelBonus'> {
  if (!data.rules.levels) return { levelUp: [], levelUpStats: undefined, levelBonus: undefined }
  const stats = data.stats.map((s) => s.key)
  const climbing = base.levelUpStats ?? (base.levelUp.length === 0 ? 2 : 0)
  if (!climbing) return { levelUp: base.levelUp, levelUpStats: undefined, levelBonus: base.levelBonus }
  return { levelUp: ['pv', ...stats], levelUpStats: Math.min(climbing, stats.length), levelBonus: base.levelBonus }
}

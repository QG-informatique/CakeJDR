/**
 * Rôle d'une caractéristique, d'un système à l'autre.
 *
 * Les aventures du MJ automatique, les héros tout prêts et les classes de la
 * création guidée parlent des six caractéristiques du narratif (force,
 * dextérité…). Sur une table qui en a d'autres (le d100, un système de
 * l'atelier), chaque caractéristique reçoit le rôle le plus proche : celui
 * que le MJ lui a donné, sa clé si elle est la même, ou un mot de son
 * intitulé (« Agilité » tient le rôle de la dextérité, « Pouvoir » celui de
 * la sagesse).
 */
import type { GameSystem } from './gameSystems'

export const STAT_ROLES = ['force', 'dexterite', 'constitution', 'intelligence', 'sagesse', 'charisme'] as const
export type StatRole = (typeof STAT_ROLES)[number]

export const isStatRole = (v: unknown): v is StatRole => (STAT_ROLES as readonly unknown[]).includes(v)

/** Mots qui trahissent un rôle, sans accents, en français et en anglais. */
const WORDS: Record<StatRole, readonly string[]> = {
  force: ['force', 'strength', 'muscle', 'puissance', 'vigueur', 'brawn', 'might', 'physique', 'corpulence', 'size'],
  dexterite: ['dexterite', 'dexterity', 'agilite', 'agility', 'reflexes', 'adresse', 'finesse', 'cool', 'vitesse', 'quickness'],
  constitution: ['constitution', 'endurance', 'sante', 'health', 'stamina', 'toughness', 'resistance', 'hard', 'vitalite', 'vitality'],
  intelligence: ['intelligence', 'education', 'savoir', 'logique', 'reason', 'smarts', 'sharp', 'intellect', 'erudition', 'knowledge', 'esprit', 'mind'],
  sagesse: ['sagesse', 'wisdom', 'pouvoir', 'power', 'perception', 'volonte', 'will', 'wits', 'spirit', 'intuition', 'weird', 'instinct', 'foi', 'faith'],
  charisme: ['charisme', 'charisma', 'presence', 'apparence', 'appearance', 'manipulation', 'charm', 'hot', 'social', 'eloquence', 'aura'],
}

const tokens = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

/** Rôle d'une caractéristique : celui qu'elle déclare, sa clé, ou un mot de son intitulé. */
export function roleOf(field: { key: string; label?: string; role?: string }): StatRole | null {
  if (isStatRole(field.role)) return field.role
  if (isStatRole(field.key)) return field.key
  const words = [...tokens(field.key.replace(/^[a-z]_/, '')), ...tokens(field.label ?? '')]
  for (const role of STAT_ROLES) {
    if (WORDS[role].some((w) => words.some((t) => t === w || (w.length >= 5 && t.startsWith(w))))) return role
  }
  return null
}

/** La caractéristique du système qui tient ce rôle ; à défaut, la première. */
export function roleStat(system: GameSystem, role: StatRole): string {
  const stats = system.stats
  const found =
    stats.find((s) => s.role === role) ??
    stats.find((s) => s.key === role) ??
    stats.find((s) => !isStatRole(s.role) && roleOf({ key: s.key, label: s.label }) === role)
  return (found ?? stats[0])?.key ?? 'force'
}

/**
 * La caractéristique testée à la table pour celle qu'une aventure demande :
 * elle-même si le système la connaît (caractéristique ou compétence), sinon
 * celle qui tient son rôle.
 */
export function tableStat(system: GameSystem, stat: string): string {
  if (system.stats.some((s) => s.key === stat) || system.skills?.some((s) => s.key === stat)) return stat
  return roleStat(system, roleOf({ key: stat }) ?? 'force')
}

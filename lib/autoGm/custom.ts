/**
 * Campagnes écrites par un MJ dans l'atelier (phase J de `PLAN-CAMPAGNES.md`).
 *
 * Une campagne perso a le même format qu'une aventure toute prête
 * (`./types.ts`) : le MJ automatique la déroule de la même façon. Elle est
 * rangée sur le compte du MJ (`creations`), puis copiée dans la salle
 * (`customAdventure` du stockage Liveblocks) quand il la lance.
 *
 * Elle a tout ce qu'ont les aventures toutes prêtes : votes avec choix
 * conditionnés, jets, tirages au hasard, épreuves en plusieurs jets, combats
 * au tour par tour, pions sur le plateau, et en arrivant dans une scène des
 * marques gagnées, des dégâts, des soins et du butin. Les difficultés
 * s'écrivent pour le d20 (10 normal, 15 difficile) : chaque table les
 * traduit dans son système (`./tableCheck.ts`).
 */
import { ALL_STATS, isGameSystemId } from '@/lib/gameSystems'
import { CUSTOM_SKILL_KEY, CUSTOM_STAT_KEY, type CheckStat } from '@/lib/checks'
import type { ActionKind } from '@/lib/backgrounds'
import { isDice } from './combat'
import type { MusicMood } from './music'
import type { Adventure, Foe, RandomOutcome, Scene, SceneOption, ScenePiece, SceneSetup, SceneStep } from './types'

export const CAMPAIGN_LIMITS = {
  title: 120,
  pitch: 300,
  scenes: 250,
  paragraphs: 20,
  paragraph: 2000,
  gmNotes: 3000,
  clues: 10,
  clue: 300,
  options: 6,
  label: 160,
  pieces: 12,
  foes: 8,
  loot: 6,
  gains: 8,
  /** Difficulté sur l'échelle du d20 : 30, presque impossible. */
  dc: 30,
  foeHp: 200,
  foeDefense: 30,
  foeAttack: 15,
  foeAttacks: 4,
  damage: 20,
  heal: 50,
  tries: 10,
  lootCount: 9,
} as const

/** Genres d'action d'un jet : le héros dont l'historique y correspond a un bonus. */
export const ACTION_KINDS: readonly ActionKind[] = ['combat', 'discretion', 'parole', 'ruse', 'savoir', 'nature', 'foi', 'effort']

/** Une marque gagnée dans une scène, qui ouvre ou ferme des choix plus loin. */
export const FLAG = /^[a-z0-9_-]{1,40}$/

/** Les campagnes perso ont un identifiant à part : jamais celui d'une aventure toute prête. */
export const CUSTOM_PREFIX = 'perso-'

export const isCustomAdventureId = (id: unknown): id is string => typeof id === 'string' && id.startsWith(CUSTOM_PREFIX)

export const MUSIC_MOODS: readonly MusicMood[] = ['voyage', 'taverne', 'village', 'foret', 'donjon', 'combat', 'boss', 'victoire', 'triste']

const ID = /^[\w-]{1,60}$/
const LIBRARY_ID = /^[a-z0-9-]{1,80}$/
const SYSTEM_REF = /^[\w-]{1,80}$/

/** Une image de la bibliothèque, ou une image envoyée par le MJ sur Cloudinary. */
export const isCampaignImage = (v: unknown): v is string =>
  typeof v === 'string' && (LIBRARY_ID.test(v) || (v.startsWith('https://res.cloudinary.com/') && v.length <= 400))

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : [])
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const id = (v: unknown) => (typeof v === 'string' && ID.test(v) ? v : '')
const flag = (v: unknown) => (typeof v === 'string' && FLAG.test(v) ? v : '')
const int = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) && v !== '' && v !== null ? Math.max(lo, Math.min(hi, n)) : fallback
}
const frac = (v: unknown, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? Math.max(0, Math.min(1, Math.round(n * 1000) / 1000)) : fallback
}
/** Nombre d'attaques par tour, entre 1 et le maximum. */
const frac2 = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(1, Math.min(CAMPAIGN_LIMITS.foeAttacks, v)) : 1)
const dc = (v: unknown) => int(v, 1, CAMPAIGN_LIMITS.dc, 10)

/** Une caractéristique testée : celle d'un système tout prêt (son rôle), ou une clé d'un système de l'atelier. */
export const isCampaignStat = (v: unknown): v is CheckStat =>
  typeof v === 'string' && (ALL_STATS.some((s) => s.key === v) || CUSTOM_STAT_KEY.test(v) || CUSTOM_SKILL_KEY.test(v))

const action = (v: unknown) => (ACTION_KINDS.includes(v as ActionKind) ? { action: v as ActionKind } : {})

/** Marque à gagner ou à avoir, posée seulement si elle est valable. */
const conds = (o: Record<string, unknown>) => ({
  ...(flag(o.needs) ? { needs: flag(o.needs) } : {}),
  ...(flag(o.unless) ? { unless: flag(o.unless) } : {}),
})

/** Une nouvelle campagne : une scène d'ouverture et une fin. */
export function emptyCampaign(): Adventure {
  return {
    id: `${CUSTOM_PREFIX}${crypto.randomUUID().slice(0, 8)}`,
    title: '',
    pitch: '',
    start: 'debut',
    scenes: {
      debut: { id: 'debut', title: '', narration: [''], step: { kind: 'continue', next: 'fin' } },
      fin: { id: 'fin', title: '', narration: [''], step: { kind: 'end', title: '' } },
    },
  }
}

function parseSetup(raw: unknown): SceneSetup | undefined {
  const r = obj(raw)
  const setup: SceneSetup = {}
  if (isCampaignImage(r.map)) setup.map = r.map
  const seen = new Set<string>()
  const pieces: ScenePiece[] = list(r.pieces, CAMPAIGN_LIMITS.pieces)
    .map(obj)
    .filter((p) => id(p.id) && !seen.has(p.id as string) && !!seen.add(p.id as string))
    .filter((p) => typeof p.category === 'string' && LIBRARY_ID.test(p.category) && typeof p.item === 'string' && LIBRARY_ID.test(p.item))
    .map((p) => ({
      id: id(p.id),
      category: p.category as string,
      item: p.item as string,
      x: frac(p.x, 0.4),
      y: frac(p.y, 0.4),
      width: Math.max(0.03, frac(p.width, 0.15)),
      height: Math.max(0.03, frac(p.height, 0.15)),
    }))
  if (pieces.length > 0) setup.pieces = pieces
  const show = obj(r.show)
  if (isCampaignImage(show.item) && typeof show.category === 'string' && LIBRARY_ID.test(show.category))
    setup.show = { category: show.category, item: show.item, label: text(show.label, CAMPAIGN_LIMITS.label) }
  if (MUSIC_MOODS.includes(r.music as MusicMood)) setup.music = r.music as MusicMood
  return Object.keys(setup).length > 0 ? setup : undefined
}

function parseStep(raw: unknown, scenes: ReadonlySet<string>, pieces: ReadonlySet<string>): SceneStep {
  const r = obj(raw)
  const next = (v: unknown) => (typeof v === 'string' && scenes.has(v) ? v : '')
  const L = CAMPAIGN_LIMITS.label
  const C = CAMPAIGN_LIMITS
  if (r.kind === 'continue' && next(r.next)) return { kind: 'continue', next: next(r.next), ...(text(r.label, L) ? { label: text(r.label, L) } : {}) }
  if (r.kind === 'random') {
    const outcomes = list(r.outcomes, CAMPAIGN_LIMITS.options)
      .map(obj)
      .filter((o) => next(o.next))
      .map((o): RandomOutcome => ({ next: next(o.next), ...(Number(o.weight) > 0 ? { weight: Math.min(100, Math.round(Number(o.weight))) } : {}), ...conds(o) }))
    if (outcomes.length > 0) return { kind: 'random', outcomes, ...(text(r.label, L) ? { label: text(r.label, L) } : {}) }
  }
  if (r.kind === 'vote') {
    const seen = new Set<string>()
    const options: SceneOption[] = list(r.options, CAMPAIGN_LIMITS.options)
      .map(obj)
      .filter((o) => id(o.id) && next(o.next) && !seen.has(o.id as string) && !!seen.add(o.id as string))
      .map((o) => ({ id: id(o.id), label: text(o.label, L) || '…', next: next(o.next), ...conds(o), ...(text(o.note, L) ? { note: text(o.note, L) } : {}) }))
    if (options.length > 0) return { kind: 'vote', prompt: text(r.prompt, L), options }
  }
  if (r.kind === 'check' && isCampaignStat(r.stat) && next(r.success) && next(r.failure)) {
    return {
      kind: 'check',
      prompt: text(r.prompt, L),
      stat: r.stat,
      dc: dc(r.dc),
      ...action(r.action),
      reason: text(r.reason, L) || text(r.prompt, L) || '…',
      success: next(r.success),
      failure: next(r.failure),
    }
  }
  if (r.kind === 'trial' && isCampaignStat(r.stat) && next(r.best) && next(r.fail)) {
    const tries = int(r.tries, 1, C.tries, 3)
    const need = int(r.need, 1, tries, Math.min(2, tries))
    const middle = next(r.middle)
    return {
      kind: 'trial',
      prompt: text(r.prompt, L),
      stat: r.stat,
      dc: dc(r.dc),
      ...action(r.action),
      reason: text(r.reason, L) || text(r.prompt, L) || '…',
      need,
      tries,
      best: next(r.best),
      ...(middle ? { middle, middleAt: int(r.middleAt, 1, need, Math.max(1, need - 1)) } : {}),
      fail: next(r.fail),
    }
  }
  if (r.kind === 'combat' && next(r.victory) && next(r.defeat)) {
    const seen = new Set<string>()
    const foes: Foe[] = list(r.foes, C.foes)
      .map(obj)
      .filter((f) => id(f.id) && !seen.has(f.id as string) && !!seen.add(f.id as string))
      .map((f) => {
        // 1,5 : une attaque, puis deux, en alternance.
        const attacks = Math.round(frac2(f.attacks) * 100) / 100
        const piece = id(f.piece)
        return {
          id: id(f.id),
          name: text(f.name, L) || '…',
          hp: int(f.hp, 1, C.foeHp, 6),
          defense: int(f.defense, 1, C.foeDefense, 10),
          attack: int(f.attack, -5, C.foeAttack, 2),
          damage: typeof f.damage === 'string' && isDice(f.damage) ? f.damage.replace(/\s+/g, '').toLowerCase().slice(0, 20) : '1d6',
          ...(attacks > 1 ? { attacks } : {}),
          ...(piece && pieces.has(piece) ? { piece } : {}),
        }
      })
    const flee = obj(r.flee)
    if (foes.length > 0)
      return {
        kind: 'combat',
        prompt: text(r.prompt, L),
        foes,
        victory: next(r.victory),
        defeat: next(r.defeat),
        ...(next(flee.next) && isCampaignStat(flee.stat) ? { flee: { next: next(flee.next), stat: flee.stat, dc: dc(flee.dc) } } : {}),
      }
  }
  return { kind: 'end', title: text(r.title, L) }
}

/**
 * Une campagne venue d'ailleurs (fichier importé, base, stockage de la salle),
 * remise en forme : ce qui manque ou déborde est retiré, une suite qui mène
 * vers une scène absente termine l'aventure. `null` si ce n'est pas une campagne.
 */
export function parseCampaign(raw: unknown): Adventure | null {
  const r = obj(raw)
  if (!isCustomAdventureId(r.id) || !ID.test(r.id)) return null
  const C = CAMPAIGN_LIMITS
  const rawScenes = Object.values(obj(r.scenes)).slice(0, C.scenes).map(obj)
  const ids = new Set(rawScenes.map((s) => id(s.id)).filter(Boolean))
  if (ids.size === 0) return null
  // Un pion posé dans une scène reste sur le plateau : un combat plus loin peut s'en servir.
  const pieces = new Set(rawScenes.flatMap((s) => parseSetup(s.setup)?.pieces?.map((p) => p.id) ?? []))
  const scenes: Record<string, Scene> = {}
  for (const s of rawScenes) {
    const sid = id(s.id)
    if (!sid || scenes[sid]) continue
    const narration = list(s.narration, C.paragraphs).map((p) => text(p, C.paragraph)).filter(Boolean)
    const clues = list(s.clues, C.clues)
      .map(obj)
      .filter((c) => id(c.id) && text(c.text, C.clue))
      .map((c) => ({ id: id(c.id), text: text(c.text, C.clue) }))
    const setup = parseSetup(s.setup)
    const chapter = text(s.chapter, C.label)
    const gmNotes = text(s.gmNotes, C.gmNotes)
    const gains = [...new Set(list(s.gains, C.gains).map(flag).filter(Boolean))]
    const damage = int(s.damage, 0, C.damage, 0)
    const heal = s.heal === true ? true : int(s.heal, 0, C.heal, 0)
    // Une campagne n'est écrite que dans une langue : le même nom dans les deux.
    const loot = list(s.loot, C.loot)
      .map(obj)
      .map((l) => {
        const name = text(l.fr, C.label) || text(l.en, C.label)
        const n = int(l.n, 1, C.lootCount, 1)
        return { fr: name, en: text(l.en, C.label) || name, ...(n > 1 ? { n } : {}) }
      })
      .filter((l) => l.fr)
    scenes[sid] = {
      id: sid,
      title: text(s.title, C.label),
      ...(chapter ? { chapter } : {}),
      narration: narration.length > 0 ? narration : [''],
      ...(gmNotes ? { gmNotes } : {}),
      ...(clues.length > 0 ? { clues } : {}),
      ...(setup ? { setup } : {}),
      ...(gains.length > 0 ? { gains } : {}),
      ...(damage ? { damage } : {}),
      ...(heal ? { heal } : {}),
      ...(loot.length > 0 ? { loot } : {}),
      step: parseStep(s.step, ids, pieces),
    }
  }
  const start = typeof r.start === 'string' && scenes[r.start] ? r.start : Object.keys(scenes)[0]!
  const system = typeof r.system === 'string' && (isGameSystemId(r.system) || SYSTEM_REF.test(r.system)) ? r.system : ''
  return { id: r.id, title: text(r.title, C.title), pitch: text(r.pitch, C.pitch), start, scenes, ...(system ? { system } : {}) }
}

/** Marques gagnées quelque part dans la campagne, pour les choix qui en dépendent. */
export function campaignFlags(adventure: Adventure): string[] {
  return [...new Set(Object.values(adventure.scenes).flatMap((s) => s.gains ?? []))]
}

/** Scènes vers lesquelles mène une étape. */
export function nextScenes(step: SceneStep): string[] {
  switch (step.kind) {
    case 'continue':
      return [step.next]
    case 'random':
      return step.outcomes.map((o) => o.next)
    case 'vote':
      return step.options.map((o) => o.next)
    case 'check':
      return [step.success, step.failure]
    case 'combat':
      return [step.victory, step.defeat, ...(step.flee ? [step.flee.next] : [])]
    case 'trial':
      return [step.best, step.fail, ...(step.middle ? [step.middle] : [])]
    default:
      return []
  }
}

/** Images envoyées par le MJ dans une campagne (à garder quand on fait le ménage sur Cloudinary). */
export function campaignImages(adventure: Adventure | null | undefined): string[] {
  if (!adventure) return []
  const urls: string[] = []
  for (const scene of Object.values(adventure.scenes)) {
    for (const v of [scene.setup?.map, scene.setup?.show?.item]) if (v?.startsWith('https://')) urls.push(v)
  }
  return urls
}

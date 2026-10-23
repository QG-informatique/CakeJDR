/**
 * Campagnes écrites par un MJ dans l'atelier (phase J de `PLAN-CAMPAGNES.md`).
 *
 * Une campagne perso a le même format qu'une aventure toute prête
 * (`./types.ts`) : le MJ automatique la déroule de la même façon. Elle est
 * rangée sur le compte du MJ (`creations`), puis copiée dans la salle
 * (`customAdventure` du stockage Liveblocks) quand il la lance.
 *
 * L'éditeur propose les étapes « Continuer », vote, jet et fin ; un fichier
 * importé peut aussi contenir un tirage au hasard. Les combats et les
 * épreuves restent réservés aux aventures toutes prêtes.
 */
import { ALL_STATS } from '@/lib/gameSystems'
import { CHECK_THRESHOLD_MAX } from '@/lib/checks'
import type { MusicMood } from './music'
import type { Adventure, Scene, SceneOption, SceneSetup, SceneStep } from './types'

export const CAMPAIGN_LIMITS = {
  title: 120,
  pitch: 300,
  scenes: 100,
  paragraphs: 20,
  paragraph: 2000,
  gmNotes: 3000,
  clues: 10,
  clue: 300,
  options: 6,
  label: 160,
} as const

/** Les campagnes perso ont un identifiant à part : jamais celui d'une aventure toute prête. */
export const CUSTOM_PREFIX = 'perso-'

export const isCustomAdventureId = (id: unknown): id is string => typeof id === 'string' && id.startsWith(CUSTOM_PREFIX)

export const MUSIC_MOODS: readonly MusicMood[] = ['voyage', 'taverne', 'village', 'foret', 'donjon', 'combat', 'boss', 'victoire', 'triste']

const ID = /^[\w-]{1,60}$/
const LIBRARY_ID = /^[a-z0-9-]{1,80}$/

/** Une image de la bibliothèque, ou une image envoyée par le MJ sur Cloudinary. */
export const isCampaignImage = (v: unknown): v is string =>
  typeof v === 'string' && (LIBRARY_ID.test(v) || (v.startsWith('https://res.cloudinary.com/') && v.length <= 400))

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const list = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : [])
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {})
const id = (v: unknown) => (typeof v === 'string' && ID.test(v) ? v : '')

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
  const show = obj(r.show)
  if (isCampaignImage(show.item) && typeof show.category === 'string' && LIBRARY_ID.test(show.category))
    setup.show = { category: show.category, item: show.item, label: text(show.label, CAMPAIGN_LIMITS.label) }
  if (MUSIC_MOODS.includes(r.music as MusicMood)) setup.music = r.music as MusicMood
  return Object.keys(setup).length > 0 ? setup : undefined
}

function parseStep(raw: unknown, scenes: ReadonlySet<string>): SceneStep {
  const r = obj(raw)
  const next = (v: unknown) => (typeof v === 'string' && scenes.has(v) ? v : '')
  const L = CAMPAIGN_LIMITS.label
  if (r.kind === 'continue' && next(r.next)) return { kind: 'continue', next: next(r.next), ...(text(r.label, L) ? { label: text(r.label, L) } : {}) }
  if (r.kind === 'random') {
    const outcomes = list(r.outcomes, CAMPAIGN_LIMITS.options)
      .map(obj)
      .filter((o) => next(o.next))
      .map((o) => ({ next: next(o.next), ...(Number(o.weight) > 0 ? { weight: Math.min(100, Math.round(Number(o.weight))) } : {}) }))
    if (outcomes.length > 0) return { kind: 'random', outcomes, ...(text(r.label, L) ? { label: text(r.label, L) } : {}) }
  }
  if (r.kind === 'vote') {
    const seen = new Set<string>()
    const options: SceneOption[] = list(r.options, CAMPAIGN_LIMITS.options)
      .map(obj)
      .filter((o) => id(o.id) && next(o.next) && !seen.has(o.id as string) && !!seen.add(o.id as string))
      .map((o) => ({ id: id(o.id), label: text(o.label, L) || '…', next: next(o.next) }))
    if (options.length > 0) return { kind: 'vote', prompt: text(r.prompt, L), options }
  }
  if (r.kind === 'check' && ALL_STATS.some((s) => s.key === r.stat) && next(r.success) && next(r.failure)) {
    return {
      kind: 'check',
      prompt: text(r.prompt, L),
      stat: r.stat as Extract<SceneStep, { kind: 'check' }>['stat'],
      dc: Math.max(1, Math.min(CHECK_THRESHOLD_MAX, Math.round(Number(r.dc) || 10))),
      reason: text(r.reason, L) || text(r.prompt, L) || '…',
      success: next(r.success),
      failure: next(r.failure),
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
    scenes[sid] = {
      id: sid,
      title: text(s.title, C.label),
      ...(chapter ? { chapter } : {}),
      narration: narration.length > 0 ? narration : [''],
      ...(gmNotes ? { gmNotes } : {}),
      ...(clues.length > 0 ? { clues } : {}),
      ...(setup ? { setup } : {}),
      step: parseStep(s.step, ids),
    }
  }
  const start = typeof r.start === 'string' && scenes[r.start] ? r.start : Object.keys(scenes)[0]!
  return { id: r.id, title: text(r.title, C.title), pitch: text(r.pitch, C.pitch), start, scenes }
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

/**
 * MJ automatique : les aventures disponibles et les règles du vote.
 *
 * Le déroulé (qui met en place le plateau, qui tranche) vit dans
 * `components/autogm/AutoGmPanel.tsx` ; ici, seulement ce qui se calcule sans
 * Liveblocks, pour rester lisible et vérifiable.
 */
import { CAKE_DEMO } from './cakeDemo'
import { DRAGON_CAMPAIGN } from './dragonCampaign'
import { CAKE_DEMO_EN } from './en/cakeDemo'
import { DRAGON_CAMPAIGN_EN } from './en/dragonCampaign'
import { actionBonus, type ActionKind } from '@/lib/backgrounds'
import type { Adventure, AdventureText, AutoGmMode, RandomOutcome, Scene, SceneOption, SceneStep } from './types'

export type { Adventure, AdventureText, Scene, SceneOption } from './types'
export { estimateDuration, formatMinutes } from './duration'

export const ADVENTURES: Record<string, Adventure> = {
  [CAKE_DEMO.id]: CAKE_DEMO,
  [DRAGON_CAMPAIGN.id]: DRAGON_CAMPAIGN,
}

/** Textes anglais de chaque aventure ; une scène sans traduction reste en français. */
export const ENGLISH: Record<string, AdventureText> = {
  [CAKE_DEMO.id]: CAKE_DEMO_EN,
  [DRAGON_CAMPAIGN.id]: DRAGON_CAMPAIGN_EN,
}

/** L'aventure avec les textes d'une autre langue posés sur ses scènes. */
export function withText(adventure: Adventure, text: AdventureText): Adventure {
  const scenes: Record<string, Scene> = {}
  for (const [id, scene] of Object.entries(adventure.scenes)) {
    const tx = text.scenes[id]
    if (!tx) {
      scenes[id] = scene
      continue
    }
    const step = scene.step
    let translated: SceneStep = step
    if (step.kind === 'continue' || step.kind === 'random') translated = { ...step, label: tx.label ?? step.label }
    else if (step.kind === 'vote')
      translated = { ...step, prompt: tx.prompt ?? step.prompt, options: step.options.map((o) => ({ ...o, label: tx.options?.[o.id] ?? o.label, ...(o.note ? { note: tx.notes?.[o.id] ?? o.note } : {}) })) }
    else if (step.kind === 'check' || step.kind === 'trial') translated = { ...step, prompt: tx.prompt ?? step.prompt, reason: tx.reason ?? step.reason }
    else if (step.kind === 'combat')
      translated = { ...step, prompt: tx.prompt ?? step.prompt, foes: step.foes.map((f) => ({ ...f, name: tx.foes?.[f.id] ?? f.name })) }
    else translated = { ...step, title: tx.end ?? step.title }
    const show = scene.setup?.show
    scenes[id] = {
      ...scene,
      title: tx.title,
      chapter: tx.chapter ?? scene.chapter,
      narration: tx.narration,
      gmNotes: tx.gmNotes ?? scene.gmNotes,
      ...(scene.clues ? { clues: scene.clues.map((c) => ({ ...c, text: tx.clues?.[c.id] ?? c.text })) } : {}),
      ...(show && scene.setup ? { setup: { ...scene.setup, show: { ...show, label: tx.show ?? show.label } } } : {}),
      step: translated,
    }
  }
  return { ...adventure, title: text.title, pitch: text.pitch, scenes }
}

const inEnglish = new Map<string, Adventure>()

/**
 * L'aventure toute prête, ou la campagne écrite par le MJ (`./custom.ts`)
 * quand c'est elle que la salle joue.
 */
export function adventureOf(id: string, custom?: Adventure | null): Adventure | undefined {
  return custom && custom.id === id ? custom : ADVENTURES[id]
}

/**
 * L'aventure dans la langue de l'interface. Une campagne perso reste dans la
 * langue où son MJ l'a écrite.
 */
export function adventureIn(id: string, lang: 'en' | 'fr', custom?: Adventure | null): Adventure | undefined {
  if (custom && custom.id === id) return custom
  const adventure = ADVENTURES[id]
  const text = ENGLISH[id]
  if (!adventure || lang === 'fr' || !text) return adventure
  let done = inEnglish.get(id)
  if (!done) {
    done = withText(adventure, text)
    inEnglish.set(id, done)
  }
  return done
}

/**
 * Début d'une partie : première scène, rien encore mis en place. Les votes,
 * une `LiveMap`, sont ajoutés par l'appelant (navigateur ou serveur).
 * `lobby` : on attend d'abord que chacun ait réglé le son et soit prêt.
 */
export function startState(adventure: Adventure, mode: AutoGmMode, lobby = true, newHeroes = false) {
  const run = crypto.randomUUID()
  return {
    ...(lobby ? { lobby: true, ready: [] as string[] } : {}),
    ...(newHeroes ? { heroRun: run } : {}),
    run,
    adventure: adventure.id,
    mode,
    scene: adventure.start,
    visit: 1,
    setup: 0,
    path: [adventure.start],
    flags: [...(adventure.scenes[adventure.start]?.gains ?? [])],
  }
}

/** Aventure lancée dans la salle de démonstration. */
export const DEMO_ADVENTURE = CAKE_DEMO.id

/** Le vote se termine au plus tard ce délai après le premier vote. */
export const VOTE_WINDOW_MS = 45_000
/** Quand tout le monde a voté, un court délai pour changer d'avis. */
export const VOTE_SETTLE_MS = 1_500
/** Après un jet, le temps de lire le résultat avant la scène suivante. */
export const CHECK_READ_MS = 2_000
/** Demande de jet disparue sans résultat : annulée seulement après ce délai (le résultat peut la suivre de près). */
export const CANCEL_GRACE_MS = 4_000

/** Vote « sans avis » : compté comme présent, mais pour aucune option. */
export const NEUTRAL = 'neutral'

/** Un joueur présent, tel que le MJ automatique le voit. */
export type Voter = {
  id: string
  connectionId: number
  /** Nom du personnage, ou pseudo à défaut. */
  name: string
  /** Pseudo, pour l'initiale de la bulle (comme la rangée des joueurs en ligne). */
  pseudo: string
  color: string
  gm: boolean
  /** Score ramené au d20 par caractéristique (rôle et clé du système), équipement compris. */
  mods: Record<string, number>
  /** Ce que la fiche donne à chaque test dans le système de la table (`lib/autoGm/tableCheck.ts`). */
  tests?: import('./tableCheck').SheetTests
  /** Valeur brute du Charisme, pour départager deux modificateurs égaux. */
  charisma: number
  /** A une fiche nommée : un joueur encore en création n'est pas appelé à lancer. */
  hero?: boolean
  /** Historique du héros (`lib/backgrounds.ts`). */
  historique?: string
  /** Classe du héros : ses dés de niveau et ses actions en combat. */
  classe?: string
  /** Expérience et niveau, pour la montée de niveau automatique (`lib/xp.ts`). */
  xp?: number
  level?: number
  /** PV, défense et dégâts d'arme de la fiche, pour le combat (`lib/autoGm/combat.ts`). */
  hp?: number
  maxHp?: number
  defense?: number
  weapon?: string
  /** Objets du sac utilisables en combat (`itemCounts`). */
  items?: Record<string, number>
}

/**
 * Options proposées dans la scène : celles qui demandent un indice pas encore
 * trouvé sont cachées, comme celles qu'un indice déjà gagné a fermées.
 */
export function availableOptions(scene: Scene, flags: readonly string[]): SceneOption[] {
  if (scene.step.kind !== 'vote') return []
  return scene.step.options.filter((o) => (!o.needs || flags.includes(o.needs)) && (!o.unless || !flags.includes(o.unless)))
}

/** Ce qu'un choix annonce aux joueurs : le genre d'épreuve qui les attend. */
export type OptionHint =
  | { kind: 'check'; stat: string }
  | { kind: 'combat' }
  | { kind: 'random' }
  | { kind: 'choice' }
  | { kind: 'unknown' }

/**
 * Genre de la prochaine épreuve après un choix : on suit les scènes de simple
 * récit (quelques-unes au plus) jusqu'au premier jet, combat, tirage ou vote.
 */
export function optionHint(adventure: Adventure, next: string): OptionHint {
  let id = next
  for (let hop = 0; hop < 5; hop += 1) {
    const step = adventure.scenes[id]?.step
    if (!step) break
    if (step.kind === 'check' || step.kind === 'trial') return { kind: 'check', stat: step.stat }
    if (step.kind === 'combat') return { kind: 'combat' }
    if (step.kind === 'random') return { kind: 'random' }
    if (step.kind === 'vote') return { kind: 'choice' }
    if (step.kind !== 'continue') break
    id = step.next
  }
  return { kind: 'unknown' }
}

type TrialStep = Extract<SceneStep, { kind: 'trial' }>

/**
 * Suite d'une épreuve après `ok` réussites et `ko` échecs, ou rien tant qu'il
 * faut encore lancer. On s'arrête dès que la meilleure issue est gagnée ou
 * perdue, sauf si l'issue moyenne reste à jouer. Sans issue moyenne écrite,
 * une réussite de moins que demandé mène à la meilleure issue, de justesse
 * (`trialPartial`).
 */
export function trialNext(step: TrialStep, ok: number, ko: number): string | null {
  if (ok >= step.need) return step.best
  const left = Math.max(0, step.tries - ok - ko)
  if (ok + left >= step.need) return null
  const at = step.middle ? (step.middleAt ?? 1) : Math.max(1, step.need - 1)
  if (ok >= at) return step.middle ?? step.best
  return ok + left >= at ? null : step.fail
}

/** Meilleure issue atteinte de justesse : sans le butin ni les soins de la scène, et un peu de casse. */
export function trialPartial(step: TrialStep, ok: number): boolean {
  return !step.middle && ok < step.need
}

/** PV perdus par chacun quand une réussite de justesse n'a ni butin ni soins à retirer. */
export const PARTIAL_DAMAGE = 2

type RandomStep = Extract<SceneStep, { kind: 'random' }>

/** Suites possibles d'un tirage, selon les indices déjà gagnés. */
export function drawable(step: RandomStep, flags: readonly string[]): RandomOutcome[] {
  const open = step.outcomes.filter((o) => (!o.needs || flags.includes(o.needs)) && (!o.unless || !flags.includes(o.unless)))
  return open.length > 0 ? open : step.outcomes
}

/** Tire la scène suivante, chaque suite pesant son poids. */
export function draw(step: RandomStep, flags: readonly string[], roll: number = Math.random()): string {
  const open = drawable(step, flags)
  const total = open.reduce((sum, o) => sum + (o.weight ?? 1), 0)
  let left = roll * total
  for (const o of open) {
    left -= o.weight ?? 1
    if (left < 0) return o.next
  }
  return open[open.length - 1]!.next
}

/** Celui qui a le meilleur score dans une caractéristique ; à égalité, le premier arrivé. */
/** Modificateur d'un joueur pour ce jet : sa caractéristique, plus le bonus de son historique. */
export function checkMod(voter: Voter, stat: string, action?: ActionKind): number {
  return (voter.mods[stat] ?? 0) + actionBonus(voter.historique, action)
}

export function best(voters: readonly Voter[], stat: string, action?: ActionKind): Voter | undefined {
  return [...voters].sort(
    (a, b) =>
      checkMod(b, stat, action) - checkMod(a, stat, action) ||
      (stat === 'charisme' ? b.charisma - a.charisma : 0) ||
      a.connectionId - b.connectionId,
  )[0]
}

export type VoteResult =
  | { kind: 'winner'; option: SceneOption }
  | { kind: 'tie'; decider: Voter; options: SceneOption[] }

/**
 * Dépouille le vote. Une option seule en tête l'emporte. À égalité (ou si
 * tout le monde est sans avis), le MJ qui mène la partie choisit parmi les
 * options à égalité. Sans lui, le joueur au meilleur Charisme tranche : son
 * propre vote compte s'il porte sur une des options à égalité, sinon il
 * choisit parmi elles.
 */
export function decide(
  options: readonly SceneOption[],
  votes: ReadonlyMap<string, string>,
  voters: readonly Voter[],
  gm?: Voter,
): VoteResult | null {
  if (options.length === 0) return null
  const counts = new Map(options.map((o) => [o.id, 0]))
  for (const v of voters) {
    const choice = votes.get(v.id)
    if (choice && counts.has(choice)) counts.set(choice, (counts.get(choice) ?? 0) + 1)
  }
  const top = Math.max(...counts.values())
  const leading = options.filter((o) => counts.get(o.id) === top)
  if (leading.length === 1) return { kind: 'winner', option: leading[0]! }
  if (gm) return { kind: 'tie', decider: gm, options: leading }
  const decider = best(voters, 'charisme')
  if (!decider) return null
  const own = leading.find((o) => o.id === votes.get(decider.id))
  if (own) return { kind: 'winner', option: own }
  return { kind: 'tie', decider, options: leading }
}

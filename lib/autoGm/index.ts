/**
 * MJ automatique : les aventures disponibles et les règles du vote.
 *
 * Le déroulé (qui met en place le plateau, qui tranche) vit dans
 * `components/autogm/AutoGmPanel.tsx` ; ici, seulement ce qui se calcule sans
 * Liveblocks, pour rester lisible et vérifiable.
 */
import { CAKE_DEMO } from './cakeDemo'
import type { Adventure, Scene, SceneOption } from './types'

export type { Adventure, Scene, SceneOption } from './types'

export const ADVENTURES: Record<string, Adventure> = {
  [CAKE_DEMO.id]: CAKE_DEMO,
}

/** Aventure lancée dans la salle de démonstration. */
export const DEMO_ADVENTURE = CAKE_DEMO.id

/** Le vote se termine au plus tard ce délai après le premier vote. */
export const VOTE_WINDOW_MS = 45_000
/** Quand tout le monde a voté, un court délai pour changer d'avis. */
export const VOTE_SETTLE_MS = 1_500
/** Après un jet, le temps de lire le résultat avant la scène suivante. */
export const CHECK_READ_MS = 2_000

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
  /** Modificateur total par caractéristique, équipement compris. */
  mods: Record<string, number>
  /** Valeur brute du Charisme, pour départager deux modificateurs égaux. */
  charisma: number
}

/** Options proposées dans la scène : celles qui demandent un indice pas encore trouvé sont cachées. */
export function availableOptions(scene: Scene, flags: readonly string[]): SceneOption[] {
  if (scene.step.kind !== 'vote') return []
  return scene.step.options.filter((o) => !o.needs || flags.includes(o.needs))
}

/** Celui qui a le meilleur score dans une caractéristique ; à égalité, le premier arrivé. */
export function best(voters: readonly Voter[], stat: string): Voter | undefined {
  return [...voters].sort(
    (a, b) =>
      (b.mods[stat] ?? 0) - (a.mods[stat] ?? 0) ||
      (stat === 'charisme' ? b.charisma - a.charisma : 0) ||
      a.connectionId - b.connectionId,
  )[0]
}

export type VoteResult =
  | { kind: 'winner'; option: SceneOption }
  | { kind: 'tie'; decider: Voter; options: SceneOption[] }

/**
 * Dépouille le vote. Une option seule en tête l'emporte. À égalité (ou si
 * tout le monde est sans avis), le joueur au meilleur Charisme tranche : son
 * propre vote compte s'il porte sur une des options à égalité, sinon il
 * choisit parmi elles.
 */
export function decide(
  options: readonly SceneOption[],
  votes: ReadonlyMap<string, string>,
  voters: readonly Voter[],
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
  const decider = best(voters, 'charisme')
  if (!decider) return null
  const own = leading.find((o) => o.id === votes.get(decider.id))
  if (own) return { kind: 'winner', option: own }
  return { kind: 'tie', decider, options: leading }
}

import type { Adventure, Scene } from './types'

/**
 * Durée d'une aventure, estimée d'après ses scènes : le temps de lire le
 * récit, de voter, de lancer les dés. Les longueurs viennent de la démo, qui
 * se joue en dix à quinze minutes.
 */

/** Minutes passées dans une scène, hors de ce qui suit. */
function sceneMinutes(scene: Scene): number {
  const reading = 0.5 + 0.25 * scene.narration.length
  switch (scene.step.kind) {
    case 'vote':
      return reading + 1.5
    case 'check':
      return reading + 1
    case 'end':
      return reading + 0.5
    default:
      return reading + 0.25
  }
}

export type Duration = { min: number; max: number; average: number }

/**
 * Chemin le plus court, le plus long, et la moyenne en jouant au hasard :
 * chaque option du vote aussi probable, un jet sur deux réussi, les tirages
 * selon leur poids. Une scène déjà sur le chemin compte pour rien (pas de
 * boucle infinie).
 */
export function estimateDuration(adventure: Adventure): Duration {
  const memo = new Map<string, Duration>()
  const visiting = new Set<string>()
  const zero: Duration = { min: 0, max: 0, average: 0 }

  const walk = (id: string): Duration => {
    const known = memo.get(id)
    if (known) return known
    const scene = adventure.scenes[id]
    if (!scene || visiting.has(id)) return zero
    visiting.add(id)
    const step = scene.step
    let branches: { next: string; weight: number }[]
    if (step.kind === 'continue') branches = [{ next: step.next, weight: 1 }]
    else if (step.kind === 'vote') branches = step.options.map((o) => ({ next: o.next, weight: 1 }))
    else if (step.kind === 'check') branches = [{ next: step.success, weight: 1 }, { next: step.failure, weight: 1 }]
    else if (step.kind === 'random') branches = step.outcomes.map((o) => ({ next: o.next, weight: o.weight ?? 1 }))
    else branches = []
    const after = branches.map((b) => ({ ...walk(b.next), weight: b.weight }))
    visiting.delete(id)
    const own = sceneMinutes(scene)
    const total = after.reduce((sum, b) => sum + b.weight, 0)
    const result: Duration =
      after.length === 0
        ? { min: own, max: own, average: own }
        : {
            min: own + Math.min(...after.map((b) => b.min)),
            max: own + Math.max(...after.map((b) => b.max)),
            average: own + after.reduce((sum, b) => sum + b.average * b.weight, 0) / total,
          }
    memo.set(id, result)
    return result
  }

  return walk(adventure.start)
}

/** « 15 min », « 2 h », « 2 h 30 », arrondi au quart d'heure au-delà d'une heure. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.max(5, Math.round(minutes / 5) * 5)} min`
  const quarters = Math.round(minutes / 15)
  const h = Math.floor(quarters / 4)
  const m = (quarters % 4) * 15
  return m ? `${h} h ${m}` : `${h} h`
}

import type { Adventure, Scene } from './types'

/**
 * Durée d'une aventure, estimée d'après ses scènes : le temps de lire le
 * récit, de voter, de lancer les dés. Les longueurs viennent de la première
 * démo, qui se jouait en dix à quinze minutes.
 */

/** Minutes passées dans une scène, hors de ce qui suit. */
function sceneMinutes(scene: Scene): number {
  const reading = 0.5 + 0.25 * scene.narration.length
  switch (scene.step.kind) {
    case 'vote':
      return reading + 1.5
    case 'check':
      return reading + 1
    // Une minute par jet, en moyenne la moitié des essais en plus du minimum.
    case 'trial':
      return reading + (scene.step.need + scene.step.tries) / 2
    // Un tour : choisir, lancer, lire ce que font les ennemis.
    case 'combat':
      return reading + 1.5 * combatRounds(scene.step.foes)
    case 'end':
      return reading + 0.5
    default:
      return reading + 0.25
  }
}

/** Tours d'un combat, d'après les simulations (`lib/autoGm/combat.ts`) : environ un tour pour 6 PV d'ennemis. */
function combatRounds(foes: readonly { hp: number }[]): number {
  return Math.max(2, foes.reduce((sum, f) => sum + f.hp, 0) / 6)
}

export type Duration ={ min: number; max: number; average: number }

/**
 * Chemin le plus court, le plus long, et la moyenne en jouant au hasard :
 * chaque option du vote aussi probable, un jet sur deux réussi, les tirages
 * selon leur poids. Un choix qui ramène à une scène déjà sur le chemin (le
 * retour au comptoir d'où l'on repart) est laissé de côté : compté pour
 * rien, il ferait croire à une partie éclair.
 */
export function estimateDuration(adventure: Adventure): Duration {
  const memo = new Map<string, Duration>()
  const visiting = new Set<string>()
  // Vrai quand le dernier calcul a croisé une scène encore sur le chemin : il
  // ne vaut que depuis ce chemin, on ne le garde pas en mémoire.
  let looped = false

  /** `null` : la scène ne fait que ramener en arrière. */
  const walk = (id: string): Duration | null => {
    const known = memo.get(id)
    if (known) return known
    const scene = adventure.scenes[id]
    if (!scene) return { min: 0, max: 0, average: 0 }
    if (visiting.has(id)) {
      looped = true
      return null
    }
    visiting.add(id)
    const step = scene.step
    let branches: { next: string; weight: number }[]
    if (step.kind === 'continue') branches = [{ next: step.next, weight: 1 }]
    else if (step.kind === 'vote') branches = step.options.map((o) => ({ next: o.next, weight: 1 }))
    else if (step.kind === 'check') branches = [{ next: step.success, weight: 1 }, { next: step.failure, weight: 1 }]
    else if (step.kind === 'combat') branches = [{ next: step.victory, weight: 3 }, { next: step.defeat, weight: 1 }]
    else if (step.kind === 'trial')
      branches = [step.best, step.middle, step.fail].filter((n): n is string => !!n).map((next) => ({ next, weight: 1 }))
    else if (step.kind === 'random') branches = step.outcomes.map((o) => ({ next: o.next, weight: o.weight ?? 1 }))
    else branches = []
    let anyLoop = false
    const after: (Duration & { weight: number })[] = []
    for (const b of branches) {
      looped = false
      const d = walk(b.next)
      if (looped) anyLoop = true
      if (d) after.push({ ...d, weight: b.weight })
    }
    visiting.delete(id)
    looped = anyLoop
    if (branches.length > 0 && after.length === 0) return null
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
    if (!anyLoop) memo.set(id, result)
    return result
  }

  return walk(adventure.start) ?? { min: 0, max: 0, average: 0 }
}

/** « 15 min », « 2 h », « 2 h 30 », arrondi au quart d'heure au-delà d'une heure. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.max(5, Math.round(minutes / 5) * 5)} min`
  const quarters = Math.round(minutes / 15)
  const h = Math.floor(quarters / 4)
  const m = (quarters % 4) * 15
  return m ? `${h} h ${m}` : `${h} h`
}

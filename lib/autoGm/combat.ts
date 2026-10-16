/**
 * Combat au tour par tour du MJ automatique, sans Liveblocks : l'état du
 * combat, ce que fait chaque action, et le tour des ennemis. Le meneur de la
 * partie (`components/autogm/useAutoCombat.ts`) l'applique et le range dans
 * `autoGm.combat`.
 *
 * Un tour : chaque héros choisit une action (`combatActions.ts`). Une attaque
 * demande un d20 au joueur, contre la défense de l'ennemi ; le reste agit
 * tout de suite. Quand tout le monde a agi, chaque ennemi frappe un héros.
 * Personne ne tombe d'un seul coup : un coup ne retire jamais plus de 40 %
 * des PV maximum.
 */
import type { CheckStat } from '@/lib/checks'
import type { Foe, SceneStep } from './types'
import { actionById, armorOf, needsFoe, weaponStat, type CombatAction } from './combatActions'

export type CombatStep = Extract<SceneStep, { kind: 'combat' }>
export type Rng = () => number

/** Temps laissé pour choisir son action ; après, le tour passe sans ceux qui n'ont rien choisi. */
export const ROUND_MS = 60_000
/** Après la dernière action, le temps de lire avant que les ennemis frappent. */
export const FOES_DELAY_MS = 1_500
/** Combat fini : le temps de lire le dernier tour avant la scène suivante. */
export const END_DELAY_MS = 3_000
/** Un coup ne retire jamais plus que cette part des PV maximum. */
export const MAX_HIT = 0.4
/** Chaque héros en plus ajoute cette part de PV aux ennemis… */
export const HP_PER_HERO = 1
/** … et cette part d'attaques (la fraction, une attaque en plus de temps en temps). */
export const ATTACKS_PER_HERO = 0.75

export type CombatHero = { id: string; name: string; hp: number; max: number; defense: number }
/** `rate` : attaques par tour, selon la taille du groupe. */
export type CombatFoe = { id: string; hp: number; max: number; rate: number; stunned?: boolean; weak?: boolean }
/** Jet d'attaque (ou de fuite) demandé, en attente du dé. */
export type CombatAttack = { id: string; userId: string; action: string; foe?: string }

export type LineKind =
  | 'hit'
  | 'crit'
  | 'miss'
  | 'area'
  | 'heal'
  | 'guard'
  | 'dodge'
  | 'inspire'
  | 'stun'
  | 'weak'
  | 'fleeFail'
  | 'fled'
  | 'foeHit'
  | 'foeMiss'
  | 'foeDodged'
  | 'foeStunned'
  | 'foeDown'
  | 'heroDown'
  | 'idle'

/**
 * Une ligne du récit du combat, sans texte : chacun la lit dans sa langue.
 * `a`, `b` : noms de héros ; `f` : identifiant d'ennemi ; `act` : action.
 */
export type CombatLine = { k: LineKind; a?: string; b?: string; f?: string; n?: number; act?: string }

export type CombatState = {
  visit: number
  round: number
  roundStart: number
  heroes: CombatHero[]
  foes: CombatFoe[]
  /** Héros qui ont agi ce tour. */
  acted: string[]
  attacks: CombatAttack[]
  /** Une entrée `héros:action` par utilisation d'une technique limitée. */
  used: string[]
  guard: string[]
  dodge: string[]
  inspired: string[]
  /** Récit du tour en cours, puis du tour précédent. */
  lines: CombatLine[]
  last: CombatLine[]
  end?: 'victory' | 'defeat' | 'fled'
  endAt?: number
}

/** Ce que le meneur sait d'un héros pour le combat. */
export type Fighter = {
  id: string
  name: string
  classe?: string
  level?: number
  hp?: number
  maxHp?: number
  defense?: number
  weapon?: string
  mods: Record<string, number>
}

// ── Dés ─────────────────────────────────────────────────────────────────

const TERM = /^(\d*)d(\d+)$|^(\d+)$/

/** Lance une expression de dés (« 1d8+2 », « 1d4+1d6 », « 2d6-1 ») ; `crit` double les dés. */
export function rollDice(expr: string, rng: Rng, crit = false): number {
  let total = 0
  for (const raw of expr.replace(/\s+/g, '').toLowerCase().replace(/-/g, '+-').split('+')) {
    if (!raw) continue
    const sign = raw.startsWith('-') ? -1 : 1
    const m = TERM.exec(raw.replace(/^-/, ''))
    if (!m) continue
    if (m[3]) {
      total += sign * Number(m[3])
      continue
    }
    const count = Math.min(20, Number(m[1] || 1)) * (crit ? 2 : 1)
    const sides = Math.min(100, Math.max(1, Number(m[2])))
    for (let i = 0; i < count; i += 1) total += sign * (1 + Math.floor(rng() * sides))
  }
  return total
}

/** Vrai si l'expression se lance (dégâts écrits à la main sur une fiche). */
export const isDice = (expr: string | undefined) =>
  !!expr && expr.replace(/\s+/g, '').toLowerCase().split(/[+-]/).every((t) => t === '' || TERM.test(t)) && /d\d/i.test(expr)

const d20 = (rng: Rng) => 1 + Math.floor(rng() * 20)

// ── Mise en place ───────────────────────────────────────────────────────

/** PV d'un ennemi pour un groupe de `heroes` héros. */
export const scaledHp = (hp: number, heroes: number) => Math.max(1, Math.round(hp * (1 + HP_PER_HERO * Math.max(0, heroes - 1))))

/** Attaques par tour d'un ennemi pour un groupe de `heroes` héros. */
export const scaledRate = (attacks: number, heroes: number) => attacks * (1 + ATTACKS_PER_HERO * Math.max(0, heroes - 1))

/** Bonus de maîtrise : +2, puis +1 tous les quatre niveaux. */
export const proficiency = (level = 1) => 2 + Math.floor((Math.max(1, level) - 1) / 4)

/** Défense d'un héros : celle de sa fiche, sinon 10 + Dextérité + l'armure de sa classe. */
export function heroDefense(f: Fighter): number {
  if (f.defense && f.defense > 0) return f.defense
  return 10 + (f.mods.dexterite ?? 0) + armorOf(f.classe)
}

export function toCombatHero(f: Fighter): CombatHero {
  const max = Math.max(1, f.maxHp ?? 10)
  return { id: f.id, name: f.name, hp: Math.min(max, Math.max(1, f.hp ?? max)), max, defense: heroDefense(f) }
}

export function startCombat(step: CombatStep, fighters: readonly Fighter[], visit: number, now: number): CombatState {
  const n = Math.max(1, fighters.length)
  return {
    visit,
    round: 1,
    roundStart: now,
    heroes: fighters.map(toCombatHero),
    foes: step.foes.map((f) => {
      const max = scaledHp(f.hp, n)
      return { id: f.id, hp: max, max, rate: scaledRate(f.attacks ?? 1, n) }
    }),
    acted: [],
    attacks: [],
    used: [],
    guard: [],
    dodge: [],
    inspired: [],
    lines: [],
    last: [],
  }
}

// ── Les héros agissent ──────────────────────────────────────────────────

export const usesLeft = (state: CombatState, heroId: string, action: CombatAction) =>
  action.uses === undefined ? Infinity : action.uses - state.used.filter((u) => u === `${heroId}:${action.id}`).length

/** Caractéristique et modificateur du jet d'attaque d'une action. */
export function attackRoll(f: Fighter, action: CombatAction, state: CombatState): { stat: CheckStat; mod: number } {
  const stat = action.stat ?? weaponStat(f.classe, f.mods)
  const inspired = state.inspired.includes(f.id) ? 2 : 0
  const mod = (f.mods[stat] ?? 0) + proficiency(f.level) + (action.toHit ?? 0) + inspired
  return { stat, mod: Math.max(-30, Math.min(30, mod)) }
}

const living = <T extends { hp: number }>(list: readonly T[]) => list.filter((x) => x.hp > 0)

/** Ce qu'une action peut viser : l'ennemi choisi s'il est debout, sinon le premier debout. */
export function targetFoe(state: CombatState, wanted?: string): CombatFoe | undefined {
  const up = living(state.foes)
  return up.find((f) => f.id === wanted) ?? up[0]
}

/** Dégâts ou soins d'une action, modificateur compris. */
function amount(f: Fighter, action: CombatAction, rng: Rng, crit = false): number {
  const dice = action.dice === 'arme' ? (isDice(f.weapon) ? f.weapon! : '1d6') : (action.dice ?? '1d4')
  const stat = action.stat ?? weaponStat(f.classe, f.mods)
  const bonus = action.mod ? Math.max(0, f.mods[stat] ?? 0) : 0
  const level = action.level ? Math.max(1, f.level ?? 1) : 0
  return Math.max(1, rollDice(dice, rng, crit) + bonus + level)
}

function hurtFoe(state: CombatState, foeId: string, damage: number, lines: CombatLine[]) {
  const foe = state.foes.find((x) => x.id === foeId)
  if (!foe || foe.hp <= 0) return
  foe.hp = Math.max(0, foe.hp - damage)
  if (foe.hp === 0) lines.push({ k: 'foeDown', f: foe.id })
}

const clone = (s: CombatState): CombatState => JSON.parse(JSON.stringify(s)) as CombatState

/**
 * Applique l'action d'un héros. `roll` : le jet d'attaque ou de fuite quand
 * l'action en demande un (réussi ou non, et le d20 brut pour le coup critique).
 */
export function resolveAction(
  prev: CombatState,
  f: Fighter,
  actionId: string,
  foeId: string | undefined,
  rng: Rng,
  roll?: { success: boolean; die: number },
): CombatState {
  const state = clone(prev)
  const lines: CombatLine[] = []
  const action = actionById(f.classe, actionId)
  const me = state.heroes.find((h) => h.id === f.id)
  if (!state.acted.includes(f.id)) state.acted.push(f.id)
  state.attacks = state.attacks.filter((a) => a.userId !== f.id)
  if (!action || !me || me.hp <= 0 || state.end) return state
  if (action.uses !== undefined) state.used.push(`${f.id}:${action.id}`)
  const a = f.name
  switch (action.effect) {
    case 'hit': {
      const foe = targetFoe(state, foeId)
      if (!foe) break
      state.inspired = state.inspired.filter((id) => id !== f.id)
      if (!roll?.success) {
        lines.push({ k: 'miss', a, f: foe.id, act: action.id })
        break
      }
      const crit = roll.die === 20
      const dmg = amount(f, action, rng, crit)
      lines.push({ k: crit ? 'crit' : 'hit', a, f: foe.id, n: dmg, act: action.id })
      hurtFoe(state, foe.id, dmg, lines)
      if (foe.hp > 0 && action.stun) {
        foe.stunned = true
        lines.push({ k: 'stun', f: foe.id })
      }
      if (foe.hp > 0 && action.weaken) {
        foe.weak = true
        lines.push({ k: 'weak', f: foe.id })
      }
      break
    }
    case 'auto': {
      const foe = targetFoe(state, foeId)
      if (!foe) break
      const dmg = amount(f, action, rng)
      lines.push({ k: 'hit', a, f: foe.id, n: dmg, act: action.id })
      hurtFoe(state, foe.id, dmg, lines)
      break
    }
    case 'area': {
      const dmg = amount(f, action, rng)
      lines.push({ k: 'area', a, n: dmg, act: action.id })
      for (const foe of living(state.foes)) hurtFoe(state, foe.id, dmg, lines)
      break
    }
    case 'heal':
    case 'selfHeal': {
      const hurt =
        action.effect === 'selfHeal'
          ? me
          : [...state.heroes].filter((h) => h.hp < h.max).sort((x, y) => x.hp / x.max - y.hp / y.max)[0] ?? me
      const gain = Math.min(hurt.max - hurt.hp, amount(f, action, rng))
      hurt.hp += gain
      lines.push({ k: 'heal', a, b: hurt.name, n: gain, act: action.id })
      break
    }
    case 'guard':
      state.guard.push(f.id)
      lines.push({ k: 'guard', a })
      break
    case 'dodge':
      state.dodge.push(f.id)
      lines.push({ k: 'dodge', a, act: action.id })
      break
    case 'inspire':
      for (const h of living(state.heroes)) if ((action.self || h.id !== f.id) && !state.inspired.includes(h.id)) state.inspired.push(h.id)
      lines.push({ k: 'inspire', a, act: action.id })
      break
    case 'flee':
      if (roll?.success) {
        state.end = 'fled'
        lines.push({ k: 'fled', a })
      } else lines.push({ k: 'fleeFail', a })
      break
  }
  state.lines.push(...lines)
  if (!state.end && living(state.foes).length === 0) state.end = 'victory'
  return state
}

/** Héros qui doit encore choisir ce tour : présent, debout, sans jet en attente. */
export function waitingFor(state: CombatState, present: ReadonlySet<string>): CombatHero[] {
  return state.heroes.filter(
    (h) => present.has(h.id) && h.hp > 0 && !state.acted.includes(h.id) && !state.attacks.some((x) => x.userId === h.id),
  )
}

/** Le tour des héros est fini : tout le monde a agi, ou le temps est écoulé (les jets lancés restent attendus). */
export function roundDone(state: CombatState, present: ReadonlySet<string>, now: number): boolean {
  if (state.end || state.attacks.length > 0) return false
  return waitingFor(state, present).length === 0 || now >= state.roundStart + ROUND_MS
}

// ── Les ennemis frappent ────────────────────────────────────────────────

/** Chaque ennemi debout frappe un héros présent et debout, au hasard ; puis un nouveau tour commence. */
export function foesTurn(prev: CombatState, defs: readonly Foe[], present: ReadonlySet<string>, rng: Rng, now: number): CombatState {
  const state = clone(prev)
  const lines: CombatLine[] = []
  for (const h of state.heroes) if (present.has(h.id) && h.hp > 0 && !state.acted.includes(h.id)) lines.push({ k: 'idle', a: h.name })
  for (const foe of living(state.foes)) {
    const def = defs.find((d) => d.id === foe.id)
    if (!def) continue
    if (foe.stunned) {
      foe.stunned = false
      lines.push({ k: 'foeStunned', f: foe.id })
      continue
    }
    const malus = foe.weak ? 3 : 0
    foe.weak = false
    const rate = foe.rate ?? def.attacks ?? 1
    const count = Math.floor(rate) + (rng() < rate % 1 ? 1 : 0)
    for (let i = 0; i < count; i += 1) {
      const targets = state.heroes.filter((h) => present.has(h.id) && h.hp > 0)
      const hero = targets[Math.floor(rng() * targets.length)]
      if (!hero) break
      if (state.dodge.includes(hero.id)) {
        state.dodge = state.dodge.filter((id) => id !== hero.id)
        lines.push({ k: 'foeDodged', f: foe.id, a: hero.name })
        continue
      }
      const die = d20(rng)
      if (die !== 20 && (die === 1 || die + def.attack - malus < hero.defense)) {
        lines.push({ k: 'foeMiss', f: foe.id, a: hero.name })
        continue
      }
      let dmg = Math.max(1, rollDice(def.damage, rng))
      dmg = Math.min(dmg, Math.max(1, Math.floor(hero.max * MAX_HIT)))
      if (state.guard.includes(hero.id)) dmg = Math.max(1, Math.floor(dmg / 2))
      hero.hp = Math.max(0, hero.hp - dmg)
      lines.push({ k: 'foeHit', f: foe.id, a: hero.name, n: dmg })
      if (hero.hp === 0) lines.push({ k: 'heroDown', a: hero.name })
    }
  }
  state.last = [...state.lines, ...lines]
  state.lines = []
  state.round += 1
  state.roundStart = now
  state.acted = []
  state.guard = []
  state.dodge = []
  if (!state.heroes.some((h) => present.has(h.id) && h.hp > 0)) state.end = 'defeat'
  return state
}

/**
 * Fin du combat posée par le meneur : sur une défaite, les héros se relèvent
 * à 1 PV (assommés, pas morts), pour la scène qui suit.
 */
export function finish(prev: CombatState, now: number): CombatState {
  const state = clone(prev)
  if (state.end === 'defeat') for (const h of state.heroes) h.hp = Math.max(1, h.hp)
  if (state.lines.length > 0) {
    state.last = [...state.lines]
    state.lines = []
  }
  state.endAt = now
  return state
}

/** Vrai si l'action vise un ennemi encore debout, ou n'en vise pas. */
export function canTarget(state: CombatState, action: CombatAction, foeId?: string) {
  return !needsFoe(action) || !!targetFoe(state, foeId)
}

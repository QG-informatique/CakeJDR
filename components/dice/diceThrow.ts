import {
  type Axis, FACES, IDENTITY, type Mat, mul, rotation, rotationsBetween, snap, tipFromVelocity, topFace,
} from '@/lib/cubeMath'

/**
 * Trajectoire d'un lancer de dés sur la table, calculée d'avance.
 *
 * Le serveur a déjà tiré le résultat : la trajectoire n'est que la mise en
 * scène. Elle part d'une graine tirée de l'identifiant du lancer, si bien que
 * chaque joueur voit le même lancer, depuis le même bord, au même moment
 * (l'heure du lancer est fixée par le serveur). Seule l'échelle suit la taille
 * du plateau de chacun.
 *
 * Le roulement est celui du dé de la page d'accueil : un cube bascule
 * par-dessus ses arêtes, un quart de tour à la fois, rebondit sur les bords,
 * ralentit, retombe à plat et oscille un instant. La trajectoire est simulée
 * en entier à partir d'une orientation neutre ; on sait alors quelle face
 * finit en haut, et on tourne le dé au départ pour que ce soit celle du
 * résultat. Pour les dés autres que le D6, c'est le chiffre de la face du
 * dessus qui devient le résultat.
 */

/** Pas de la simulation, en secondes. */
const DT = 1 / 60
/** Le lancer doit être posé avant que le résultat s'affiche dans le chat. */
const MAX_THROW_S = 2.75
const REST_SPEED = 70
const FRICTION = 1.8
const WALL_BOUNCE = 0.62

export type DieFrame = { x: number; y: number; lift: number; m: Mat }

export type ThrownDie = {
  frames: DieFrame[]
  /** Chiffre de chaque face de `FACES` (un D6 garde ses points). */
  labels: number[]
  /** Face du dessus à l'arrivée. */
  top: number
}

export type DiceThrow = {
  dice: ThrownDie[]
  /** Moment où le dernier dé est posé, en ms depuis le lancer. */
  settleMs: number
  size: number
}

/** Générateur pseudo-aléatoire à graine (mulberry32). */
function seeded(text: string) {
  let h = 1779033703 ^ text.length
  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Taille d'un dé selon le plateau : lisible sur téléphone, discret sur grand écran. */
export const dieSize = (w: number, h: number) => Math.round(Math.max(40, Math.min(68, Math.min(w, h) / 7)))

type Mode = 'thrown' | 'fall' | 'rock' | 'still'

type Body = {
  mode: Mode
  x: number
  y: number
  vx: number
  vy: number
  base: Mat
  tipAxis: Axis
  tipSign: number
  tipP: number
  rockDeg: number
  rockAmp: number
  hop: number
  phase: number
  t0: number
  dur: number
  fallFrom: number
  fallTo: number
}

/**
 * Simule le lancer de `results.length` dés à `dice` faces sur un plateau de
 * `w` × `h` pixels.
 */
export function simulateThrow(id: string, dice: number, results: number[], w: number, h: number): DiceThrow {
  const rand = seeded(id)
  const size = dieSize(w, h)
  const half = size / 2
  const n = results.length

  // Tous les dés partent du même bord, comme une poignée lancée d'un coup.
  const side = rand() < 0.5 ? 'bottom' : rand() < 0.5 ? 'left' : 'right'
  const along = side === 'bottom' ? w : h
  const perRow = Math.max(1, Math.floor((along - size) / (size * 1.15)))
  const center = along * (0.35 + rand() * 0.3)
  const target = { x: w * (0.3 + rand() * 0.4), y: h * (0.25 + rand() * 0.3) }
  const speed = Math.max(900, 1.5 * Math.max(w, h)) * (0.9 + rand() * 0.3)

  const bodies: Body[] = results.map((_, i) => {
    const row = Math.floor(i / perRow)
    const inRow = Math.min(perRow, n - row * perRow)
    const col = i % perRow
    const offset = (col - (inRow - 1) / 2) * size * 1.15
    const a = Math.max(half, Math.min(along - half, center + offset))
    const depth = half + row * size * 1.15
    const x = side === 'bottom' ? a : side === 'left' ? depth : w - depth
    const y = side === 'bottom' ? h - depth : a
    const angle = Math.atan2(target.y - y, target.x - x) + (rand() - 0.5) * 0.5
    const v = speed * (0.85 + rand() * 0.3)
    const vx = Math.cos(angle) * v
    const vy = Math.sin(angle) * v
    const tip = tipFromVelocity(vx, vy)
    return {
      mode: 'thrown', x, y, vx, vy, base: IDENTITY, tipAxis: tip.axis, tipSign: tip.sign, tipP: rand() * 0.5,
      rockDeg: 0, rockAmp: 0, hop: 0, phase: rand() * 0.2, t0: 0, dur: 0, fallFrom: 0, fallTo: 0,
    }
  })

  const frames: DieFrame[][] = bodies.map(() => [])
  let settle = 0

  const commitTip = (b: Body) => {
    b.base = snap(mul(rotation(b.tipAxis, b.tipSign * 90), b.base))
    b.tipP = 0
  }
  const startFall = (b: Body, t: number) => {
    b.vx = 0
    b.vy = 0
    b.mode = 'fall'
    b.t0 = t
    b.fallFrom = b.tipP
    b.fallTo = b.tipP >= 0.5 ? 1 : 0
    b.dur = 0.12 + Math.abs(b.fallTo - b.fallFrom) * 0.36
  }

  for (let step = 0; ; step += 1) {
    const t = step * DT
    for (const b of bodies) {
      if (b.mode === 'thrown') {
        b.x += b.vx * DT
        b.y += b.vy * DT
        if (b.x < half) { b.x = half; b.vx = Math.abs(b.vx) * WALL_BOUNCE }
        else if (b.x > w - half) { b.x = w - half; b.vx = -Math.abs(b.vx) * WALL_BOUNCE }
        if (b.y < half) { b.y = half; b.vy = Math.abs(b.vy) * WALL_BOUNCE }
        else if (b.y > h - half) { b.y = h - half; b.vy = -Math.abs(b.vy) * WALL_BOUNCE }
        // Vers la fin, le tapis freine plus fort : tout est posé à temps.
        const friction = Math.exp(-(t > MAX_THROW_S - 0.9 ? FRICTION * 4 : FRICTION) * DT)
        b.vx *= friction
        b.vy *= friction
        const v = Math.hypot(b.vx, b.vy)
        b.phase += DT
        b.hop = Math.min(v / 90, 18) * Math.abs(Math.sin((b.phase * Math.PI) / 0.2))
        // Il roule sans glisser : un quart de tour par longueur de côté parcourue.
        const move = b.tipAxis === 'y' ? b.vx * b.tipSign : -b.vy * b.tipSign
        b.tipP += (move * DT) / size
        if (b.tipP >= 1 || b.tipP < 0) {
          if (b.tipP >= 1) commitTip(b)
          const next = tipFromVelocity(b.vx, b.vy)
          b.tipAxis = next.axis
          b.tipSign = next.sign
          b.tipP = 0
        }
        if (v < REST_SPEED) startFall(b, t)
      } else if (b.mode === 'fall') {
        const k = Math.min((t - b.t0) / b.dur, 1)
        b.tipP = b.fallFrom + (b.fallTo - b.fallFrom) * k * k
        b.hop *= Math.exp(-14 * DT)
        if (k >= 1) {
          const forward = b.fallTo === 1
          if (forward) commitTip(b)
          b.hop = 0
          b.mode = 'rock'
          b.t0 = t
          b.rockAmp = forward ? 5 : -5
        }
      } else if (b.mode === 'rock') {
        const k = t - b.t0
        b.rockDeg = b.tipSign * b.rockAmp * Math.exp(-k * 9) * Math.sin(k * 38)
        if (k > 0.45) {
          b.rockDeg = 0
          b.mode = 'still'
        }
      }
    }

    // Deux dés qui se touchent rebondissent l'un sur l'autre ; un dé déjà
    // posé ne bouge plus et renvoie celui qui le heurte.
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const a = bodies[i] as Body
        const b = bodies[j] as Body
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.hypot(dx, dy)
        if (dist >= size || (a.mode !== 'thrown' && b.mode !== 'thrown')) continue
        const nx = dist > 0 ? dx / dist : 1
        const ny = dist > 0 ? dy / dist : 0
        const overlap = size - dist
        const aMoves = a.mode === 'thrown'
        const bMoves = b.mode === 'thrown'
        const share = aMoves && bMoves ? 0.5 : 1
        if (aMoves) { a.x -= nx * overlap * share; a.y -= ny * overlap * share }
        if (bMoves) { b.x += nx * overlap * share; b.y += ny * overlap * share }
        const va = aMoves ? a.vx * nx + a.vy * ny : 0
        const vb = bMoves ? b.vx * nx + b.vy * ny : 0
        if (va - vb <= 0) continue
        if (aMoves && bMoves) {
          a.vx += (vb - va) * nx * 0.9; a.vy += (vb - va) * ny * 0.9
          b.vx += (va - vb) * nx * 0.9; b.vy += (va - vb) * ny * 0.9
        } else if (aMoves) {
          a.vx -= 1.6 * va * nx; a.vy -= 1.6 * va * ny
        } else {
          b.vx -= 1.6 * vb * nx; b.vy -= 1.6 * vb * ny
        }
      }
    }

    bodies.forEach((b, i) => {
      const angle = b.tipSign * b.tipP * 90 + b.rockDeg
      const m = angle === 0 ? b.base : mul(rotation(b.tipAxis, angle), b.base)
      const a = (Math.min(Math.abs(b.tipP), 1) * Math.PI) / 2
      const lift = b.hop + 0.5 * half * (Math.cos(a) + Math.sin(a) - 1)
      frames[i]?.push({ x: b.x, y: b.y, lift, m })
    })

    if (bodies.every((b) => b.mode === 'still')) {
      settle = t
      break
    }
    // Filet de sécurité : un dé encore en mouvement est posé d'office.
    if (t >= MAX_THROW_S) {
      bodies.forEach((b) => {
        if (b.mode !== 'still' && b.tipP >= 0.5) commitTip(b)
        b.tipP = 0
        b.rockDeg = 0
        b.hop = 0
        b.mode = 'still'
      })
      bodies.forEach((b, i) => frames[i]?.push({ x: b.x, y: b.y, lift: 0, m: b.base }))
      settle = t + DT
      break
    }
  }

  const thrown = bodies.map((b, i): ThrownDie => {
    const result = results[i] ?? 1
    const top = topFace(b.base)
    const own = frames[i] ?? []
    if (dice === 6) {
      // On tourne le dé au départ pour que la face du résultat finisse en haut.
      const from = FACES.findIndex((f) => f.value === result)
      const choices = rotationsBetween(from, top)
      const q = choices[Math.floor(rand() * choices.length)] ?? IDENTITY
      return { frames: own.map((f) => ({ ...f, m: mul(f.m, q) })), labels: FACES.map((f) => f.value), top: from }
    }
    // Les autres faces portent des chiffres du même dé, pour la vraisemblance.
    const labels = FACES.map((_, k) => {
      if (k === top) return result
      let v = 1 + Math.floor(rand() * dice)
      if (v === result && dice > 1) v = (v % dice) + 1
      return v
    })
    return { frames: own, labels, top }
  })

  return { dice: thrown, settleMs: settle * 1000, size }
}

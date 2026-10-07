import {
  type Axis, CUBE_ROTATIONS, FACES, type Mat, faceNormal, mul, rotation, snap, tipFromVelocity, topFace,
} from './cubeMath'

/**
 * Lancer de dés sur la table, à la main.
 *
 * Le joueur attrape le dé, le traîne et le lâche : la vitesse de son geste
 * part avec le dé, qui roule, rebondit sur les bords et sur les autres dés,
 * ralentit, retombe toujours à plat et oscille un instant. Le roulement est
 * celui du dé de la page d'accueil : un cube bascule par-dessus ses arêtes,
 * un quart de tour à la fois.
 *
 * La trajectoire ne dépend que du geste (`ThrowParams`) : le serveur la range
 * avec le lancer, et chaque navigateur la rejoue à l'identique, à l'échelle de
 * son plateau. Le résultat, lui, reste tiré par le serveur. Comme la
 * trajectoire est connue d'avance, on sait quelle face finit en haut, et on y
 * inscrit le résultat. Le lanceur voit partir son dé avant la réponse du
 * serveur : le chiffre est alors posé sur cette face pendant qu'elle est
 * cachée (dessous ou dos du dé), ce qui ne se voit pas.
 */

/** Pas de la simulation, en secondes ; une image par pas. */
export const DT = 1 / 60
export const FRAME_MS = 1000 * DT
/** Sous cette vitesse (pixels par seconde), le dé n'est pas lancé : on ne peut pas le poser sur une face. */
export const MIN_THROW_SPEED = 650
export const MAX_THROW_SPEED = 3400
/** Au-delà, tout dé encore en mouvement est posé d'office. */
const MAX_THROW_S = 3.4
export const MAX_THROW_MS = MAX_THROW_S * 1000 + 100
/** Avance laissée aux autres joueurs pour recevoir le lancer avant qu'il ne parte chez eux. */
export const THROW_LEAD_MS = 350
const REST_SPEED = 70
const FRICTION = 1.8
const WALL_BOUNCE = 0.62

/** Inclinaison du regard : assez pour voir un cube, pas trop pour lire la face du dessus. */
export const TILT_X = -14
export const TILT_Y = 16

/** Geste du lanceur, dans le repère de son plateau (pixels). */
export type ThrowParams = {
  /** Centre du dé au moment où il est lâché. */
  x: number
  y: number
  /** Vitesse du geste, en pixels par seconde. */
  vx: number
  vy: number
  /** Taille du plateau du lanceur. */
  w: number
  h: number
  /** Graine des petites variations (écart entre plusieurs dés, chiffres des faces). */
  seed: number
  /** Orientation du dé tenu en main, rang dans `CUBE_ROTATIONS`. */
  rot: number
}

export type DieFrame = { x: number; y: number; lift: number; m: Mat }

export type ThrownDie = {
  frames: DieFrame[]
  /** Face du dessus à l'arrivée. */
  top: number
}

export type DiceThrow = {
  dice: ThrownDie[]
  /** Moment où le dernier dé est posé, en ms depuis le lâcher. */
  settleMs: number
  size: number
}

/** Générateur pseudo-aléatoire à graine (mulberry32). */
export function seeded(seed: number | string) {
  let a: number
  if (typeof seed === 'number') a = seed >>> 0
  else {
    let h = 1779033703 ^ seed.length
    for (let i = 0; i < seed.length; i += 1) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
      h = (h << 13) | (h >>> 19)
    }
    a = h >>> 0
  }
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const randomSeed = () => Math.floor(Math.random() * 0xffffffff)

/** Taille d'un dé selon le plateau : lisible sur téléphone, discret sur grand écran. */
export const dieSize = (w: number, h: number) => Math.round(Math.max(40, Math.min(68, Math.min(w, h) / 7)))

/** Place du dé quand personne ne le lance : au milieu du plateau. */
export const homePoint = (w: number, h: number) => ({ x: w / 2, y: h / 2 })

/** Orientation de départ du `i`-ème dé d'une poignée. */
export const dieRotation = (rot: number, i: number) =>
  CUBE_ROTATIONS[(rot + i * 5) % CUBE_ROTATIONS.length] ?? (CUBE_ROTATIONS[0] as Mat)

/**
 * Chiffres des six faces de chaque dé avant le lancer. Un D6 garde ses points ;
 * les autres dés portent des chiffres de leur type, tirés de la graine.
 */
export function startLabels(seed: number, dice: number, count: number): number[][] {
  const rand = seeded(seed ^ 0x5bd1e995)
  return Array.from({ length: count }, () => {
    if (dice === 6) return FACES.map((f) => f.value)
    const pool = Array.from({ length: dice }, (_, i) => i + 1)
    return FACES.map((_, k) => {
      if (pool.length === 0) return 1 + Math.floor(rand() * dice)
      const [v] = pool.splice(Math.floor(rand() * pool.length), 1)
      return v ?? 1 + k
    })
  })
}

/**
 * Lancer sans geste (bouton « Lancer », ou ancien lancer sans trajectoire) :
 * depuis la place du dé, dans une direction au hasard, avec un bel élan.
 */
export function autoThrow(seed: number, w: number, h: number, rot: number): ThrowParams {
  const rand = seeded(seed)
  const home = homePoint(w, h)
  const angle = rand() * Math.PI * 2
  const speed = Math.min(MAX_THROW_SPEED, Math.max(1400, 1.4 * Math.max(w, h)) * (0.85 + rand() * 0.3))
  return { x: home.x, y: home.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, w, h, seed, rot }
}

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

/** Simule le lancer de `count` dés lâchés d'un même geste. */
export function simulateThrow(p: ThrowParams, count: number): DiceThrow {
  const rand = seeded(p.seed)
  const { w, h } = p
  const size = dieSize(w, h)
  const half = size / 2
  const n = Math.max(1, count)
  const clampX = (x: number) => Math.max(half, Math.min(w - half, x))
  const clampY = (y: number) => Math.max(half, Math.min(h - half, y))

  let vx = p.vx
  let vy = p.vy
  const speed0 = Math.hypot(vx, vy)
  if (speed0 > MAX_THROW_SPEED) {
    vx *= MAX_THROW_SPEED / speed0
    vy *= MAX_THROW_SPEED / speed0
  }

  // Une poignée de dés : le premier sous la main, les autres serrés autour.
  const bodies: Body[] = Array.from({ length: n }, (_, i) => {
    const ring = i === 0 ? 0 : 1 + Math.floor((i - 1) / 6)
    const a = ((i - 1) % 6) * (Math.PI / 3) + ring * 0.5
    const x = clampX(p.x + Math.cos(a) * ring * size * 1.05)
    const y = clampY(p.y + Math.sin(a) * ring * size * 1.05)
    const turn = (rand() - 0.5) * (n > 1 ? 0.35 : 0.12)
    const k = 0.9 + rand() * 0.2
    const dvx = (Math.cos(turn) * vx - Math.sin(turn) * vy) * k
    const dvy = (Math.sin(turn) * vx + Math.cos(turn) * vy) * k
    const tip = tipFromVelocity(dvx, dvy)
    return {
      mode: 'thrown', x, y, vx: dvx, vy: dvy, base: dieRotation(p.rot, i), tipAxis: tip.axis, tipSign: tip.sign,
      tipP: rand() * 0.4, rockDeg: 0, rockAmp: 0, hop: 14, phase: rand() * 0.2, t0: 0, dur: 0, fallFrom: 0, fallTo: 0,
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
        // Les bords renvoient le dé vers l'intérieur : il ne peut ni sortir, ni rester collé.
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
        b.hop = Math.min(v / 90, 20) * Math.abs(Math.sin((b.phase * Math.PI) / 0.2))
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
        // La chute accélère, comme sous l'effet de la pesanteur ; le dé finit toujours à plat.
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
        if (aMoves) { a.x = clampX(a.x - nx * overlap * share); a.y = clampY(a.y - ny * overlap * share) }
        if (bMoves) { b.x = clampX(b.x + nx * overlap * share); b.y = clampY(b.y + ny * overlap * share) }
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
    // Filet de sécurité : un dé encore en mouvement est posé d'office, à plat.
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

  return {
    dice: bodies.map((b, i) => ({ frames: frames[i] ?? [], top: topFace(b.base) })),
    settleMs: settle * 1000,
    size,
  }
}

/** Moment où le résultat s'affiche dans le chat, en ms après la réception du lancer par le serveur. */
export const revealDelayMs = (p: ThrowParams, count: number) => THROW_LEAD_MS + simulateThrow(p, count).settleMs

/** Valide un geste reçu par le serveur ; `null` s'il est mal formé. */
export function parseThrow(raw: unknown): ThrowParams | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const num = (v: unknown, min: number, max: number) =>
    typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null
  const w = num(r.w, 100, 8000)
  const h = num(r.h, 100, 8000)
  if (w === null || h === null) return null
  const x = num(r.x, 0, w)
  const y = num(r.y, 0, h)
  const vx = num(r.vx, -20000, 20000)
  const vy = num(r.vy, -20000, 20000)
  const seed = num(r.seed, 0, 0xffffffff)
  const rot = num(r.rot, 0, CUBE_ROTATIONS.length - 1)
  if (x === null || y === null || vx === null || vy === null || seed === null || rot === null) return null
  if (!Number.isInteger(seed) || !Number.isInteger(rot)) return null
  return { x, y, vx, vy, w, h, seed, rot }
}

/* ------------------------------------------------------------------ */
/* Chiffres des faces                                                  */
/* ------------------------------------------------------------------ */

const VIEW = mul(rotation('x', TILT_X), rotation('y', TILT_Y))

/** Orientation de la face vers le joueur : négative quand elle est cachée. */
const facing = (m: Mat, face: number) => {
  const v = mul(VIEW, m)
  const n = faceNormal(face)
  return v[6] * n[0] + v[7] * n[1] + v[8] * n[2]
}
const hidden = (m: Mat, face: number) => facing(m, face) < -0.12
/** Faces opposées dans `FACES` : 0-1, 2-3, 4-5. */
const opposite = (face: number) => face ^ 1

const swap = (labels: number[], a: number, b: number) => {
  const next = [...labels]
  const va = next[a] ?? 1
  next[a] = next[b] ?? 1
  next[b] = va
  return next
}

/** Chiffres définitifs : le résultat sur la face du dessus à l'arrivée. */
export function finalLabels(labels: number[], top: number, result: number, dice: number): number[] {
  if (labels[top] === result) return labels
  const at = labels.indexOf(result)
  if (dice === 6 && at >= 0) return swap(labels, at, top)
  const next = [...labels]
  next[top] = result
  return next
}

/**
 * Changements de chiffres à faire pendant le roulement, à partir de l'image
 * `from`, pour que le résultat finisse sur la face du dessus. Chaque
 * changement attend que les faces touchées soient cachées. Si le dé n'en
 * laisse pas le temps (réponse du serveur tardive, dé qui roule peu), le
 * chiffre change au moment où ces faces sont le plus de biais : mieux vaut un
 * saut visible qu'un faux résultat.
 */
export function steerLabels(
  die: ThrownDie,
  labels: number[],
  result: number,
  dice: number,
  from: number,
): Array<{ frame: number; labels: number[] }> {
  const { frames, top } = die
  if (labels[top] === result) return []
  const start = Math.max(0, Math.min(from, frames.length - 1))
  const target = finalLabels(labels, top, result, dice)
  const changed = target.map((v, k) => (v !== labels[k] ? k : -1)).filter((k) => k >= 0)
  let best = start
  let score = Infinity
  for (let f = start; f < frames.length; f += 1) {
    const m = frames[f]?.m
    const s = m ? Math.max(...changed.map((k) => facing(m, k))) : Infinity
    if (s < score) {
      score = s
      best = f
    }
  }
  const now = [{ frame: best, labels: target }]

  if (dice !== 6 || labels.indexOf(result) < 0) {
    for (let f = start; f < frames.length; f += 1) {
      const m = frames[f]?.m
      if (m && hidden(m, top)) {
        const next = [...labels]
        next[top] = result
        return [{ frame: f, labels: next }]
      }
    }
    return now
  }

  // D6 : le résultat change de face par échanges, entre faces cachées. Deux
  // faces opposées ne sont jamais cachées ensemble : on passe alors par une
  // troisième.
  const steps: Array<{ frame: number; labels: number[] }> = []
  let current = labels
  let at = labels.indexOf(result)
  for (let f = start; f < frames.length; f += 1) {
    const m = frames[f]?.m
    if (!m || !hidden(m, at)) continue
    if (hidden(m, top)) {
      current = swap(current, at, top)
      steps.push({ frame: f, labels: current })
      return steps
    }
    if (at === opposite(top)) {
      const via = FACES.findIndex((_, k) => k !== at && k !== top && hidden(m, k))
      if (via >= 0) {
        current = swap(current, at, via)
        at = via
        steps.push({ frame: f, labels: current })
      }
    }
  }
  return now
}

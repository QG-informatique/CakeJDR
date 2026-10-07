import { Body, Box, ContactMaterial, type GSSolver, Material, Plane, Quaternion, Vec3, World } from 'cannon-es'
import { CUBE_ROTATIONS, FACES, type Mat, faceNormal, mul, rotation } from './cubeMath'

/**
 * Lancer de dés sur la table, à la main.
 *
 * Le joueur attrape le dé, le traîne et le lâche : la vitesse de son geste
 * part avec le dé. C'est un vrai cube soumis à la pesanteur (moteur physique
 * cannon-es) : il culbute dans tous les sens, rebondit sur le tapis, les bords
 * et les autres dés, puis s'arrête toujours à plat.
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

/*
 * Repères. Le plateau est vu de dessus : x vers la droite, y vers le bas,
 * comme à l'écran. Le moteur physique travaille en repère direct, z vers le
 * haut (vers le joueur) : on y retourne l'axe y, et on compte en tailles de
 * dé pour que les réglages tiennent sur tous les écrans.
 */

/** Pesanteur, en tailles de dé par seconde². */
const GRAVITY = 70
/** Sous ces vitesses, un dé est immobile. */
const REST_SPEED = 0.12
const REST_SPIN = 0.25
/** Un dé immobile est à plat quand une de ses faces regarde le ciel à moins de 2,5°. */
const FLAT = Math.cos((2.5 * Math.PI) / 180)
/** Nombre d'images d'immobilité avant de déclarer le lancer fini. */
const REST_FRAMES = 8
/** Sous-pas de simulation par image : assez pour que les chocs restent nets. */
const SUBSTEPS = 3

/** Matrice écran (y vers le bas) ↔ matrice du moteur (y vers le haut). */
const flipY = (m: Mat): Mat => [m[0], -m[1], m[2], -m[3], m[4], -m[5], m[6], -m[7], m[8]]

function toQuat(m: Mat): Quaternion {
  const r = flipY(m)
  const q = new Quaternion()
  const trace = r[0] + r[4] + r[8]
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1)
    q.set((r[7] - r[5]) * s, (r[2] - r[6]) * s, (r[3] - r[1]) * s, 0.25 / s)
  } else if (r[0] > r[4] && r[0] > r[8]) {
    const s = 2 * Math.sqrt(1 + r[0] - r[4] - r[8])
    q.set(0.25 * s, (r[1] + r[3]) / s, (r[2] + r[6]) / s, (r[7] - r[5]) / s)
  } else if (r[4] > r[8]) {
    const s = 2 * Math.sqrt(1 + r[4] - r[0] - r[8])
    q.set((r[1] + r[3]) / s, 0.25 * s, (r[5] + r[7]) / s, (r[2] - r[6]) / s)
  } else {
    const s = 2 * Math.sqrt(1 + r[8] - r[0] - r[4])
    q.set((r[2] + r[6]) / s, (r[5] + r[7]) / s, 0.25 * s, (r[3] - r[1]) / s)
  }
  return q.normalize()
}

function toMat(q: Quaternion): Mat {
  const { x, y, z, w } = q
  return flipY([
    1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w),
    2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w),
    2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y),
  ])
}

/** Combien le dé est à plat : 1 quand une face regarde exactement le ciel. */
const flatness = (q: Quaternion) => {
  const m = toMat(q)
  return Math.max(Math.abs(m[6]), Math.abs(m[7]), Math.abs(m[8]))
}

/** Orientation à plat la plus proche : la face la plus haute est redressée, sans tourner le dé sur lui-même. */
function layFlat(q: Quaternion): Quaternion {
  const axes = [new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, 1)].map((a) => q.vmult(a))
  let best = axes[0] as Vec3
  for (const a of axes) if (Math.abs(a.z) > Math.abs(best.z)) best = a
  const up = best.z >= 0 ? best : best.negate()
  return new Quaternion().setFromVectors(up, new Vec3(0, 0, 1)).mult(q).normalize()
}

/** Face du dessus d'une orientation à plat. */
const upperFace = (m: Mat) => {
  let top = 0
  let best = -Infinity
  FACES.forEach((_, k) => {
    const n = faceNormal(k)
    const z = m[6] * n[0] + m[7] * n[1] + m[8] * n[2]
    if (z > best) {
      best = z
      top = k
    }
  })
  return top
}

/**
 * Simule le lancer de `count` dés lâchés d'un même geste : de vrais cubes,
 * avec leur poids, qui culbutent, rebondissent sur le tapis, les bords et les
 * autres dés, puis s'arrêtent à plat.
 */
export function simulateThrow(p: ThrowParams, count: number): DiceThrow {
  const rand = seeded(p.seed)
  const size = dieSize(p.w, p.h)
  const W = p.w / size
  const H = p.h / size
  const n = Math.max(1, count)

  let vx = p.vx
  let vy = p.vy
  const speed0 = Math.hypot(vx, vy)
  if (speed0 > MAX_THROW_SPEED) {
    vx *= MAX_THROW_SPEED / speed0
    vy *= MAX_THROW_SPEED / speed0
  }

  const world = new World({ gravity: new Vec3(0, 0, -GRAVITY) })
  ;(world.solver as GSSolver).iterations = 12
  const dieMat = new Material('die')
  const floorMat = new Material('floor')
  const wallMat = new Material('wall')
  world.addContactMaterial(new ContactMaterial(dieMat, floorMat, { friction: 0.2, restitution: 0.4 }))
  world.addContactMaterial(new ContactMaterial(dieMat, wallMat, { friction: 0.1, restitution: 0.6 }))
  world.addContactMaterial(new ContactMaterial(dieMat, dieMat, { friction: 0.2, restitution: 0.45 }))

  const floor = new Body({ mass: 0, shape: new Plane(), material: floorMat })
  world.addBody(floor)
  // Quatre bords, tournés vers l'intérieur du plateau.
  const walls: Array<[number, number, number, number, number]> = [
    [0, 0, 0, 1, Math.PI / 2],
    [W, 0, 0, 1, -Math.PI / 2],
    [0, 0, 1, 0, Math.PI / 2],
    [0, -H, 1, 0, -Math.PI / 2],
  ]
  for (const [x, y, ax, ay, angle] of walls) {
    const wall = new Body({ mass: 0, shape: new Plane(), material: wallMat, position: new Vec3(x, y, 0) })
    wall.quaternion.setFromAxisAngle(new Vec3(ax, ay, 0), angle)
    world.addBody(wall)
  }

  // Une poignée de dés : le premier sous la main, les autres serrés autour.
  const clamp = (v: number, max: number) => Math.max(0.55, Math.min(max - 0.55, v))
  const bodies = Array.from({ length: n }, (_, i) => {
    const ring = i === 0 ? 0 : 1 + Math.floor((i - 1) / 6)
    const a = ((i - 1) % 6) * (Math.PI / 3) + ring * 0.5
    const x = clamp(p.x / size + Math.cos(a) * ring * 1.5, W)
    const y = clamp(p.y / size + Math.sin(a) * ring * 1.5, H)
    const turn = (rand() - 0.5) * (n > 1 ? 0.35 : 0.12)
    const k = (0.9 + rand() * 0.2) / size
    const dvx = (Math.cos(turn) * vx - Math.sin(turn) * vy) * k
    const dvy = -(Math.sin(turn) * vx + Math.cos(turn) * vy) * k
    const body = new Body({
      mass: 1,
      shape: new Box(new Vec3(0.5, 0.5, 0.5)),
      material: dieMat,
      position: new Vec3(x, -y, 1.6 + rand() * 0.8 + ring * 0.3),
      quaternion: toQuat(dieRotation(p.rot, i)),
      velocity: new Vec3(dvx, dvy, 2 + rand() * 3),
      linearDamping: 0.03,
      angularDamping: 0.03,
    })
    // Le dé part en culbutant dans le sens du geste, avec un peu de vrille
    // et de travers : il roule dans tous les sens, comme lâché par une main.
    const v = Math.hypot(dvx, dvy)
    const roll = 1.2 + rand() * 0.8
    const twist = () => (rand() - 0.5) * (12 + v * 0.5)
    body.angularVelocity.set(-dvy * roll + twist(), dvx * roll + twist(), twist())
    world.addBody(body)
    return body
  })

  const frames: DieFrame[][] = bodies.map(() => [])
  const record = (i: number, pos: Vec3, q: Quaternion) =>
    frames[i]?.push({ x: pos.x * size, y: -pos.y * size, lift: Math.max(0, pos.z - 0.5) * size, m: toMat(q) })

  // Pour décoincer un dé, on le pousse vers le milieu du plateau, où il y a de la place.
  const towardCentre = (b: Body, speed: number) => {
    const a = Math.atan2(-H / 2 - b.position.y, W / 2 - b.position.x) + (rand() - 0.5) * 1.6
    return new Vec3(Math.cos(a) * speed, Math.sin(a) * speed, 0)
  }
  const resting = bodies.map(() => 0)
  const maxSteps = Math.round(MAX_THROW_S / DT) - 11
  let step = 0
  for (; step < maxSteps; step += 1) {
    for (let s = 0; s < SUBSTEPS; s += 1) world.step(DT / SUBSTEPS)
    bodies.forEach((b, i) => {
      record(i, b.position, b.quaternion)
      const speed = b.velocity.length()
      // Perché sur un autre dé : il glisse et retombe sur le tapis.
      if (b.position.z > 0.9 && speed < 1.5) {
        resting[i] = 0
        b.velocity.copy(towardCentre(b, 4)).z = 1
        return
      }
      const still = speed < REST_SPEED && b.angularVelocity.length() < REST_SPIN
      if (!still) {
        resting[i] = 0
        return
      }
      if (flatness(b.quaternion) >= FLAT && b.position.z < 0.56) {
        resting[i] = (resting[i] ?? 0) + 1
        return
      }
      // Calé contre un bord, sur une arête, ou posé sur un autre dé : une
      // pichenette le remet en route, et il finit par tomber à plat.
      resting[i] = 0
      b.velocity.copy(towardCentre(b, 1.5)).z = 3
      b.angularVelocity.set((rand() - 0.5) * 10, (rand() - 0.5) * 10, 0)
    })
    if (resting.every((r) => r >= REST_FRAMES)) break
  }

  // Pour finir, chaque dé se pose exactement à plat ; ceux qui bougent encore
  // à la limite de temps sont posés d'office, en quelques images.
  const blend = step >= maxSteps ? 10 : 3
  for (let f = 1; f <= blend; f += 1) {
    const t = f / blend
    const ease = t * t * (3 - 2 * t)
    bodies.forEach((b, i) => {
      const target = layFlat(b.quaternion)
      const q = b.quaternion.slerp(target, ease)
      const pos = new Vec3(
        Math.max(0.5, Math.min(W - 0.5, b.position.x)),
        Math.max(-H + 0.5, Math.min(-0.5, b.position.y)),
        0.5 + Math.max(0, b.position.z - 0.5) * (1 - ease),
      )
      record(i, pos, f === blend ? target : q)
    })
  }

  return {
    dice: frames.map((f) => {
      const last = f[f.length - 1]
      return { frames: f, top: last ? upperFace(last.m) : 0 }
    }),
    settleMs: (step + 1 + blend) * FRAME_MS,
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

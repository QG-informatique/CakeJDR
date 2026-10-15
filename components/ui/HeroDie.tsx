'use client'

import { useEffect, useRef } from 'react'

/**
 * Dé de la page d'accueil.
 *
 * Purement décoratif : il se lance tout seul en boucle dans son emplacement,
 * et on peut l'attraper à la souris ou au doigt, le traîner n'importe où sur
 * l'écran et le lancer. Aucun geste n'est nécessaire pour entrer dans
 * l'application : c'est un clin d'œil, pas une porte.
 *
 * Il roule avec une vraie physique : cannon-es, le moteur des dés 3D de la
 * table. Lancé, il part en l'air, retombe sur ses coins, bascule et rebondit
 * sur les bords de l'écran, puis se pose sur une face. L'écran est la table
 * vue de dessus ; seul l'affichage reste en CSS, pour garder le dé tel qu'il
 * a toujours été dessiné.
 *
 * Toute l'animation passe par des refs et `requestAnimationFrame`, en écrivant
 * directement les transformations dans le DOM : un état React mis à jour à
 * chaque image provoquerait soixante rendus par seconde pour rien.
 *
 * Si le système demande de réduire les animations, le dé reste immobile.
 */

const SIZE = 104
const HALF = SIZE / 2
const BORDER = 3
/** Inclinaison du regard sur la table : un dé vu parfaitement de face n'est qu'un carré. */
const TILT_X = -18
const TILT_Y = 24

/** Faces opposées dont la somme fait 7, comme sur un vrai dé. */
const FACES = [
  { value: 1, rx: 0, ry: 0 },
  { value: 6, rx: 0, ry: 180 },
  { value: 3, rx: 0, ry: 90 },
  { value: 4, rx: 0, ry: -90 },
  { value: 2, rx: 90, ry: 0 },
  { value: 5, rx: -90, ry: 0 },
] as const

/** Position des points sur une grille 3×3, en [ligne, colonne]. */
const PIPS: Record<number, ReadonlyArray<readonly [number, number]>> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [1, 0], [2, 0], [0, 2], [1, 2], [2, 2]],
}

function Pips({ value }: { value: number }) {
  const inner = SIZE - BORDER * 2
  const dot = SIZE * 0.15
  const gap = (inner - 3 * dot) / 4
  return (
    <>
      {(PIPS[value] ?? []).map(([row, col]) => (
        <span
          key={`${row}-${col}`}
          style={{
            position: 'absolute',
            top: gap + row * (dot + gap),
            left: gap + col * (dot + gap),
            width: dot,
            height: dot,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #fff, #bbb 70%)',
            boxShadow: 'inset 0 0 3px rgba(0,0,0,0.7)',
          }}
        />
      ))}
    </>
  )
}

/** Un côté du dé (demi-arête) vaut une unité de la physique. */
const UNIT = HALF
/** Hauteur à l'écran : le dé qui s'élève monte un peu, sans sauter d'un bout à l'autre. */
const LIFT = 0.6
/** Soulevé à la main, il flotte à cette hauteur (en pixels à l'écran). */
const HELD = 18

type Vec = { x: number; y: number }
type Quat = { x: number; y: number; z: number; w: number }
type Mode = 'rest' | 'roll' | 'drag' | 'thrown' | 'wait' | 'home'

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const rand = (min: number, max: number) => min + Math.random() * (max - min)
const sign = () => (Math.random() < 0.5 ? -1 : 1)
const randInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1))

/** Produit de deux rotations : `b` d'abord, puis `a`. */
function qMul(a: Quat, b: Quat): Quat {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  }
}

/** Rotation d'un angle (en degrés) autour d'un axe de l'écran. */
function qAxis(axis: 'x' | 'y', deg: number): Quat {
  const h = (deg * Math.PI) / 360
  return axis === 'x' ? { x: Math.sin(h), y: 0, z: 0, w: Math.cos(h) } : { x: 0, y: Math.sin(h), z: 0, w: Math.cos(h) }
}

/** Rotation au format CSS (`matrix3d` se lit colonne par colonne). */
function quatToCss({ x, y, z, w }: Quat) {
  const r = [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w),
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w),
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y),
  ].map((v) => v.toFixed(5))
  return `matrix3d(${r[0]},${r[1]},${r[2]},0,${r[3]},${r[4]},${r[5]},0,${r[6]},${r[7]},${r[8]},0,0,0,0,1)`
}

/**
 * L'orientation « bien rangée » la plus proche : chaque axe du dé sur un axe de
 * l'écran. Le dé rentre à sa place une face vers le haut et bien droit.
 */
function squared(q: Quat): Quat {
  const { x, y, z, w } = q
  // Colonnes de la matrice : où vont les axes du dé.
  const cols = [
    [1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w)],
    [2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w)],
    [2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y)],
  ]
  const used = new Set<number>()
  const m = cols.map(() => [0, 0, 0])
  // Les axes les plus nets d'abord, pour qu'aucun ne prenne la place d'un autre.
  const order = [0, 1, 2].sort(
    (a, b) => Math.max(...cols[b]!.map(Math.abs)) - Math.max(...cols[a]!.map(Math.abs)),
  )
  for (const c of order) {
    let best = -1
    for (let k = 0; k < 3; k += 1) {
      if (used.has(k)) continue
      if (best < 0 || Math.abs(cols[c]![k]!) > Math.abs(cols[c]![best]!)) best = k
    }
    used.add(best)
    m[c]![best] = cols[c]![best]! < 0 ? -1 : 1
  }
  // Un miroir n'est pas une rotation : on retourne le dernier axe s'il le faut.
  const [a, b, c] = m as [number[], number[], number[]]
  const det =
    a[0]! * (b[1]! * c[2]! - b[2]! * c[1]!) -
    b[0]! * (a[1]! * c[2]! - a[2]! * c[1]!) +
    c[0]! * (a[1]! * b[2]! - a[2]! * b[1]!)
  if (det < 0) {
    const last = m[order[2]!]!
    for (let k = 0; k < 3; k += 1) last[k] = -last[k]!
  }
  // Matrice (rangée ligne par ligne) vers quaternion.
  const r00 = m[0]![0]!, r10 = m[0]![1]!, r20 = m[0]![2]!
  const r01 = m[1]![0]!, r11 = m[1]![1]!, r21 = m[1]![2]!
  const r02 = m[2]![0]!, r12 = m[2]![1]!, r22 = m[2]![2]!
  const tr = r00 + r11 + r22
  let out: Quat
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2
    out = { w: s / 4, x: (r21 - r12) / s, y: (r02 - r20) / s, z: (r10 - r01) / s }
  } else if (r00 > r11 && r00 > r22) {
    const s = Math.sqrt(1 + r00 - r11 - r22) * 2
    out = { w: (r21 - r12) / s, x: s / 4, y: (r01 + r10) / s, z: (r02 + r20) / s }
  } else if (r11 > r22) {
    const s = Math.sqrt(1 + r11 - r00 - r22) * 2
    out = { w: (r02 - r20) / s, x: (r01 + r10) / s, y: s / 4, z: (r12 + r21) / s }
  } else {
    const s = Math.sqrt(1 + r22 - r00 - r11) * 2
    out = { w: (r10 - r01) / s, x: (r02 + r20) / s, y: (r12 + r21) / s, z: s / 4 }
  }
  // Même hémisphère que le départ, pour tourner par le plus court chemin.
  if (out.x * q.x + out.y * q.y + out.z * q.z + out.w * q.w < 0) {
    out = { x: -out.x, y: -out.y, z: -out.z, w: -out.w }
  }
  return out
}

function slerp(a: Quat, b: Quat, t: number): Quat {
  let cos = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w
  let bb = b
  if (cos < 0) {
    cos = -cos
    bb = { x: -b.x, y: -b.y, z: -b.z, w: -b.w }
  }
  let ka = 1 - t
  let kb = t
  if (cos < 0.9995) {
    const angle = Math.acos(cos)
    const sin = Math.sin(angle)
    ka = Math.sin((1 - t) * angle) / sin
    kb = Math.sin(t * angle) / sin
  }
  const q = {
    x: a.x * ka + bb.x * kb,
    y: a.y * ka + bb.y * kb,
    z: a.z * ka + bb.z * kb,
    w: a.w * ka + bb.w * kb,
  }
  const n = Math.hypot(q.x, q.y, q.z, q.w) || 1
  return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n }
}

export default function HeroDie({ dockId }: { dockId: string }) {
  const dieRef = useRef<HTMLDivElement>(null)
  const cubeRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const die = dieRef.current
    const cube = cubeRef.current
    const shadow = shadowRef.current
    if (!die || !cube || !shadow) return

    // Point de repos : le centre de l'emplacement réservé dans le panneau.
    const home: Vec = { x: window.innerWidth / 2, y: window.innerHeight * 0.2 }
    const measureHome = () => {
      const dock = document.getElementById(dockId)
      if (!dock) return
      const r = dock.getBoundingClientRect()
      home.x = r.left + r.width / 2
      // Légèrement sous le centre, pour laisser la place aux rebonds.
      home.y = r.top + r.height / 2 + 8
    }

    /** Pose affichée : position à l'écran, hauteur au-dessus du sol, orientation. */
    const view = {
      pos: { x: 0, y: 0 } as Vec,
      lift: 0,
      quat: { x: 0, y: 0, z: 0, w: 1 } as Quat,
      lean: { x: 0, y: 0 } as Vec,
      leanTarget: { x: 0, y: 0 } as Vec,
    }

    const render = () => {
      const { pos, lift, quat, lean } = view
      die.style.transform = `translate3d(${pos.x - HALF}px, ${pos.y - HALF - lift}px, 0)`
      cube.style.transform =
        `rotateX(${TILT_X}deg) rotateY(${TILT_Y}deg) ` +
        `rotateX(${lean.x}deg) rotateY(${lean.y}deg) ${quatToCss(quat)}`
      // L'ombre reste au sol et s'estompe quand le dé s'élève.
      const k = 1 - Math.min(lift, 40) / 80
      shadow.style.transform = `translate3d(${pos.x - HALF}px, ${pos.y + HALF * 0.62}px, 0) scale(${k})`
      shadow.style.opacity = String(0.55 * k)
    }

    measureHome()
    view.pos = { ...home }
    render()
    die.style.opacity = '1'

    // Animations réduites : un dé posé, immobile, qui suit simplement sa place.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      die.style.pointerEvents = 'none'
      die.style.cursor = 'default'
      const place = () => {
        measureHome()
        view.pos = { ...home }
        render()
      }
      window.addEventListener('resize', place)
      window.addEventListener('scroll', place, { passive: true })
      return () => {
        window.removeEventListener('resize', place)
        window.removeEventListener('scroll', place)
      }
    }

    let stopped = false
    let cleanup = () => {}

    // Le moteur physique n'est chargé qu'une fois la page affichée.
    void import('cannon-es').then((CANNON) => {
      if (stopped) return

      // L'écran est la table vue de dessus : x vers la droite, y vers le bas,
      // z vers nous. La pesanteur tire le dé vers le fond de l'écran.
      const world = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, -60) })
      world.allowSleep = false
      const dieMat = new CANNON.Material('de')
      const floorMat = new CANNON.Material('table')
      const wallMat = new CANNON.Material('bord')
      world.addContactMaterial(
        new CANNON.ContactMaterial(dieMat, floorMat, { friction: 0.45, restitution: 0.42 }),
      )
      world.addContactMaterial(
        new CANNON.ContactMaterial(dieMat, wallMat, { friction: 0.1, restitution: 0.6 }),
      )

      const floor = new CANNON.Body({ mass: 0, material: floorMat, shape: new CANNON.Plane() })
      world.addBody(floor)
      // Les quatre bords de l'écran, comme les bords d'une piste de dés.
      const walls = [
        { euler: [0, Math.PI / 2, 0] }, // gauche
        { euler: [0, -Math.PI / 2, 0] }, // droite
        { euler: [-Math.PI / 2, 0, 0] }, // haut
        { euler: [Math.PI / 2, 0, 0] }, // bas
      ].map(({ euler }) => {
        const b = new CANNON.Body({ mass: 0, material: wallMat, shape: new CANNON.Plane() })
        b.quaternion.setFromEuler(euler[0]!, euler[1]!, euler[2]!)
        world.addBody(b)
        return b
      })
      const placeWalls = () => {
        const w = window.innerWidth / UNIT
        const h = window.innerHeight / UNIT
        walls[0]!.position.set(0, 0, 0)
        walls[1]!.position.set(w, 0, 0)
        walls[2]!.position.set(0, 0, 0)
        walls[3]!.position.set(0, h, 0)
      }
      placeWalls()

      const body = new CANNON.Body({
        mass: 1,
        material: dieMat,
        shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
        linearDamping: 0.08,
        angularDamping: 0.12,
      })
      body.position.set(home.x / UNIT, home.y / UNIT, 1)
      world.addBody(body)

      const s = {
        mode: 'rest' as Mode,
        t0: 0,
        dur: 0,
        until: performance.now() + 700,
        /** Depuis quand le dé ne bouge presque plus. */
        still: 0,
        posFrom: { x: 0, y: 0 } as Vec,
        quatFrom: { x: 0, y: 0, z: 0, w: 1 } as Quat,
        quatTo: { x: 0, y: 0, z: 0, w: 1 } as Quat,
        /** Petit lancer sur place : quarts de tour autour des axes de l'écran. */
        spin: { x: 0, y: 0 } as Vec,
        grab: { x: 0, y: 0 } as Vec,
        samples: [] as Array<{ x: number; y: number; t: number }>,
        pointerId: -1,
      }

      /** Le dé lâché à sa pose actuelle : la physique reprend la main. */
      const release = (vx: number, vy: number, vz: number, w: Vec & { z: number }) => {
        body.position.set(view.pos.x / UNIT, view.pos.y / UNIT, 1 + view.lift / (UNIT * LIFT))
        body.quaternion.set(view.quat.x, view.quat.y, view.quat.z, view.quat.w)
        body.velocity.set(vx, vy, vz)
        body.angularVelocity.set(w.x, w.y, w.z)
        body.wakeUp()
        s.still = 0
        s.t0 = performance.now()
      }

      /**
       * Petit lancer sur place, comme le tout premier dé : quelques quarts de
       * tour et deux rebonds, sans quitter son emplacement.
       */
      const startRoll = (now: number) => {
        s.mode = 'roll'
        s.t0 = now
        s.dur = 1200
        s.quatFrom = squared(view.quat)
        s.spin = { x: sign() * randInt(2, 5) * 90, y: sign() * randInt(2, 5) * 90 }
      }

      /** Retour à l'emplacement, bien droit. */
      const goHome = (now: number) => {
        s.mode = 'home'
        s.t0 = now
        s.dur = 750
        s.posFrom = { ...view.pos }
        s.quatFrom = { ...view.quat }
        s.quatTo = squared(view.quat)
      }

      const readBody = () => {
        view.pos.x = body.position.x * UNIT
        view.pos.y = body.position.y * UNIT
        view.lift = Math.max(0, body.position.z - 1) * UNIT * LIFT
        const q = body.quaternion
        view.quat = { x: q.x, y: q.y, z: q.z, w: q.w }
      }

      /** Le dé ne bouge plus depuis un instant (ou roule depuis trop longtemps). */
      const settled = (now: number, dt: number) => {
        // Calé de travers contre un bord, il compte aussi comme posé.
        const calm = body.velocity.length() < 0.25 && body.angularVelocity.length() < 0.4
        s.still = calm ? s.still + dt : 0
        return s.still > 0.25 || now - s.t0 > 7000
      }

      let raf = 0
      let last = performance.now()

      const frame = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.05)
        last = now

        switch (s.mode) {
          case 'rest':
            measureHome()
            view.pos = { ...home }
            view.lift = 0
            if (now >= s.until) startRoll(now)
            break

          case 'roll': {
            measureHome()
            view.pos = { ...home }
            const t = Math.min((now - s.t0) / s.dur, 1)
            const e = easeOut(t)
            view.quat = qMul(qAxis('x', s.spin.x * e), qMul(qAxis('y', s.spin.y * e), s.quatFrom))
            view.lift = Math.abs(Math.sin(t * Math.PI * 2)) * 26 * (1 - t)
            if (t >= 1) {
              view.quat = squared(view.quat)
              view.lift = 0
              s.mode = 'rest'
              s.until = now + 1800
            }
            break
          }

          case 'drag':
            // La position suit le pointeur ; tenu en main, le dé ne roule pas.
            break

          case 'thrown':
            world.step(1 / 120, dt, 10)
            readBody()
            if (settled(now, dt)) {
              s.mode = 'wait'
              s.until = now + 2600
            }
            break

          case 'wait':
            if (now >= s.until) goHome(now)
            break

          case 'home': {
            measureHome()
            const t = Math.min((now - s.t0) / s.dur, 1)
            const e = easeInOut(t)
            view.pos.x = s.posFrom.x + (home.x - s.posFrom.x) * e
            view.pos.y = s.posFrom.y + (home.y - s.posFrom.y) * e
            view.lift = Math.sin(t * Math.PI) * 30
            view.quat = slerp(s.quatFrom, s.quatTo, e)
            if (t >= 1) {
              view.pos = { ...home }
              view.lift = 0
              view.quat = { ...s.quatTo }
              s.mode = 'rest'
              s.until = now + 600
            }
            break
          }
        }

        // Inclinaison du dé tenu : elle suit le mouvement, puis se redresse.
        const follow = 1 - Math.exp(-12 * dt)
        view.lean.x += (view.leanTarget.x - view.lean.x) * follow
        view.lean.y += (view.leanTarget.y - view.lean.y) * follow
        const relax = Math.exp(-8 * dt)
        view.leanTarget.x *= relax
        view.leanTarget.y *= relax

        render()
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)

      const onDown = (e: PointerEvent) => {
        e.preventDefault()
        // Capturer le pointeur garde le glisser même si le curseur sort du dé.
        // Les écouteurs étant posés sur la fenêtre, le dé reste utilisable si le
        // navigateur refuse la capture.
        try {
          die.setPointerCapture(e.pointerId)
        } catch {
          // capture refusée : les écouteurs de fenêtre prennent le relais
        }
        s.pointerId = e.pointerId
        s.mode = 'drag'
        // Soulevé : il s'élève et son ombre rétrécit.
        view.lift = HELD
        s.grab = { x: e.clientX - view.pos.x, y: e.clientY - view.pos.y }
        s.samples = [{ x: e.clientX, y: e.clientY, t: performance.now() }]
        die.style.cursor = 'grabbing'
      }

      const onMove = (e: PointerEvent) => {
        if (s.mode !== 'drag' || e.pointerId !== s.pointerId) return
        const nx = Math.max(HALF, Math.min(window.innerWidth - HALF, e.clientX - s.grab.x))
        const ny = Math.max(HALF, Math.min(window.innerHeight - HALF, e.clientY - s.grab.y))
        // Tenu en main, il ne roule pas : il penche seulement dans le sens du mouvement.
        const clamp = (v: number) => Math.max(-14, Math.min(14, v))
        view.leanTarget.x = clamp(-(ny - view.pos.y) * 1.6)
        view.leanTarget.y = clamp((nx - view.pos.x) * 1.6)
        view.pos.x = nx
        view.pos.y = ny
        s.samples.push({ x: e.clientX, y: e.clientY, t: performance.now() })
        if (s.samples.length > 6) s.samples.shift()
      }

      const onUp = (e: PointerEvent) => {
        if (s.mode !== 'drag' || e.pointerId !== s.pointerId) return
        try {
          die.releasePointerCapture(e.pointerId)
        } catch {
          // la capture peut déjà avoir été relâchée par le navigateur
        }
        die.style.cursor = 'grab'

        // Vitesse de lancer : mesurée sur les derniers mouvements seulement, pour
        // qu'un geste qui ralentit avant de lâcher ne soit pas pris pour un lancer.
        const now = performance.now()
        const first = s.samples.find((p) => now - p.t < 120) ?? s.samples[0]
        const lastSample = s.samples[s.samples.length - 1]
        let vx = 0
        let vy = 0
        if (first && lastSample && lastSample.t > first.t) {
          const span = (lastSample.t - first.t) / 1000
          vx = (lastSample.x - first.x) / span
          vy = (lastSample.y - first.y) / span
        }
        const speed = Math.hypot(vx, vy)
        const MAX_SPEED = 2600
        if (speed > MAX_SPEED) {
          vx *= MAX_SPEED / speed
          vy *= MAX_SPEED / speed
        }
        // En unités de la physique.
        vx /= UNIT
        vy /= UNIT
        const v = Math.hypot(vx, vy)
        // Lancé, il part en l'air en tournant dans le sens du lancer, avec un
        // peu de désordre : c'est la table qui décide de la suite.
        const spin = 0.7
        release(vx, vy, 3 + v * 0.12, {
          x: -vy * spin + rand(-1, 1) * (2 + v * 0.2),
          y: vx * spin + rand(-1, 1) * (2 + v * 0.2),
          z: rand(-1, 1) * (1 + v * 0.15),
        })
        s.mode = 'thrown'
      }

      die.addEventListener('pointerdown', onDown)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
      window.addEventListener('resize', placeWalls)

      cleanup = () => {
        cancelAnimationFrame(raf)
        die.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        window.removeEventListener('resize', placeWalls)
      }
    })

    return () => {
      stopped = true
      cleanup()
    }
  }, [dockId])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      <div
        ref={shadowRef}
        className="absolute left-0 top-0"
        style={{
          width: SIZE,
          height: SIZE * 0.28,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6), transparent 70%)',
          opacity: 0,
          willChange: 'transform',
        }}
      />
      <div
        ref={dieRef}
        className="pointer-events-auto absolute left-0 top-0 touch-none select-none"
        style={{
          width: SIZE,
          height: SIZE,
          perspective: 520,
          cursor: 'grab',
          opacity: 0,
          transition: 'opacity 0.5s ease',
          willChange: 'transform',
        }}
      >
        <div
          ref={cubeRef}
          style={{
            position: 'relative',
            width: SIZE,
            height: SIZE,
            transformStyle: 'preserve-3d',
          }}
        >
          {FACES.map((f) => (
            <div
              key={f.value}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(145deg,#181818,#0f0f0f)',
                border: `${BORDER}px solid var(--c-brand)`,
                borderRadius: 14,
                boxShadow: '0 4px 10px rgba(0,0,0,0.6), inset 0 0 12px color-mix(in srgb, var(--c-brand) 15%, transparent)',
                transform: `rotateX(${f.rx}deg) rotateY(${f.ry}deg) translateZ(${HALF}px)`,
                backfaceVisibility: 'hidden',
              }}
            >
              <Pips value={f.value} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

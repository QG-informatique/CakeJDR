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
 * table, avec leurs réglages. Lancé, il retombe sur ses coins, bascule,
 * rebondit sur les bords de l'écran, puis se pose sur une face. L'écran est
 * une table vue en perspective, un peu en biais ; l'affichage reste en CSS,
 * pour garder le dé tel qu'il a toujours été dessiné.
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

/** Une demi-arête du dé vaut une unité de la physique. */
const UNIT = HALF
/**
 * La table est vue d'un peu en biais, avec une vraie perspective : le dé qui
 * s'élève grossit et son ombre s'éloigne, au lieu de glisser vers le haut de
 * l'écran.
 */
const PERSPECTIVE = 1800
const PITCH = 22
/** Au repos, le dé est tourné de biais sur la table : on voit trois faces. */
const YAW = 26
/** Hauteur du centre du dé tenu en main (en pixels au-dessus de la table). */
const HELD = HALF + 34

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

/** Rotation d'un angle (en degrés) autour d'un axe de la table (vecteur unitaire). */
function qAround(ax: number, ay: number, az: number, deg: number): Quat {
  const h = (deg * Math.PI) / 360
  const s = Math.sin(h)
  return { x: ax * s, y: ay * s, z: az * s, w: Math.cos(h) }
}

const qInv = (q: Quat): Quat => ({ x: -q.x, y: -q.y, z: -q.z, w: q.w })

/** Le biais du dé au repos, autour de la verticale. */
const Q_YAW = qAround(0, 0, 1, YAW)

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
 * la table, une face vers le haut.
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

/** Posé bien droit sur une face, avec le biais du repos. */
const restPose = (q: Quat): Quat => {
  const out = qMul(Q_YAW, squared(qMul(qInv(Q_YAW), q)))
  return out.x * q.x + out.y * q.y + out.z * q.z + out.w * q.w < 0
    ? { x: -out.x, y: -out.y, z: -out.z, w: -out.w }
    : out
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
  const sceneRef = useRef<HTMLDivElement>(null)
  const dieRef = useRef<HTMLDivElement>(null)
  const cubeRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scene = sceneRef.current
    const die = dieRef.current
    const cube = cubeRef.current
    const shadow = shadowRef.current
    if (!scene || !die || !cube || !shadow) return

    // Repère de la table : origine au centre de l'écran, x vers la droite,
    // y vers le bas de l'écran, z vers le haut (vers nous). En pixels.
    const screen = { w: 0, h: 0 }
    const measureScreen = () => {
      screen.w = scene.clientWidth
      screen.h = scene.clientHeight
    }
    const sin = Math.sin((PITCH * Math.PI) / 180)
    const cos = Math.cos((PITCH * Math.PI) / 180)
    /** Point de l'écran → point de la table à la hauteur `z`. */
    const toTable = (sx: number, sy: number, z: number): Vec => {
      const a = sx - screen.w / 2
      const b = sy - screen.h / 2
      const P = PERSPECTIVE
      const y = (b * P - b * z * cos + P * z * sin) / (P * cos + b * sin)
      const k = P / (P - y * sin - z * cos)
      return { x: a / k, y }
    }
    /** Point de la table → point de l'écran. */
    const toScreen = (x: number, y: number, z: number): Vec => {
      const k = PERSPECTIVE / (PERSPECTIVE - y * sin - z * cos)
      return { x: screen.w / 2 + x * k, y: screen.h / 2 + (y * cos - z * sin) * k }
    }

    // Point de repos : le centre de l'emplacement réservé dans le panneau.
    const home: Vec = { x: 0, y: 0 }
    const measureHome = () => {
      const dock = document.getElementById(dockId)
      const r = dock?.getBoundingClientRect()
      const p = r
        ? toTable(r.left + r.width / 2, r.top + r.height / 2 + 8, HALF)
        : toTable(screen.w / 2, screen.h * 0.2, HALF)
      home.x = p.x
      home.y = p.y
    }

    /** Pose affichée : position sur la table, hauteur du centre, orientation. */
    const view = {
      pos: { x: 0, y: 0 } as Vec,
      z: HALF,
      quat: Q_YAW,
    }

    const render = () => {
      const { pos, z, quat } = view
      const left = screen.w / 2 + pos.x - HALF
      const top = screen.h / 2 + pos.y - HALF
      die.style.transform = `translate3d(${left}px, ${top}px, ${z}px)`
      cube.style.transform = quatToCss(quat)
      // L'ombre reste sur la table, s'élargit et pâlit quand le dé s'élève.
      const up = Math.min(Math.max(z - HALF, 0), SIZE * 3) / SIZE
      shadow.style.transform = `translate3d(${left + 6 + up * 10}px, ${top + 6 + up * 10}px, 0.5px) scale(${1.1 + up * 0.3})`
      shadow.style.opacity = String(0.65 / (1 + up * 1.5))
    }

    measureScreen()
    measureHome()
    view.pos = { ...home }
    render()
    scene.style.opacity = '1'

    // Animations réduites : un dé posé, immobile, qui suit simplement sa place.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      die.style.pointerEvents = 'none'
      die.style.cursor = 'default'
      const place = () => {
        measureScreen()
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

      // Réglages des dés de la table (@3d-dice/dice-box-threejs), ramenés à la
      // taille du dé. Les rebonds sont plus mous : ce dé-ci est vu de près, et
      // un rebond qui passe inaperçu sur la table le ferait sauter ici.
      const world = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, -45) })
      world.allowSleep = false
      ;(world.solver as InstanceType<typeof CANNON.GSSolver>).iterations = 14
      const dieMat = new CANNON.Material('de')
      const floorMat = new CANNON.Material('table')
      const wallMat = new CANNON.Material('bord')
      world.addContactMaterial(
        new CANNON.ContactMaterial(dieMat, floorMat, { friction: 0.6, restitution: 0.35 }),
      )
      world.addContactMaterial(
        new CANNON.ContactMaterial(dieMat, wallMat, { friction: 0.3, restitution: 0.5 }),
      )

      const floor = new CANNON.Body({ mass: 0, material: floorMat, shape: new CANNON.Plane() })
      world.addBody(floor)
      // Les bords de l'écran, comme les bords d'une piste de dés. Vus en
      // perspective, ils dessinent sur la table un trapèze, plus large au fond.
      const walls = [0, 1, 2, 3].map(() => {
        const b = new CANNON.Body({ mass: 0, material: wallMat, shape: new CANNON.Plane() })
        world.addBody(b)
        return b
      })
      /** Chaque bord sur la table : un point et sa normale vers l'intérieur. */
      const edges: Array<{ x: number; y: number; nx: number; ny: number }> = []
      const placeWalls = () => {
        edges.length = 0
        // Les coins de l'écran à hauteur du dessus du dé : posé contre un bord,
        // il reste entièrement visible.
        const c = [
          toTable(0, 0, SIZE),
          toTable(screen.w, 0, SIZE),
          toTable(screen.w, screen.h, SIZE),
          toTable(0, screen.h, SIZE),
        ].map((p) => ({ x: p.x / UNIT, y: p.y / UNIT }))
        const mid = { x: 0, y: (c[0]!.y + c[2]!.y) / 2 }
        c.forEach((a, i) => {
          const b = c[(i + 1) % 4]!
          // Normale dans le plan de la table, tournée vers l'intérieur.
          let nx = b.y - a.y
          let ny = a.x - b.x
          if (nx * (mid.x - a.x) + ny * (mid.y - a.y) < 0) {
            nx = -nx
            ny = -ny
          }
          const n = Math.hypot(nx, ny) || 1
          const wall = walls[i]!
          edges.push({ x: a.x, y: a.y, nx: nx / n, ny: ny / n })
          wall.position.set(a.x, a.y, 0)
          wall.quaternion.setFromVectors(
            new CANNON.Vec3(0, 0, 1),
            new CANNON.Vec3(nx / n, ny / n, 0),
          )
        })
      }
      placeWalls()

      const body = new CANNON.Body({
        mass: 1,
        material: dieMat,
        shape: new CANNON.Box(new CANNON.Vec3(1, 1, 1)),
        linearDamping: 0.1,
        angularDamping: 0.1,
      })
      body.position.set(home.x / UNIT, home.y / UNIT, 1)
      world.addBody(body)
      // Jamais de bond plus haut que le dé lui-même, même lancé fort contre un bord.
      world.addEventListener('postStep', () => {
        if (body.velocity.z > 9) body.velocity.z = 9
      })

      const s = {
        mode: 'rest' as Mode,
        t0: 0,
        dur: 0,
        until: performance.now() + 700,
        /** Depuis combien de temps le dé ne bouge presque plus (en secondes). */
        still: 0,
        posFrom: { x: 0, y: 0 } as Vec,
        zFrom: HALF,
        quatFrom: Q_YAW,
        quatTo: Q_YAW,
        /** Petit lancer sur place : quarts de tour autour des axes du dé au repos. */
        spin: { x: 0, y: 0 } as Vec,
        grab: { x: 0, y: 0 } as Vec,
        samples: [] as Array<{ x: number; y: number; t: number }>,
        pointerId: -1,
      }

      const resize = () => {
        measureScreen()
        measureHome()
        placeWalls()
      }

      // Axes du dé au repos, tournés du biais du repos.
      const yaw = (YAW * Math.PI) / 180
      const axisX = [Math.cos(yaw), Math.sin(yaw), 0] as const
      const axisY = [-Math.sin(yaw), Math.cos(yaw), 0] as const

      /**
       * Petit lancer sur place, comme le tout premier dé : quelques quarts de
       * tour et deux rebonds, sans quitter son emplacement.
       */
      const startRoll = (now: number) => {
        s.mode = 'roll'
        s.t0 = now
        s.dur = 1200
        s.quatFrom = restPose(view.quat)
        s.spin = { x: sign() * randInt(2, 5) * 90, y: sign() * randInt(2, 5) * 90 }
      }

      /** Retour à l'emplacement, posé droit. */
      const goHome = (now: number) => {
        s.mode = 'home'
        s.t0 = now
        s.dur = 750
        s.posFrom = { ...view.pos }
        s.zFrom = view.z
        s.quatFrom = { ...view.quat }
        s.quatTo = restPose(view.quat)
      }

      const readBody = () => {
        view.pos = { x: body.position.x * UNIT, y: body.position.y * UNIT }
        view.z = body.position.z * UNIT
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
            view.z = HALF
            if (now >= s.until) startRoll(now)
            break

          case 'roll': {
            measureHome()
            view.pos = { ...home }
            const t = Math.min((now - s.t0) / s.dur, 1)
            const e = easeOut(t)
            view.quat = qMul(
              qAround(...axisX, s.spin.x * e),
              qMul(qAround(...axisY, s.spin.y * e), s.quatFrom),
            )
            view.z = HALF + Math.abs(Math.sin(t * Math.PI * 2)) * 44 * (1 - t)
            if (t >= 1) {
              view.quat = restPose(view.quat)
              view.z = HALF
              s.mode = 'rest'
              s.until = now + 1800
            }
            break
          }

          case 'drag':
            // Soulevé en douceur ; la position et la rotation suivent la main.
            view.z += (HELD - view.z) * (1 - Math.exp(-14 * dt))
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
            view.pos = {
              x: s.posFrom.x + (home.x - s.posFrom.x) * e,
              y: s.posFrom.y + (home.y - s.posFrom.y) * e,
            }
            view.z = s.zFrom + (HALF - s.zFrom) * e + Math.sin(t * Math.PI) * 60
            view.quat = slerp(s.quatFrom, s.quatTo, e)
            if (t >= 1) {
              view.pos = { ...home }
              view.z = HALF
              view.quat = { ...s.quatTo }
              s.mode = 'rest'
              s.until = now + 600
            }
            break
          }
        }

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
        const at = toScreen(view.pos.x, view.pos.y, view.z)
        s.grab = { x: e.clientX - at.x, y: e.clientY - at.y }
        s.samples = [{ ...view.pos, t: performance.now() }]
        die.style.cursor = 'grabbing'
      }

      const onMove = (e: PointerEvent) => {
        if (s.mode !== 'drag' || e.pointerId !== s.pointerId) return
        const sx = Math.max(HALF, Math.min(screen.w - HALF, e.clientX - s.grab.x))
        const sy = Math.max(HALF, Math.min(screen.h - HALF, e.clientY - s.grab.y))
        const p = toTable(sx, sy, view.z)
        // Tenu en main, il ne passe pas les bords : sinon le moteur, au lâcher,
        // le recracherait d'un coup hors du mur.
        for (const w of edges) {
          const d = (p.x / UNIT - w.x) * w.nx + (p.y / UNIT - w.y) * w.ny
          if (d < 1.75) {
            p.x += (1.75 - d) * w.nx * UNIT
            p.y += (1.75 - d) * w.ny * UNIT
          }
        }
        // Comme le tout premier dé, il roule dans le sens où on le traîne : il
        // quitte la main de travers, et retombe sur ses coins.
        const dx = p.x - view.pos.x
        const dy = p.y - view.pos.y
        const d = Math.hypot(dx, dy)
        if (d > 0.01) {
          const q = qMul(qAround(-dy / d, dx / d, 0, ((d / HALF) * 180) / Math.PI), view.quat)
          const n = Math.hypot(q.x, q.y, q.z, q.w) || 1
          view.quat = { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n }
        }
        view.pos = p
        s.samples.push({ ...p, t: performance.now() })
        if (s.samples.length > 8) s.samples.shift()
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
        const first = s.samples.find((p) => now - p.t < 120) ?? s.samples[s.samples.length - 1]
        const lastSample = s.samples[s.samples.length - 1]
        let vx = 0
        let vy = 0
        if (first && lastSample && lastSample.t > first.t) {
          const span = (lastSample.t - first.t) / 1000
          vx = (lastSample.x - first.x) / span / UNIT
          vy = (lastSample.y - first.y) / span / UNIT
        }
        const speed = Math.hypot(vx, vy)
        const MAX_SPEED = 40
        if (speed > MAX_SPEED) {
          vx *= MAX_SPEED / speed
          vy *= MAX_SPEED / speed
        }
        const v = Math.min(speed, MAX_SPEED)
        // Lâché de la main : il roule dans le sens du lancer, avec du désordre
        // sur tous les axes, comme les dés de la table.
        const mess = 2 + v * 0.1
        body.position.set(view.pos.x / UNIT, view.pos.y / UNIT, view.z / UNIT)
        body.quaternion.set(view.quat.x, view.quat.y, view.quat.z, view.quat.w)
        body.velocity.set(vx, vy, -1)
        body.angularVelocity.set(
          -vy * 0.8 + rand(-1, 1) * mess,
          vx * 0.8 + rand(-1, 1) * mess,
          rand(-1, 1) * mess,
        )
        body.wakeUp()
        s.still = 0
        s.t0 = now
        s.mode = 'thrown'
      }

      die.addEventListener('pointerdown', onDown)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
      window.addEventListener('resize', resize)

      cleanup = () => {
        cancelAnimationFrame(raf)
        die.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        window.removeEventListener('resize', resize)
      }
    })

    return () => {
      stopped = true
      cleanup()
    }
  }, [dockId])

  return (
    <div
      ref={sceneRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      style={{ perspective: PERSPECTIVE, opacity: 0, transition: 'opacity 0.5s ease' }}
    >
      {/* La table, inclinée : tout ce qu'elle porte est vu en perspective. */}
      <div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d', transform: `rotateX(${PITCH}deg)` }}
      >
        <div
          ref={shadowRef}
          className="absolute left-0 top-0"
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: '50%',
            background: 'radial-gradient(circle at center, rgba(0,0,0,0.7), transparent 68%)',
            willChange: 'transform',
          }}
        />
        <div
          ref={dieRef}
          className="pointer-events-auto absolute left-0 top-0 touch-none select-none"
          style={{
            width: SIZE,
            height: SIZE,
            cursor: 'grab',
            transformStyle: 'preserve-3d',
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
    </div>
  )
}

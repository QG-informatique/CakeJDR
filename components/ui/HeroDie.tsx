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
 * Le roulement imite un vrai dé. Un cube posé ne tourne pas en continu : il
 * bascule par-dessus une de ses arêtes, un quart de tour à la fois. Chaque
 * bascule est donc une rotation de 90° autour d'un axe de la table, dans le
 * sens du déplacement, et le dé est toujours à plat entre deux bascules.
 * Quand l'élan manque au milieu d'une bascule, il retombe sur la face d'où il
 * venait s'il n'avait pas franchi l'arête, sinon il passe de l'autre côté ;
 * puis il oscille un instant avant de s'immobiliser.
 *
 * L'orientation est tenue sous forme de matrice, et chaque bascule s'applique
 * dans le repère de la table. Des angles d'Euler cumulés tournaient dans le
 * repère du dé : une fois celui-ci couché sur le côté, ses axes ne suivaient
 * plus le sens du lancer, d'où un roulement de travers.
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

/* ------------------------------------------------------------------ */
/* Rotations                                                           */
/* ------------------------------------------------------------------ */

/** Matrice de rotation 3×3, rangée ligne par ligne. */
type Mat = [number, number, number, number, number, number, number, number, number]
type Axis = 'x' | 'y'

const IDENTITY: Mat = [1, 0, 0, 0, 1, 0, 0, 0, 1]

function mul(a: Mat, b: Mat): Mat {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ]
}

/** Même convention que `rotateX()` / `rotateY()` en CSS. */
function rotation(axis: Axis, deg: number): Mat {
  const r = (deg * Math.PI) / 180
  const c = Math.cos(r)
  const s = Math.sin(r)
  return axis === 'x' ? [1, 0, 0, 0, c, -s, 0, s, c] : [c, 0, s, 0, 1, 0, -s, 0, c]
}

/** Après une bascule complète, la matrice ne contient que -1, 0 et 1 : on arrondit
 *  pour que les erreurs d'arrondi ne s'accumulent pas de lancer en lancer. */
const snap = (m: Mat): Mat => m.map((v) => Math.round(v)) as Mat

/** `matrix3d()` attend les colonnes, pas les lignes. */
const toCss = (m: Mat) =>
  `matrix3d(${m[0]},${m[3]},${m[6]},0,${m[1]},${m[4]},${m[7]},0,${m[2]},${m[5]},${m[8]},0,0,0,0,1)`

/**
 * Élévation du centre du dé pendant une bascule : il pivote sur une arête, et
 * son centre décrit un arc qui culmine à 45°. Réduite de moitié à l'écran,
 * sinon le dé semble sautiller à chaque quart de tour.
 */
const tipLift = (p: number) => {
  const a = (Math.min(Math.abs(p), 1) * Math.PI) / 2
  return 0.5 * HALF * (Math.cos(a) + Math.sin(a) - 1)
}

/**
 * Axe et sens de la bascule qui accompagne un déplacement : le dé bascule sur
 * l'arête qui fait face au mouvement, selon la composante dominante.
 */
const tipFromVelocity = (vx: number, vy: number): { axis: Axis; sign: number } =>
  Math.abs(vx) >= Math.abs(vy)
    ? { axis: 'y', sign: Math.sign(vx) || 1 }
    : { axis: 'x', sign: -(Math.sign(vy) || 1) }

type Vec = { x: number; y: number }
type Mode = 'rest' | 'roll' | 'drag' | 'thrown' | 'fall' | 'rock' | 'wait' | 'home'

const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const randInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1))

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

    const s = {
      mode: 'rest' as Mode,
      pos: { x: 0, y: 0 } as Vec,
      vel: { x: 0, y: 0 } as Vec,
      /** Orientation du dé à plat, entre deux bascules. */
      base: IDENTITY as Mat,
      /** Bascule en cours : axe, sens, et avancement de 0 (à plat) à 1 (quart de tour fait). */
      tipAxis: 'y' as Axis,
      tipSign: 1,
      tipP: 0,
      /** Petite oscillation à l'arrivée, en degrés autour de l'axe de la dernière bascule. */
      rockDeg: 0,
      rockAmp: 0,
      /** Rebonds verticaux, en pixels. */
      hop: 0,
      bouncePhase: 0,
      t0: 0,
      dur: 0,
      until: 0,
      fallFrom: 0,
      fallTo: 0,
      afterRock: 'rest' as 'rest' | 'wait',
      queue: [] as Array<{ axis: Axis; sign: number; dur: number }>,
      seqStart: 0,
      posFrom: { x: 0, y: 0 } as Vec,
      grab: { x: 0, y: 0 } as Vec,
      samples: [] as Array<{ x: number; y: number; t: number }>,
      pointerId: -1,
      /** Inclinaison du dé tenu en main, dans le sens du mouvement. */
      lean: { x: 0, y: 0 } as Vec,
      leanTarget: { x: 0, y: 0 } as Vec,
    }

    const render = () => {
      const angle = s.tipSign * s.tipP * 90 + s.rockDeg
      const orientation = angle === 0 ? s.base : mul(rotation(s.tipAxis, angle), s.base)
      cube.style.transform =
        `rotateX(${TILT_X}deg) rotateY(${TILT_Y}deg) ` +
        `rotateX(${s.lean.x}deg) rotateY(${s.lean.y}deg) ${toCss(orientation)}`
      const lift = s.hop + tipLift(s.tipP)
      die.style.transform = `translate3d(${s.pos.x - HALF}px, ${s.pos.y - HALF - lift}px, 0)`
      // L'ombre reste au sol et s'estompe quand le dé s'élève.
      const k = 1 - Math.min(lift, 40) / 80
      shadow.style.transform = `translate3d(${s.pos.x - HALF}px, ${s.pos.y + HALF * 0.62}px, 0) scale(${k})`
      shadow.style.opacity = String(0.55 * k)
    }

    measureHome()
    s.pos = { ...home }
    render()
    die.style.opacity = '1'

    // Animations réduites : un dé posé, immobile, qui suit simplement sa place.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      die.style.pointerEvents = 'none'
      die.style.cursor = 'default'
      const place = () => {
        measureHome()
        s.pos = { ...home }
        render()
      }
      window.addEventListener('resize', place)
      window.addEventListener('scroll', place, { passive: true })
      return () => {
        window.removeEventListener('resize', place)
        window.removeEventListener('scroll', place)
      }
    }

    /** Termine la bascule en cours : le dé est de nouveau à plat, sur une autre face. */
    const commitTip = () => {
      s.base = snap(mul(rotation(s.tipAxis, s.tipSign * 90), s.base))
      s.tipP = 0
    }

    /** Arrivée au sol : une petite oscillation dans le sens de la chute, puis l'arrêt. */
    const land = (now: number, overshoot: number, then: 'rest' | 'wait') => {
      s.tipP = 0
      s.mode = 'rock'
      s.t0 = now
      s.rockAmp = overshoot
      s.afterRock = then
    }

    const nextQueuedTip = (now: number) => {
      const next = s.queue.shift()
      if (!next) {
        land(now, 4, 'rest')
        return
      }
      s.tipAxis = next.axis
      s.tipSign = next.sign
      s.tipP = 0
      s.t0 = now
      s.dur = next.dur
    }

    /** Lancer sur place : quelques bascules de plus en plus lentes, et des rebonds qui s'éteignent. */
    const startRoll = (now: number) => {
      s.mode = 'roll'
      let axis: Axis = Math.random() < 0.5 ? 'x' : 'y'
      let sign = Math.random() < 0.5 ? -1 : 1
      let dur = 120
      s.queue = []
      for (let i = randInt(3, 5); i > 0; i -= 1) {
        s.queue.push({ axis, sign, dur })
        dur *= 1.32
        // De temps en temps le dé repart sur une autre arête, comme un vrai lancer.
        if (Math.random() < 0.3) {
          axis = axis === 'x' ? 'y' : 'x'
          sign = Math.random() < 0.5 ? -1 : 1
        }
      }
      s.seqStart = now
      nextQueuedTip(now)
    }

    s.until = performance.now() + 700

    let raf = 0
    let last = performance.now()

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      switch (s.mode) {
        case 'rest':
          if (now >= s.until) startRoll(now)
          break

        case 'roll': {
          const t = Math.min((now - s.t0) / s.dur, 1)
          s.tipP = t
          const since = (now - s.seqStart) / 1000
          s.hop = 16 * Math.exp(-since * 4) * Math.abs(Math.sin((since * Math.PI) / 0.22))
          if (t >= 1) {
            commitTip()
            nextQueuedTip(now)
          }
          break
        }

        case 'drag':
          // La position suit le pointeur ; le dé tenu en main ne roule pas.
          break

        case 'thrown': {
          s.pos.x += s.vel.x * dt
          s.pos.y += s.vel.y * dt
          const maxX = window.innerWidth - HALF
          const maxY = window.innerHeight - HALF
          if (s.pos.x < HALF) {
            s.pos.x = HALF
            s.vel.x = Math.abs(s.vel.x) * 0.62
          } else if (s.pos.x > maxX) {
            s.pos.x = maxX
            s.vel.x = -Math.abs(s.vel.x) * 0.62
          }
          if (s.pos.y < HALF) {
            s.pos.y = HALF
            s.vel.y = Math.abs(s.vel.y) * 0.62
          } else if (s.pos.y > maxY) {
            s.pos.y = maxY
            s.vel.y = -Math.abs(s.vel.y) * 0.62
          }
          const friction = Math.exp(-1.8 * dt)
          s.vel.x *= friction
          s.vel.y *= friction
          const speed = Math.hypot(s.vel.x, s.vel.y)

          // Tant qu'il va vite, le dé passe une partie du temps en l'air.
          s.bouncePhase += dt
          s.hop = Math.min(speed / 90, 20) * Math.abs(Math.sin((s.bouncePhase * Math.PI) / 0.2))

          // Il roule sans glisser : un quart de tour par longueur de côté parcourue.
          const along = s.tipAxis === 'y' ? s.vel.x * s.tipSign : -s.vel.y * s.tipSign
          s.tipP += (along * dt) / SIZE
          if (s.tipP >= 1 || s.tipP < 0) {
            // À plat : on repart sur l'arête qui fait face au mouvement.
            // (Progression négative : un rebond sur un bord a inversé le sens.)
            if (s.tipP >= 1) commitTip()
            const next = tipFromVelocity(s.vel.x, s.vel.y)
            s.tipAxis = next.axis
            s.tipSign = next.sign
            s.tipP = 0
          }

          if (speed < 70) {
            // Plus d'élan : il retombe du côté où il penchait.
            s.vel = { x: 0, y: 0 }
            s.mode = 'fall'
            s.t0 = now
            s.fallFrom = s.tipP
            s.fallTo = s.tipP >= 0.5 ? 1 : 0
            s.dur = 120 + Math.abs(s.fallTo - s.fallFrom) * 360
          }
          break
        }

        case 'fall': {
          const t = Math.min((now - s.t0) / s.dur, 1)
          // La chute accélère, comme sous l'effet de la pesanteur.
          s.tipP = s.fallFrom + (s.fallTo - s.fallFrom) * t * t
          s.hop *= Math.exp(-14 * dt)
          if (t >= 1) {
            const forward = s.fallTo === 1
            if (forward) commitTip()
            s.hop = 0
            land(now, forward ? 5 : -5, 'wait')
          }
          break
        }

        case 'rock': {
          const t = (now - s.t0) / 1000
          s.rockDeg = s.tipSign * s.rockAmp * Math.exp(-t * 9) * Math.sin(t * 38)
          s.hop *= Math.exp(-14 * dt)
          if (t > 0.45) {
            s.rockDeg = 0
            s.hop = 0
            s.mode = s.afterRock
            s.until = now + (s.afterRock === 'rest' ? 1800 : 2400)
          }
          break
        }

        case 'wait':
          if (now >= s.until) {
            s.mode = 'home'
            s.t0 = now
            s.dur = 750
            s.posFrom = { ...s.pos }
          }
          break

        case 'home': {
          measureHome()
          const t = Math.min((now - s.t0) / s.dur, 1)
          const e = easeInOut(t)
          s.pos.x = s.posFrom.x + (home.x - s.posFrom.x) * e
          s.pos.y = s.posFrom.y + (home.y - s.posFrom.y) * e
          s.hop = Math.sin(t * Math.PI) * 30
          if (t >= 1) {
            s.hop = 0
            s.pos = { ...home }
            s.mode = 'rest'
            s.until = now + 500
          }
          break
        }
      }

      // Inclinaison du dé tenu : elle suit le mouvement, puis se redresse.
      const follow = 1 - Math.exp(-12 * dt)
      s.lean.x += (s.leanTarget.x - s.lean.x) * follow
      s.lean.y += (s.leanTarget.y - s.lean.y) * follow
      const relax = Math.exp(-8 * dt)
      s.leanTarget.x *= relax
      s.leanTarget.y *= relax

      // À sa place, le dé suit son emplacement : défilement, redimensionnement,
      // ou panneau qui se réagence au chargement des polices.
      const atHome =
        s.mode === 'rest' || s.mode === 'roll' || (s.mode === 'rock' && s.afterRock === 'rest')
      if (atHome) {
        measureHome()
        s.pos.x = home.x
        s.pos.y = home.y
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
      s.queue = []
      s.rockDeg = 0
      // Soulevé : il s'élève et son ombre rétrécit.
      s.hop = 18
      s.grab = { x: e.clientX - s.pos.x, y: e.clientY - s.pos.y }
      s.samples = [{ x: e.clientX, y: e.clientY, t: performance.now() }]
      die.style.cursor = 'grabbing'
    }

    const onMove = (e: PointerEvent) => {
      if (s.mode !== 'drag' || e.pointerId !== s.pointerId) return
      const nx = e.clientX - s.grab.x
      const ny = e.clientY - s.grab.y
      // Tenu en main, il ne roule pas : il penche seulement dans le sens du mouvement.
      const clamp = (v: number) => Math.max(-14, Math.min(14, v))
      s.leanTarget.x = clamp(-(ny - s.pos.y) * 1.6)
      s.leanTarget.y = clamp((nx - s.pos.x) * 1.6)
      s.pos.x = nx
      s.pos.y = ny
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
      s.vel = { x: vx, y: vy }
      s.bouncePhase = 0
      // La bascule en cours se poursuit ; à défaut, on part sur l'arête du lancer.
      if (s.tipP === 0) {
        const next = tipFromVelocity(vx, vy)
        s.tipAxis = next.axis
        s.tipSign = next.sign
      }
      s.mode = 'thrown'
    }

    die.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    return () => {
      cancelAnimationFrame(raf)
      die.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
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

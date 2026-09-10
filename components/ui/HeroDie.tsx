'use client'

import { useEffect, useRef } from 'react'

/**
 * Dé de la page d'accueil.
 *
 * Purement décoratif : il se lance tout seul en boucle dans son emplacement,
 * et on peut l'attraper à la souris ou au doigt, le traîner n'importe où sur
 * l'écran et le lancer. Il glisse, rebondit sur les bords, se pose sur une
 * face, puis revient à sa place et reprend ses lancers.
 *
 * Aucun geste n'est nécessaire pour entrer dans l'application : c'est un
 * clin d'œil, pas une porte. Les vrais boutons restent à côté.
 *
 * Toute l'animation passe par des refs et `requestAnimationFrame`, en écrivant
 * directement les transformations dans le DOM : un état React mis à jour à
 * chaque image provoquerait soixante rendus par seconde pour rien.
 *
 * Si le système demande de réduire les animations, le dé reste immobile.
 */

const SIZE = 104
const HALF = SIZE / 2
/** Inclinaison permanente : un dé vu parfaitement de face n'est qu'un carré. */
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

const BORDER = 3

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

type Vec = { x: number; y: number }
type Mode = 'rest' | 'roll' | 'drag' | 'thrown' | 'settle' | 'wait' | 'home'

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
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
      rot: { x: 0, y: 0 } as Vec,
      hop: 0,
      t0: 0,
      dur: 0,
      from: { x: 0, y: 0 } as Vec,
      to: { x: 0, y: 0 } as Vec,
      posFrom: { x: 0, y: 0 } as Vec,
      until: 0,
      grab: { x: 0, y: 0 } as Vec,
      samples: [] as Array<{ x: number; y: number; t: number }>,
      pointerId: -1,
      /** Inclinaison du de tenu en main, dans le sens du mouvement. */
      lean: { x: 0, y: 0 } as Vec,
      leanTarget: { x: 0, y: 0 } as Vec,
    }

    const render = () => {
      die.style.transform = `translate3d(${s.pos.x - HALF}px, ${s.pos.y - HALF - s.hop}px, 0)`
      cube.style.transform = `rotateX(${s.rot.x + TILT_X + s.lean.x}deg) rotateY(${s.rot.y + TILT_Y + s.lean.y}deg)`
      // L'ombre reste au sol et s'estompe quand le dé s'élève.
      const k = 1 - Math.min(s.hop, 40) / 80
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

    /** Lance le dé sur place : plusieurs quarts de tour, deux rebonds. */
    const startRoll = (now: number) => {
      // Ramener l'angle dans [0, 360[ : l'apparence est identique, et les
      // nombres ne grossissent pas indéfiniment.
      s.rot = { x: s.rot.x % 360, y: s.rot.y % 360 }
      s.mode = 'roll'
      s.t0 = now
      s.dur = 1200
      s.from = { ...s.rot }
      const dirX = Math.random() < 0.5 ? -1 : 1
      const dirY = Math.random() < 0.5 ? -1 : 1
      s.to = {
        x: (Math.round(s.rot.x / 90) + dirX * randInt(2, 5)) * 90,
        y: (Math.round(s.rot.y / 90) + dirY * randInt(2, 5)) * 90,
      }
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
          const e = easeOut(t)
          s.rot.x = s.from.x + (s.to.x - s.from.x) * e
          s.rot.y = s.from.y + (s.to.y - s.from.y) * e
          s.hop = Math.abs(Math.sin(t * Math.PI * 2)) * 26 * (1 - t)
          if (t >= 1) {
            s.hop = 0
            s.mode = 'rest'
            s.until = now + 1800
          }
          break
        }

        case 'drag':
          // Position et rotation sont mises à jour par le glisser.
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
          const friction = Math.exp(-1.6 * dt)
          s.vel.x *= friction
          s.vel.y *= friction
          // Un dé qui glisse roule dans le sens de son déplacement.
          s.rot.x += -s.vel.y * 0.55 * dt
          s.rot.y += s.vel.x * 0.55 * dt
          const speed = Math.hypot(s.vel.x, s.vel.y)
          s.hop = Math.min(speed / 60, 14) * Math.abs(Math.sin(now / 90))
          if (speed < 40) {
            // Il se pose sur la face la plus proche.
            s.mode = 'settle'
            s.t0 = now
            s.dur = 380
            s.from = { ...s.rot }
            s.to = { x: Math.round(s.rot.x / 90) * 90, y: Math.round(s.rot.y / 90) * 90 }
          }
          break
        }

        case 'settle': {
          const t = Math.min((now - s.t0) / s.dur, 1)
          const e = easeOut(t)
          s.rot.x = s.from.x + (s.to.x - s.from.x) * e
          s.rot.y = s.from.y + (s.to.y - s.from.y) * e
          s.hop *= Math.exp(-12 * dt)
          if (t >= 1) {
            s.hop = 0
            s.mode = 'wait'
            s.until = now + 2600
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

      // À sa place, le dé suit son emplacement : défilement, redimensionnement,
      // ou panneau qui se réagence au chargement des polices.
      if (s.mode === 'rest' || s.mode === 'roll') {
        measureHome()
        s.pos.x = home.x
        s.pos.y = home.y
      }

      // L'inclinaison suit le mouvement de la main puis se redresse d'elle-meme.
      const follow = 1 - Math.exp(-12 * dt)
      s.lean.x += (s.leanTarget.x - s.lean.x) * follow
      s.lean.y += (s.leanTarget.y - s.lean.y) * follow
      const relax = Math.exp(-8 * dt)
      s.leanTarget.x *= relax
      s.leanTarget.y *= relax

      render()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const onDown = (e: PointerEvent) => {
      e.preventDefault()
      // La capture garde le glisser meme quand le curseur sort du de. Le
      // navigateur peut la refuser : les ecouteurs de mouvement etant poses sur
      // la fenetre, le de reste attrapable dans tous les cas.
      try {
        die.setPointerCapture(e.pointerId)
      } catch {
        // capture refusee : la fenetre prend le relais
      }
      s.pointerId = e.pointerId
      s.mode = 'drag'
      // Souleve : l'ombre retrecit, le de flotte au-dessus du sol.
      s.hop = 18
      s.grab = { x: e.clientX - s.pos.x, y: e.clientY - s.pos.y }
      s.samples = [{ x: e.clientX, y: e.clientY, t: performance.now() }]
      die.style.cursor = 'grabbing'
    }

    const onMove = (e: PointerEvent) => {
      if (s.mode !== 'drag' || e.pointerId !== s.pointerId) return
      const nx = e.clientX - s.grab.x
      const ny = e.clientY - s.grab.y
      // Tenu en main, le de ne roule pas : il penche seulement un peu dans le
      // sens du mouvement. Il ne tourne sur lui-meme qu'une fois lance.
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
      s.mode = 'thrown'
    }

    // Seul l'appui se fait sur le de ; mouvement et relachement sont ecoutes
    // sur la fenetre, pour ne pas perdre un lancer rapide qui quitte le de.
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
                border: `${BORDER}px solid #D6336C`,
                // Arrondi volontairement faible : avec un rayon plus grand, les trois
                // faces qui se rejoignent laissent un trou au sommet, visible selon
                // l'angle. Un noyau interieur ne le bouchait que sous certains angles.
                borderRadius: 6,
                boxShadow: '0 4px 10px rgba(0,0,0,0.6), inset 0 0 12px rgba(214,51,108,0.15)',
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

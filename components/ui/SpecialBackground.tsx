'use client'

import { motion, animate, useMotionValue, useTransform } from 'framer-motion'
import React, { useEffect, useMemo, useRef, useState } from 'react'

/* =======================================================================================
   UTILS : PRNG stable, clamp, couleurs robustes, phases
   ======================================================================================= */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

function hexToRgb(hex?: string): [number, number, number] | null {
  if (typeof hex !== 'string') return null
  let h = hex.trim()
  if (h[0] === '#') h = h.slice(1)
  if (h.length === 3) h = h.split('').map(ch => ch + ch).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return [r, g, b]
}
function rgbToHex([r, g, b]: [number, number, number]) {
  const h = (n: number) => clamp(n | 0, 0, 255).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}
function lerpColor(a?: string, b?: string, t = 0.5) {
  const A = hexToRgb(a) ?? [0, 0, 0]
  const B = hexToRgb(b) ?? [0, 0, 0]
  return rgbToHex([
    Math.round(lerp(A[0], B[0], t)),
    Math.round(lerp(A[1], B[1], t)),
    Math.round(lerp(A[2], B[2], t)),
  ])
}

type Phase = 'day' | 'dawn_dusk' | 'night' | 'midnight'
function phaseFromProgress(t: number): Phase {
  const dawn = t >= 0.0 && t < 0.08
  const morning = t >= 0.08 && t < 0.20
  const day = t >= 0.20 && t < 0.45
  const dusk = t >= 0.45 && t < 0.55
  const night = t >= 0.55 && t < 0.95
  const predawn = t >= 0.95 && t < 1.0
  if (day || morning) return 'day'
  if (dawn || dusk || predawn) return 'dawn_dusk'
  if (Math.abs(t - 0.75) < 0.07) return 'midnight'
  return 'night'
}
const isDayPhase = (p: Phase) => p === 'day' || p === 'dawn_dusk'
const isNightPhase = (p: Phase) => p === 'night' || p === 'midnight'

/* =======================================================================================
   ICONES — soleil, lune, nuages, arbres, fleurs, coquillage, crabe, cœur
   ======================================================================================= */

function SunIcon({ size = 90 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <radialGradient id="sunHalo" r="0.85">
          <stop offset="0%" stopColor="#fff799" />
          <stop offset="70%" stopColor="#ffd23f" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#ffd23f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#sunHalo)" />
      <circle cx="32" cy="32" r="16" fill="#ffd23f" />
    </svg>
  )
}
function MoonIcon({ size = 70 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <radialGradient id="moonGlow" r="0.9">
          <stop offset="0%" stopColor="#eef4ff" />
          <stop offset="100%" stopColor="#eef4ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#moonGlow)" />
      <path d="M42 8A24 24 0 1 0 42 56 18 18 0 1 1 42 8Z" fill="#f0f4ff" />
    </svg>
  )
}

/* Nuages (2 couches, parallax) */
const cloudShapes = [
  'M12 22a10 10 0 0 1 0-6A8 8 0 0 1 21 11a9 9 0 0 1 17-2 7 7 0 0 1 9 7 6 6 0 0 1-1 12H13Z',
  'M7 24a9 9 0 0 1 0-5A7 7 0 0 1 15 12a8 8 0 0 1 15-2 6 6 0 0 1 8 6 5 5 0 0 1-1 10H8Z',
  'M5 24 Q12 19 25 21 Q29 15 39 18 Q48 15 59 23 Q65 27 60 28 Q50 27 10 26 Z',
  'M3 21 Q10 17 19 18 Q21 10 35 15 Q44 10 53 19 Q62 20 62 23 Q60 27 55 26 H8Z',
  'M8 25 Q12 14 20 17 Q24 10 32 12 Q36 5 44 10 Q52 8 58 16 Q64 18 62 26 H9Z',
  'M14 28 Q19 18 25 24 Q30 14 38 20 Q45 10 56 18 Q62 24 56 28 H16Z',
  'M11 23 Q17 16 25 21 Q29 12 35 17 Q41 10 54 22 Q63 22 63 25 H13Z',
  'M5 27 Q14 15 27 17 Q33 13 39 19 Q54 10 62 29 H7Z',
  'M18 24 Q24 10 36 20 Q47 10 54 28 Q54 31 48 28 H22Z',
  'M7 26 Q18 15 32 29 Q46 12 59 27 H9Z',
  'M6 22 Q14 12 22 16 Q30 8 42 14 Q50 10 57 18 Q62 20 61 24 H8Z',
  'M10 25 Q16 20 24 22 Q33 15 45 19 Q56 16 60 23 H12Z',
]
function CloudIcon({ size = 110, v = 0, tint = '#fff' }: { size?: number; v?: number; tint?: string }) {
  const i = v % cloudShapes.length
  return (
    <svg viewBox="0 0 64 32" width={size} height={(size * 32) / 64} style={{ filter: 'drop-shadow(0 6px 10px #0002)' }}>
      <defs>
        <linearGradient id={`cfill-${i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tint} />
          <stop offset="100%" stopColor="#eaf3ff" />
        </linearGradient>
      </defs>
      <path d={cloudShapes[i]} fill={`url(#cfill-${i})`} />
      <path d={cloudShapes[i]} fill="none" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6" />
    </svg>
  )
}

/* Arbres */
function TreeIcon({ size = 90, v = 0, tint = 1 }: { size?: number; v?: number; tint?: number }) {
  const mul = (hex: string, f = 1) => {
    const rgb = hexToRgb(hex) ?? [0, 0, 0]
    const h = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0')
    return `#${h(rgb[0] * f)}${h(rgb[1] * f)}${h(rgb[2] * f)}`
  }
  const c1 = mul('#4caf50', tint)
  const c2 = mul('#43a047', tint)
  return v % 2 ? (
    <svg viewBox="0 0 64 96" width={size} height={(size * 96) / 64}>
      <rect x="28" y="60" width="8" height="36" fill="#6b4226" />
      <ellipse cx="32" cy="48" rx="26" ry="22" fill={c1} />
      <ellipse cx="32" cy="28" rx="20" ry="18" fill={c2} />
    </svg>
  ) : (
    <svg viewBox="0 0 64 96" width={size} height={(size * 96) / 64}>
      <rect x="30" y="60" width="6" height="36" fill="#6b4226" />
      <polygon points="32,10 52,52 12,52" fill={c1} />
      <polygon points="32,26 46,58 18,58" fill={c2} />
    </svg>
  )
}

const FlowerIcon = ({ size = 14, color = "#f8c8ec" }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 16 16" width={size} height={size}>
    <circle cx="8" cy="8" r="3" fill={color} />
    <circle cx="8" cy="3" r="2" fill={color} />
    <circle cx="13" cy="8" r="2" fill={color} />
    <circle cx="8" cy="13" r="2" fill={color} />
    <circle cx="3" cy="8" r="2" fill={color} />
    <circle cx="8" cy="8" r="1.2" fill="#fff870" />
  </svg>
)
const ShellIcon = ({ size = 10 }: { size?: number }) => (
  <svg viewBox="0 0 16 12" width={size} height={(size * 12) / 16}>
    <path d="M1 11 Q8 -1 15 11 Z" fill="#fdd9b5" stroke="#e3bfa1" strokeWidth="1" />
  </svg>
)
const CrabIcon = ({ size = 22 }: { size?: number }) => (
  <svg viewBox="0 0 32 20" width={size} height={(size * 20) / 32}>
    <circle cx="16" cy="12" r="6" fill="#ff7f51" />
    <circle cx="12" cy="10" r="2" fill="#000" />
    <circle cx="20" cy="10" r="2" fill="#000" />
    <path d="M10 18 L6 14 M22 18 L26 14" stroke="#ff7f51" strokeWidth="2" />
  </svg>
)
function HeartIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 28" width={size} height={(size * 28) / 32}>
      <path d="M16 26 C-10 10 8 -2 16 8 C24 -2 42 10 16 26 Z" fill="#ff5a8a" stroke="#ff2d6b" strokeWidth="1" />
    </svg>
  )
}

/* =======================================================================================
   ANIMAUX : mapping vers TES SVG (jour / nuit)
   ======================================================================================= */

type AnimalType =
  | 'deer'         // jour
  | 'boar'         // jour
  | 'red_panda'    // jour
  | 'racoon'       // nuit
  | 'wolf'         // nuit
  | 'wild_cat'     // nuit

const ICONS: Record<AnimalType, string> = {
  deer:      'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754674008/deer-svgrepo-com_nvbsr7.svg',
  boar:      'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754673999/boar-svgrepo-com_adokxy.svg',
  red_panda: 'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754673984/red-panda-svgrepo-com_1_xrvrnm.svg',
  racoon:    'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754673992/racoon-svgrepo-com_qzvo3e.svg',
  wolf:      'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754673975/wolf-svgrepo-com_qwk0in.svg',
  wild_cat:  'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754673961/wild-cat-svgrepo-com_idpv9h.svg',
}
const DAY_SPECIES: AnimalType[] = ['deer', 'boar', 'red_panda']
const NIGHT_SPECIES: AnimalType[] = ['racoon', 'wolf', 'wild_cat']

const BASE_SIZE: Record<AnimalType, number> = {
  deer: 76, boar: 60, red_panda: 48, racoon: 46, wolf: 60, wild_cat: 50,
}
const BASE_SPEED: Record<AnimalType, number> = {
  deer: 6.2, boar: 5.5, red_panda: 5.2, racoon: 6, wolf: 7, wild_cat: 6.3,
}

/* =======================================================================================
   COMPOSANT PRINCIPAL
   ======================================================================================= */

type AnimalState = 'walk' | 'idle'
type Animal = {
  id: number
  type: AnimalType
  x: number
  y: number
  dir: 1 | -1
  speed: number
  state: AnimalState
  sizeScale: number
  target?: { x: number; y: number }
  cooldownMateUntil?: number
  ageSec: number
  lifeSec: number
  dying?: boolean
}

export default function SpecialBackground() {
  /* Cycle jour/nuit */
  const cycleSeconds = 200
  const [dayProgress, setDayProgress] = useState(0)
  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      setDayProgress(((now - start) / (cycleSeconds * 1000)) % 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  const phase = phaseFromProgress(dayProgress)

  /* Ciel dynamique robuste */
  const skyStops = ['#75c9ff', '#a4ddff', '#8bd0ff', '#ffa95d', '#12223a', '#0d1b2a', '#ffa95d', '#75c9ff']
  const safeProg = Number.isFinite(dayProgress) ? clamp(dayProgress, 0, 0.999999) : 0
  const seg = 1 / Math.max(1, (skyStops.length - 1))
  const idx = clamp(Math.floor(safeProg / seg), 0, skyStops.length - 2)
  const local = (safeProg - idx * seg) / seg
  const skyTop = lerpColor(skyStops[idx], skyStops[idx + 1], local)
  const skyBottom = lerpColor(skyTop, '#75c9ff', 0.35)

  /* Étoiles */
  const stars = useMemo(() => {
    const rng = mulberry32(20250808)
    return Array.from({ length: 140 }).map((_, k) => ({
      id: `star-${k}`,
      left: Math.round(rng() * 100),
      top: Math.round(rng() * 28),
      size: 1 + Math.round(rng() * 2),
      tw: 2 + rng() * 3,
      delay: rng() * 5,
    }))
  }, [])

  /* Vent */
  const windAngle = useMotionValue(0)
  const arrowRotation = useTransform(windAngle, (a) => `${a}deg`)
  useEffect(() => {
    const controls = animate(windAngle, [0, 180, 0], { duration: 600, repeat: Infinity, ease: 'easeInOut' })
    return controls.stop
  }, [windAngle])

  /* Nuages — 2 couches (parallax) */
  const cloudsNear = useMemo(() => {
    const rng = mulberry32(424242)
    return Array.from({ length: 7 }).map((_, i) => {
      const size = 110 + Math.round(rng() * 140)
      const top = 8 + Math.round(rng() * 12)
      const dur = 60 + rng() * 40
      const delay = -rng() * dur
      const shapeIdx = Math.floor(rng() * cloudShapes.length)
      return (
        <motion.div
          key={`cN-${i}`}
          initial={{ x: '110vw' }}
          animate={{ x: '-120vw' }}
          transition={{ duration: dur, repeat: Infinity, delay, ease: 'linear' }}
          style={{ position: 'absolute', top: `${top}vh`, pointerEvents: 'none', zIndex: 3 }}
        >
          <CloudIcon size={size} v={shapeIdx} />
        </motion.div>
      )
    })
  }, [])
  const cloudsFar = useMemo(() => {
    const rng = mulberry32(424243)
    return Array.from({ length: 6 }).map((_, i) => {
      const size = 90 + Math.round(rng() * 120)
      const top = 5 + Math.round(rng() * 10)
      const dur = 110 + rng() * 60
      const delay = -rng() * dur
      const shapeIdx = Math.floor(rng() * cloudShapes.length)
      return (
        <motion.div
          key={`cF-${i}`}
          initial={{ x: '110vw' }}
          animate={{ x: '-120vw' }}
          transition={{ duration: dur, repeat: Infinity, delay, ease: 'linear' }}
          style={{ position: 'absolute', top: `${top}vh`, pointerEvents: 'none', opacity: 0.75, zIndex: 2 }}
        >
          <CloudIcon size={size} v={shapeIdx} tint="#f6fbff" />
        </motion.div>
      )
    })
  }, [])

  /* Fleurs & coquillages */
  const flowers = useMemo(() => {
    const rng = mulberry32(1312)
    const colors = ['#f8c8ec', '#ffdb99', '#c7e2ad', '#eae5ff', '#f0c3c3']
    const pts = Array.from({ length: 50 }).map(() => ({ x: 2 + rng() * 96, y: 56 + rng() * 16 }))
      .sort((a, b) => a.x - b.x)
    for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i].x - pts[i - 1].x) < 2.2) pts[i].x += 2 + rng() * 2
    return pts.map((p, i) => {
      const size = 10 + Math.round(rng() * 8)
      const color = colors[Math.floor(rng() * colors.length)]
      return <div key={`fl-${i}`} style={{ position: 'absolute', left: `${clamp(p.x, 0, 98)}vw`, top: `${clamp(p.y, 56, 72.2)}vh`, zIndex: 5, pointerEvents: 'none' }}>
        <FlowerIcon size={size} color={color} />
      </div>
    })
  }, [])
  const shells = useMemo(() => {
    const rng = mulberry32(8888)
    return Array.from({ length: 16 }).map((_, i) => {
      const size = 8 + Math.round(rng() * 5)
      const left = rng() * 100
      return <div key={`sh-${i}`} style={{ position: 'absolute', left: `${left}vw`, bottom: '13vh', zIndex: 7, pointerEvents: 'none' }}><ShellIcon size={size} /></div>
    })
  }, [])

  /* Feuilles rivière */
  type Leaf = { id: number; x: number; y: number; v: number; size: number }
  const [leaves, setLeaves] = useState<Leaf[]>([])
  const leafId = useRef(1)
  const nextLeafSpawn = useRef(performance.now() + 6000)
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = (now - last) / 1000; last = now
      setLeaves(prev => {
        const arr = [...prev]
        if (arr.length < 2 && now >= nextLeafSpawn.current) {
          nextLeafSpawn.current = now + 9000 + Math.random() * 7000
          arr.push({ id: leafId.current++, x: 110, y: 85 + Math.random() * 6, v: 8 + Math.random() * 3, size: 14 + Math.random() * 10 })
        }
        for (const lf of arr) lf.x -= lf.v * dt
        return arr.filter(l => l.x > -20)
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* ====================== ANIMAUX (balade + bébé rare + vieillissement) ====================== */
  const MAX_POP = 7
  const [animals, setAnimals] = useState<Animal[]>([])
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number; until: number }>>([])
  const nextAnimalId = useRef(1)
  const nextSpawnAt = useRef(performance.now() + 3000)

  const PLAIN_Y_MIN = 56, PLAIN_Y_MAX = 71, PLAIN_X_MIN = -5, PLAIN_X_MAX = 105
  const MATE_DIST = 2.4
  const HEART_MS = 10000

  // cible parfois légèrement hors cadre pour permettre la sortie naturelle
  function randomTarget() {
    const marginX = 8
    return {
      x: (PLAIN_X_MIN - marginX) + Math.random() * ((PLAIN_X_MAX + marginX) - (PLAIN_X_MIN - marginX)),
      y: PLAIN_Y_MIN + Math.random() * (PLAIN_Y_MAX - PLAIN_Y_MIN),
    }
  }
  function pickSpeciesForPhase(p: Phase): AnimalType {
    const pool = isDayPhase(p) ? DAY_SPECIES : NIGHT_SPECIES
    return pool[Math.floor(Math.random() * pool.length)]
  }
  function spawnAnimal(opts?: { type?: AnimalType; babyOf?: AnimalType; near?: { x: number; y: number } }) {
    setAnimals(cur => {
      if (cur.length >= MAX_POP) return cur
      const type = (opts?.type ?? opts?.babyOf ?? pickSpeciesForPhase(phase)) as AnimalType
      const id = nextAnimalId.current++
      const sizeScale = opts?.babyOf ? 0.62 : 1
      const baseSpeed = BASE_SPEED[type] * (0.75 + Math.random() * 0.5) * (opts?.babyOf ? 0.85 : 1)
      const startX = opts?.near ? opts.near.x + (Math.random() - 0.5) * 2 : (Math.random() < 0.5 ? -12 : 112)
      const startY = opts?.near ? opts.near.y : 56 + Math.random() * 14
      const lifeSec = (opts?.babyOf ? 70 : 110) + Math.random() * (opts?.babyOf ? 40 : 80)
      const a: Animal = {
        id, type,
        x: startX, y: startY,
        dir: startX < 50 ? 1 : -1,
        speed: baseSpeed,
        state: 'walk',
        sizeScale,
        target: randomTarget(),
        cooldownMateUntil: performance.now() + (opts?.babyOf ? 30000 : 0),
        ageSec: 0,
        lifeSec,
      }
      return [...cur, a]
    })
  }

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now

      // spawns selon phase, cap 7
      if (now >= nextSpawnAt.current) {
        nextSpawnAt.current = now + 7000 + Math.random() * 9000
        setAnimals(cur => (cur.length < MAX_POP ? (spawnAnimal(), cur) : cur))
      }

      // update animaux
      setAnimals(prev => {
        const arr = prev.map(a => ({ ...a }))
        for (const a of arr) {
          a.ageSec += dt
          if (!a.dying && a.ageSec >= a.lifeSec) a.dying = true

          // croissance lente des bébés
          if (a.sizeScale < 1) a.sizeScale = Math.min(1, a.sizeScale + dt * 0.005)

          // mort : fade out puis suppression
          if (a.dying) {
            a.sizeScale = Math.max(0, a.sizeScale - dt * 0.2)
            continue
          }

          // cible aléatoire
          if (!a.target || Math.hypot((a.target.x - a.x), (a.target.y - a.y)) < 1.2 || Math.random() < 0.002) {
            a.target = randomTarget()
            if (Math.random() < 0.18) a.state = 'idle'
          }
          if (a.state === 'idle' && Math.random() < 0.01) a.state = 'walk'

          if (a.state === 'walk' && a.target) {
            const dx = a.target.x - a.x
            const dy = a.target.y - a.y
            const d = Math.hypot(dx, dy) + 1e-6
            const vx = (dx / d) * a.speed
            const vy = (dy / d) * (a.speed * 0.24)
            a.dir = vx >= 0 ? 1 : -1
            a.x += vx * dt
            a.y = clamp(a.y + vy * dt, PLAIN_Y_MIN, PLAIN_Y_MAX)
          }
        }

        // reproduction RARE (1% à la rencontre), cap 7 + gros cooldown
        for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
          const A = arr[i], B = arr[j]
          if (A.dying || B.dying) continue
          if (A.type !== B.type) continue
          const nowMs = performance.now()
          if ((A.cooldownMateUntil ?? 0) > nowMs || (B.cooldownMateUntil ?? 0) > nowMs) continue
          const d = Math.hypot(A.x - B.x, A.y - B.y)
          if (d < MATE_DIST && Math.random() < 0.01 && arr.length < MAX_POP) {
            const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2
            A.state = 'idle'; B.state = 'idle'
            A.target = undefined; B.target = undefined
            const cd = 60000 + Math.random() * 40000 // 60–100s
            A.cooldownMateUntil = nowMs + cd
            B.cooldownMateUntil = nowMs + cd
            const fxId = (A.id * 10000 + B.id) ^ 0x9e3779b9
            setHearts(h => [...h, { id: fxId, x: cx, y: cy - 2, until: nowMs + HEART_MS }])
            setTimeout(() => spawnAnimal({ babyOf: A.type, near: { x: cx, y: cy } }), 350)
          }
        }

        // purge quand bien sortis de l'écran (et vivants/fadés)
        return arr.filter(a => a.sizeScale > 0 && a.x > -25 && a.x < 125)
      })

      // nettoie cœurs
      setHearts(prev => prev.filter(h => h.until > performance.now()))

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  /* Soleil / Lune */
  function astroPos(t: number, sun = true) {
    const local = sun ? (t / 0.5) : ((t - 0.5) / 0.5)
    const clamped = clamp(local, 0, 1)
    const rx = 60, ry = 28, cx = 50, cy = 38
    const theta = Math.PI - clamped * Math.PI
    return { x: `${cx + rx * Math.cos(theta)}vw`, y: `${cy - ry * Math.sin(theta)}vh`, visible: (sun ? t < 0.5 : t >= 0.5) }
  }
  const sun = astroPos(dayProgress, true)
  const moon = astroPos(dayProgress, false)

  /* TREES: profondeur sur toute la plaine (moins d'arbres, plus spread, jusqu'au pied montagne) */
  const treeLayers = useMemo(() => {
    const rng = mulberry32(777001)
    const bands = 6         // bandes de profondeur
    const perBand = 5       // moins d’arbres -> plus “respirant”
    const layers: Array<{ x: number; yBottomVh: number; size: number; v: number; opacity: number; z: number }> = []
    for (let b = 0; b < bands; b++) {
      const depth = b / (bands - 1) // 0..1
      const baseSize = lerp(108, 50, depth)          // loin = petit
      const yBottom = lerp(1.2, 18.5, depth)         // 18.5vh ≈ pied de la montagne
      for (let i = 0; i < perBand; i++) {
        let x = 2 + (i + rng()) * (96 / perBand)     // couvre toute la largeur
        x += (rng() - 0.5) * (6 + 8 * (1 - depth))   // jitter plus fort devant
        layers.push({
          x: clamp(x, 0, 98),
          yBottomVh: yBottom,
          size: baseSize + (rng() - 0.5) * 10,
          v: b * perBand + i,
          opacity: lerp(1, 0.7, depth),
          z: 12 + Math.floor(depth * 10),            // arbres AU-DESSUS des animaux
        })
      }
    }
    // dessiner les lointains d'abord (petits), puis les proches
    return layers.sort((a, b) => a.size - b.size)
  }, [])

  /* RENDER */
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {/* CIEL */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${skyTop} 55%, ${skyBottom} 100%)`, zIndex: 0 }} />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '3px 3px', opacity: 0.4, zIndex: 1 }} />

      {/* ÉTOILES */}
      {stars.map(s => {
        const show = isNightPhase(phase) || phase === 'dawn_dusk'
        const base = phase === 'dawn_dusk' ? 0.2 : phase === 'midnight' ? 0.95 : 0.7
        return (
          <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: show ? [0.1, base, 0.1] : 0 }} transition={{ duration: s.tw, repeat: Infinity, delay: s.delay }}
            style={{ position: 'absolute', left: `${s.left}vw`, top: `${s.top}vh`, width: s.size, height: s.size, borderRadius: s.size, background: '#fff', boxShadow: '0 0 6px #fff8', zIndex: 2 }} />
        )
      })}

      {/* Soleil/Lune */}
      {sun.visible && <div style={{ position: 'absolute', left: sun.x, top: sun.y, transform: 'translate(-50%, -50%)', zIndex: 2 }}><SunIcon /></div>}
      {moon.visible && <div style={{ position: 'absolute', left: moon.x, top: moon.y, transform: 'translate(-50%, -50%)', zIndex: 2 }}><MoonIcon /></div>}

      {/* Vent */}
      <motion.div style={{ position: 'absolute', top: '4vh', left: '4vw', originX: 0.5, originY: 0.5, rotate: arrowRotation, zIndex: 2 }}>
        <svg viewBox="0 0 32 32" width={36} height={36}><path d="M2 16 H26 M18 8 L26 16 L18 24" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
      </motion.div>

      {/* Nuages */}
      {cloudsFar}
      {cloudsNear}

      {/* Montagnes */}
      <svg viewBox="0 0 1000 200" className="absolute inset-x-0" style={{ top: '30vh', height: '22vh', width: '100vw', minWidth: 1200, zIndex: 1 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="neige" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#eeeeee" />
            <stop offset="80%" stopColor="#cbd2d6" />
            <stop offset="100%" stopColor="#4e6574" />
          </linearGradient>
        </defs>
        <path d="M0 150 L120 80 L240 140 L380 60 L520 120 L650 90 L780 140 L1000 60 V200 H0 Z" fill="url(#neige)" />
      </svg>

      {/* PLAINE (arbres en profondeur) */}
      <div className="absolute left-0 right-0" style={{
        top: '52vh',
        height: '22.5vh',
        width: '100vw',
        background: 'linear-gradient(to top,#379F3D 70%,#4caf50 100%)',
        zIndex: 4,
      }}>
        {treeLayers.map((t, i) => (
          <div
            key={`tree-${i}`}
            style={{
              position: 'absolute',
              left: `${t.x}vw`,
              bottom: `${t.yBottomVh}vh`,
              opacity: t.opacity,
              zIndex: t.z, // arbres AU-DESSUS (occlusion)
            }}
          >
            <TreeIcon size={t.size} v={t.v} tint={lerp(1, 0.85, (t.size - 50) / (108 - 50))} />
          </div>
        ))}
      </div>

      {/* Fleurs (plaine) */}
      {flowers}

      {/* PLAGE */}
      <svg viewBox="0 0 1000 100" className="absolute left-0 right-0" style={{ top: '74vh', height: '10.5vh', width: '100vw', minWidth: 1200, zIndex: 6 }} preserveAspectRatio="none">
        <path d="M0 0 L1000 0 L1000 100 L0 100 Z" fill="#f9d9a6" />
      </svg>

      {/* Coquillages */}
      {shells}

      {/* Crabe (plage, balade + légère variation de hauteur) */}
      <motion.div
        style={{ position: 'absolute', left: '-15vw', zIndex: 7 }}
        animate={{
          x: ['-15vw', '115vw', '-15vw'],
          bottom: ['12.5vh', '13.8vh', '12.2vh'],
        }}
        transition={{ duration: 85, repeat: Infinity, ease: 'linear' }}
      >
        <CrabIcon size={24} />
      </motion.div>

      {/* RIVIÈRE */}
      <div className="absolute left-0 right-0" style={{ bottom: 0, top: '84.5vh', height: '15.5vh', width: '100vw', minWidth: 1200,
        background: 'linear-gradient(to top,#3296e0 70%,#3fa9f5 100%)', zIndex: 3 }} />

      {/* Feuilles rivière */}
      {leaves.map(lf => <div key={`leaf-${lf.id}`} style={{ position: 'absolute', top: `${lf.y}vh`, left: `${lf.x}vw`, zIndex: 3 }}>
        <svg viewBox="0 0 24 12" width={lf.size} height={(lf.size*12)/24}><path d="M2 6 Q10 -2 22 6 Q10 14 2 6 Z" fill="#8fd19e" stroke="#5aa576" strokeWidth="1" /><path d="M2 6 L22 6" stroke="#5aa576" strokeWidth="1" /></svg>
      </div>)}

      {/* ANIMAUX — en dessous des arbres (occlusion ok) */}
      {animals.map(a => (
        <div key={`animal-${a.id}`} style={{
          position: 'absolute',
          top: `${a.y}vh`,
          left: `${a.x}vw`,
          transform: 'translate(-50%, -50%)',
          opacity: a.dying ? 0.6 : 1,
          zIndex: 11, // < arbres (12+)
        }}>
          <img
            src={ICONS[a.type]}
            alt={a.type}
            style={{
              width: BASE_SIZE[a.type] * a.sizeScale,
              height: 'auto',
              transform: a.dir < 0 ? 'scaleX(-1)' : undefined,
              filter: 'drop-shadow(0 2px 4px #0003)',
            }}
          />
        </div>
      ))}

      {/* Cœurs d'accouplement (10s) */}
      {hearts.map(h => {
        const life = Math.max(0, h.until - performance.now())
        const alpha = Math.min(1, life / HEART_MS)
        return (
          <motion.div
            key={`heart-${h.id}-${Math.round(h.until)}`}
            style={{ position: 'absolute', left: `${h.x}vw`, top: `${h.y}vh`, zIndex: 10, transform: 'translate(-50%, -50%)' }}
            animate={{ y: [0, -2, 0], opacity: [alpha, alpha * 0.8, alpha] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          >
            <HeartIcon size={18} />
          </motion.div>
        )
      })}
    </div>
  )
}

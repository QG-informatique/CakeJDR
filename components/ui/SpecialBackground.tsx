/* eslint-disable react/jsx-no-comment-textnodes */
'use client'

import { motion } from 'framer-motion'
import React, { useEffect, useMemo, useRef, useState } from 'react'

/* ============================================================================
   UTILS
   ============================================================================ */

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const smoothstep01 = (t: number) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x) }
function hexToRgb(hex?: string): [number, number, number] | null {
  if (typeof hex !== 'string') return null
  let h = hex.trim()
  if (h[0] === '#') h = h.slice(1)
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
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
function bell(x: number, a: number, b: number) {
  if (x <= a || x >= b) return 0
  const t = (x - a) / (b - a)
  return 4 * t * (1 - t)
}

/* ============================================================================
   ASSETS
   ============================================================================ */

type AnimalType = 'deer' | 'boar' | 'red_panda' | 'racoon' | 'wolf' | 'wild_cat'
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
const BASE_SIZE: Record<AnimalType, number> = { deer: 76, boar: 60, red_panda: 48, racoon: 46, wolf: 60, wild_cat: 50 }
const BASE_SPEED: Record<AnimalType, number> = { deer: 6.0, boar: 5.4, red_panda: 5.0, racoon: 5.8, wolf: 6.6, wild_cat: 6.0 }

const TREE_SVGS = [
  'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754684600/tree-svgrepo-com_c9i63x.svg',
  'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754684607/tree-svgrepo-com_1_nuemwy.svg',
  'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754684614/tree-svgrepo-com_2_n520jg.svg',
]
const FLOWER_SVGS = [
  'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754685947/flowers-flower-svgrepo-com_lk7kvz.svg',
  'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754685992/freesia-flower-svgrepo-com_ubjkej.svg',
  'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754685999/flowers-flower-svgrepo-com_2_mrg0uy.svg',
  'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754686008/daisy-flower-svgrepo-com_y2nahd.svg',
]
const MOUNTAIN_SVG = 'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754686025/mountain-svgrepo-com_elnvgl.svg'
const SUN_SVG  = 'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754686032/sun-svgrepo-com_bigc5w.svg'
const MOON_SVG = 'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754686041/moon-svgrepo-com_bn0gra.svg'

const CRAB_SVG   = 'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754684374/crab-svgrepo-com_mfrmuo.svg'
const TURTLE_SVG = 'https://res.cloudinary.com/dz6ugwzxp/image/upload/v1754684367/turtle-svgrepo-com_cnjdks.svg'

/* ============================================================================
   PALETTE & CYCLE
   ============================================================================ */

const PAL = {
  nightTop:  '#0b1625', nightBottom:  '#0e1d30',
  predawnTop:'#15253b', predawnBottom:'#1a2e49',
  dayTop:    '#78caff', dayBottom:    '#a8ddff',
  dawnTop:   '#2a3a5a', dawnBottom:   '#ffb073',
  duskTop:   '#2a3458', duskBottom:   '#ff8ca1',
  sunHalo:   '#ffd23f', moonHalo: '#dfe9ff',
}

const DAY_SEC = 180
const NIGHT_SEC = 180
const MOON_GAP = 2
const DAWN_SEC = 25
const DUSK_SEC = 25
const CYCLE_SEC = DAY_SEC + NIGHT_SEC

function getSkyColors(t: number): { top: string; bottom: string } {
  const pSun = clamp(t / DAY_SEC, 0, 1)
  const pMoon = clamp((t - DAY_SEC - MOON_GAP) / (NIGHT_SEC - MOON_GAP), 0, 1)
  let top = PAL.nightTop
  let bot = PAL.nightBottom
  const kSun = Math.sin(Math.PI * pSun)
  top = lerpColor(top, PAL.dayTop, kSun)
  bot = lerpColor(bot, PAL.dayBottom, kSun)
  const kDawn = bell(pSun, 0, DAWN_SEC / DAY_SEC)
  const kDusk = bell(pSun, 1 - DUSK_SEC / DAY_SEC, 1)
  top = lerpColor(top, PAL.dawnTop, kDawn)
  bot = lerpColor(bot, PAL.dawnBottom, kDawn)
  top = lerpColor(top, PAL.duskTop, kDusk)
  bot = lerpColor(bot, PAL.duskBottom, kDusk)
  const gapDur = Math.min(40, NIGHT_SEC)
  const kGap = smoothstep01((t - DAY_SEC) / gapDur)
  top = lerpColor(top, PAL.nightTop, kGap)
  bot = lerpColor(bot, PAL.nightBottom, kGap)
  const kPre = smoothstep01((pMoon - 0.8) / 0.2)
  top = lerpColor(top, PAL.predawnTop, kPre)
  bot = lerpColor(bot, PAL.predawnBottom, kPre)
  return { top, bottom: bot }
}

/* ============================================================================
   TYPES
   ============================================================================ */

type AnimalState = 'walk' | 'idle' | 'leaving'
type PlainAnimal = {
  id: number; type: AnimalType; x: number; y: number; dir: 1 | -1;
  speed: number; state: AnimalState; sizeScale: number; isBaby: boolean;
  target?: { x: number; y: number }; cooldownMateUntil?: number;
  phaseTag: 'day' | 'night'
}

type ShoreKind = 'crab' | 'turtle'
type ShoreAnimal = {
  id: number; kind: ShoreKind; x: number; y: number; dir: 1 | -1;
  speedSand: number; speedWater: number; zone: 'sand' | 'water';
  sizeScale: number; isBaby: boolean; cooldownMateUntil?: number;
}

type HeartFX = { id: number; x: number; y: number; until: number }
type SplashFX = { id: number; x: number; y: number; until: number; water: boolean }
type BubbleFX = { id: number; x: number; y: number; until: number }
type WaveFX = { id: number; x: number; y: number; until: number }
type Debris = { id: number; x: number; y: number; v: number; size: number; life: number; t: number; op: number }
type LeafBubble = { id: number; x: number; y: number; until: number }

/* ============================================================================
   CONSTANTES PERF
   ============================================================================ */

const TICK_MS = 33 // ~30fps
const MAX_LEAVES = 6
const MAX_LEAF_BUBBLES = 30
const MAX_WAVES = 8
const MAX_SPLASHES = 20
const MAX_WATER_BUBBLES = 40
const MAX_SHORE_ADULTS = 4
const MAX_PLAIN_ADULTS = 3

/* ============================================================================
   COMPONENT
   ============================================================================ */

export default function SpecialBackground() {
  /* --------- Temps (cycle) ---------- */
  const [timeSec, setTimeSec] = useState(0)
  useEffect(() => {
    let raf = 0
    let lastRAF = performance.now()
    let acc = 0
    const start = performance.now()
    const frame = (now: number) => {
      const dt = now - lastRAF
      lastRAF = now
      acc += dt
      if (acc >= TICK_MS) {
        const t = ((now - start) / 1000) % CYCLE_SEC
        setTimeSec(t)
        acc = 0
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])
  const t = timeSec

  /* --------- Astres ---------- */
  const pSun = clamp(t / DAY_SEC, 0, 1)
  const pMoon = clamp((t - DAY_SEC - MOON_GAP) / (NIGHT_SEC - MOON_GAP), 0, 1)
  const mapX = (p: number) => -10 + 120 * p
  const sunX = mapX(pSun)
  const moonX = mapX(pMoon)
  const sunY = 34 + Math.sin(Math.PI * pSun) * -18
  const moonY = 38 + Math.sin(Math.PI * pMoon) * -14
  const showSun = t < DAY_SEC
  const showMoon = t >= DAY_SEC + MOON_GAP
  const { top: skyTop, bottom: skyBottom } = getSkyColors(t)

  /* --------- Étoiles ---------- */
  const stars = useMemo(() => {
    const rng = mulberry32(20250808)
    return Array.from({ length: 120 }).map((_, k) => ({
      id: `star-${k}`, left: Math.round(rng() * 100), top: Math.round(rng() * 28),
      size: 1 + Math.round(rng() * 2), tw: 2 + rng() * 3, delay: rng() * 5,
    }))
  }, [])
  const starStrength = Math.sin(Math.PI * pMoon)

  /* --------- Nuages (formes variées) ---------- */
  const CLOUD_PATHS = [
    'M20,100 C35,60 60,40 95,45 C110,20 145,15 170,35 C190,25 230,30 245,60 C280,60 300,75 302,100 L20,100 Z',
    'M10,100 C30,70 55,55 80,60 C105,35 150,25 180,50 C210,40 250,55 270,80 C290,80 300,90 304,100 L10,100 Z',
    'M0,100 C20,75 40,65 70,70 C90,50 130,45 160,60 C195,55 230,70 250,85 C270,85 300,95 306,100 L0,100 Z',
  ]
  function PrettyCloud({ size = 150, variant = 0 }: { size?: number; variant?: number }) {
    const i = Math.abs(variant) % CLOUD_PATHS.length
    return (
      <svg viewBox="0 0 306.67 200" width={size} height={(size * 200) / 306.67} style={{ filter: 'drop-shadow(0 8px 12px #0003)' }}>
        <defs>
          <linearGradient id={`cfill-${i}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eef4ff" />
          </linearGradient>
        </defs>
        <path d={CLOUD_PATHS[i]} fill={`url(#cfill-${i})`} stroke="#ffffff" strokeOpacity={0.35} strokeWidth="2" />
      </svg>
    )
  }
  const clouds = useMemo(() => {
    const rng = mulberry32(99021)
    const layers = [
      { count: 3, z: 2, durMin: 200, durVar: 140, sizeMin: 120, sizeVar: 120, topMin: 4, topVar: 14 },
      { count: 4, z: 3, durMin: 110, durVar: 100, sizeMin: 220, sizeVar: 180, topMin: 10, topVar: 20 },
    ]
    const arr: React.ReactElement[] = []
    layers.forEach((L, li) => {
      for (let i = 0; i < L.count; i++) {
        const size = L.sizeMin + Math.round(rng() * L.sizeVar)
        const top = L.topMin + Math.round(rng() * L.topVar)
        const dur = L.durMin + rng() * L.durVar
        const delay = -rng() * dur * 1.5
        const sx = 0.8 + rng() * 0.6
        const sy = 0.8 + rng() * 0.6
        const rot = (rng() - 0.5) * 10
        const v = Math.floor(rng() * CLOUD_PATHS.length)
        arr.push(
          <motion.div
            key={`c-${li}-${i}`}
            initial={{ x: '110vw' }}
            animate={{ x: '-120vw' }}
            transition={{ duration: dur, repeat: Infinity, delay, ease: 'linear' }}
            style={{ position: 'absolute', top: `${top}vh`, zIndex: L.z, pointerEvents: 'none', opacity: 0.95,
              transform: `scaleX(${sx}) scaleY(${sy}) rotate(${rot}deg)` }}
          >
            <PrettyCloud size={size} variant={v} />
          </motion.div>
        )
      }
    })
    return arr
  }, []) // stable

  /* --------- Fleurs / Coquillages (statiques) ---------- */
  const flowers = useMemo(() => {
    const rng = mulberry32(1312)
    const pts = Array.from({ length: 44 }).map(() => ({ x: 2 + rng() * 96, y: 56 + rng() * 16 }))
      .sort((a, b) => a.x - b.x)
    for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i].x - pts[i - 1].x) < 2.2) pts[i].x += 2 + rng() * 2
    return pts.map((p, i) => {
      const size = 14 + Math.round(rng() * 10)
      const src = FLOWER_SVGS[Math.floor(rng() * FLOWER_SVGS.length)]
      return <div key={`fl-${i}`} style={{ position: 'absolute', left: `${clamp(p.x, 0, 98)}vw`, top: `${clamp(p.y, 56, 72.2)}vh`, zIndex: 6, pointerEvents: 'none' }}>
        <img src={src} alt="flower" style={{ width: size, height: 'auto' }} />
      </div>
    })
  }, [])
  const shells = useMemo(() => {
    const rng = mulberry32(88888)
    const forms = [
      (c: string, s: string) => <>
        <path d="M2 10 Q10 -2 18 10 Z" fill={c} stroke={s} strokeWidth="0.8" />
        <path d="M6 9 Q10 3 14 9" fill="none" stroke={s} strokeWidth="0.6" opacity="0.6" />
      </>,
      (c: string, s: string) => <>
        <path d="M1 10 C6 1,14 1,19 10 Z" fill={c} stroke={s} strokeWidth="0.8" />
        <path d="M5 9 C8 4,12 4,15 9" fill="none" stroke={s} strokeWidth="0.6" opacity="0.6" />
      </>,
      (c: string, s: string) => <>
        <path d="M2 10 Q10 0 18 10 Q10 12 2 10 Z" fill={c} stroke={s} strokeWidth="0.8" />
      </>,
      (c: string, s: string) => <>
        <circle cx="10" cy="8" r="6" fill={c} stroke={s} strokeWidth="0.8" />
        <path d="M6 8 A4 4 0 0 0 14 8" fill="none" stroke={s} strokeWidth="0.6" opacity="0.6" />
      </>,
    ]
    const base = ['#f8e0c8', '#ffe7d3', '#f4d2aa']
    const tints = ['#ffb0b0', '#b0c4ff', '#d4b0ff', '#ffcabf']
    const mix = (a: string, b: string, t: number) => lerpColor(a, b, t)
    return Array.from({ length: 22 }).map((_, i) => {
      const left = 2 + rng() * 96
      const top = 75 + rng() * 9
      const size = 10 + rng() * 10
      const f = forms[Math.floor(rng() * forms.length)]
      const col = mix(base[Math.floor(rng() * base.length)], tints[Math.floor(rng() * tints.length)], 0.18 + rng() * 0.22)
      const stroke = lerpColor(col, '#bca48f', 0.4)
      const rot = (rng() - 0.5) * 40
      return (
        <div key={`sh-${i}`} style={{ position: 'absolute', left: `${left}vw`, top: `${top}vh`, zIndex: 7, transform: `rotate(${rot}deg)` }}>
          <svg viewBox="0 0 20 12" width={size} height={(size * 12) / 20} style={{ filter: 'drop-shadow(0 1px 2px #0002)' }}>
            {f(col, stroke)}
          </svg>
        </div>
      )
    })
  }, [])

  /* --------- États dynamiques ---------- */
  const [debris, setDebris] = useState<Debris[]>([])
  const [leafBubbles, setLeafBubbles] = useState<LeafBubble[]>([])
  const [waves, setWaves] = useState<WaveFX[]>([])
  const [animals, setAnimals] = useState<PlainAnimal[]>([])
  const [hearts, setHearts] = useState<HeartFX[]>([])
  const [shore, setShore] = useState<ShoreAnimal[]>([
    { id: 1, kind: 'crab',   x: -8,  y: 78, dir: 1,  speedSand: 6,  speedWater: 8.0, zone: 'sand',  sizeScale: 1, isBaby: false },
    { id: 2, kind: 'turtle', x: 108, y: 88, dir: -1, speedSand: 4.2, speedWater: 6.0, zone: 'water', sizeScale: 1, isBaby: false },
  ])
  const [shoreHearts, setShoreHearts] = useState<HeartFX[]>([])
  const [splashes, setSplashes] = useState<SplashFX[]>([])
  const [bubbles, setBubbles] = useState<BubbleFX[]>([])

  /* --------- IDs/Timers ---------- */
  const debId = useRef(1)
  const leafBubbleId = useRef(1)
  const waveId = useRef(1)
  const splashId = useRef(1)
  const bubbleId = useRef(1)
  const nextDebris = useRef(performance.now() + 6000 + Math.random() * 6000)
  const nextWaveAt = useRef(performance.now() + 5000 + Math.random() * 6000)
  const nextAnimalId = useRef(1)
  const nextSpawnAt = useRef(performance.now() + 4000)
  const nextShoreId = useRef(3)
  const lastCrabCheckAt = useRef(performance.now())

  /* --------- Constantes logique ---------- */
  const PLAIN_Y_MIN = 56, PLAIN_Y_MAX = 71
  const HEART_MS = 7000
  const isDayNow = t < DAY_SEC
  const countAdultsPlain = (list: PlainAnimal[]) => list.filter(a => !a.isBaby).length
  const adultsCountCombined = (arr: ShoreAnimal[]) => arr.filter(a => !a.isBaby).length
  const hasCrabAdult = (arr: ShoreAnimal[]) => arr.some(a => !a.isBaby && a.kind === 'crab')

  function randomTargetPlain() {
    return { x: -8 + Math.random() * 116, y: PLAIN_Y_MIN + Math.random() * (PLAIN_Y_MAX - PLAIN_Y_MIN) }
  }

  function spawnPlainAnimal(opts?: { type?: AnimalType; babyOf?: AnimalType; near?: { x: number; y: number } }) {
    setAnimals(cur => {
      const isBaby = !!opts?.babyOf
      if (!isBaby && countAdultsPlain(cur) >= MAX_PLAIN_ADULTS) return cur
      const pool = isDayNow ? DAY_SPECIES : NIGHT_SPECIES
      const chosenType = (opts?.type ?? opts?.babyOf ?? pool[Math.floor(Math.random() * pool.length)]) as AnimalType
      const id = nextAnimalId.current++
      const sizeScale = isBaby ? 0.62 : 1
      const baseSpeed = BASE_SPEED[chosenType] * (isBaby ? 0.9 : 1) * 0.92
      const startX = opts?.near ? opts.near.x + (Math.random() - 0.5) * 2 : (Math.random() < 0.5 ? -12 : 112)
      const startY = opts?.near ? opts.near.y : 56 + Math.random() * 14
      const a: PlainAnimal = {
        id, type: chosenType, x: startX, y: startY, dir: startX < 50 ? 1 : -1, speed: baseSpeed, state: 'walk',
        sizeScale, isBaby, target: randomTargetPlain(), phaseTag: isDayNow ? 'day' : 'night',
      }
      return [...cur, a]
    })
  }

  /* ============================================================================
     TICKER ~30fps — TOUTE LA LOGIQUE DYNAMIQUE REGROUPÉE
     ============================================================================ */
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let acc = 0
    const loop = (now: number) => {
      const dtMs = now - last
      last = now
      acc += dtMs
      if (acc >= TICK_MS) {
        const dt = acc / 1000 // regrouper le temps accumulé
        acc = 0

        /* ---- FEUILLES SUR L'EAU ---- */
        setDebris(prev => {
          let newLeafBubbles: LeafBubble[] = []
          const arr = prev.map(d => {
            const nx = d.x + d.v * dt
            const ny = d.y + Math.sin((d.t + dt) * 1.2) * 0.05
            if (Math.random() < 0.10 * dt) {
              newLeafBubbles.push({
                id: leafBubbleId.current++,
                x: nx - 0.6 + (Math.random() - 0.5) * 0.6,
                y: ny + 0.1 + (Math.random() - 0.5) * 0.4,
                until: performance.now() + 1100 + Math.random() * 500,
              })
            }
            return { ...d, x: nx, y: ny, t: d.t + dt }
          }).filter(d => d.x < 120 && d.t < d.life)

          if (performance.now() >= nextDebris.current && arr.length < MAX_LEAVES) {
            nextDebris.current = performance.now() + 7000 + Math.random() * 9000
            arr.push({
              id: debId.current++,
              x: -10,
              y: 87 + (Math.random() * 9),
              v: 3.0 + Math.random() * 1.6,
              size: 12 + Math.random() * 10,
              life: 24 + Math.random() * 10,
              t: 0,
              op: 0.72 + Math.random() * 0.18,
            })
          }

          if (newLeafBubbles.length) {
            setLeafBubbles(prevB => {
              const merged = [...prevB.filter(b => b.until > performance.now()), ...newLeafBubbles]
              return merged.slice(-MAX_LEAF_BUBBLES)
            })
          } else {
            setLeafBubbles(prevB => prevB.filter(b => b.until > performance.now()))
          }

          return arr
        })

        /* ---- VAGUELETTES PONCTUELLES ---- */
        if (performance.now() >= nextWaveAt.current) {
          nextWaveAt.current = performance.now() + 5500 + Math.random() * 7000
          const y = 88 + (Math.random() - 0.5) * 4
          const x = 10 + Math.random() * 80
          setWaves(prev => {
            const arr = [...prev, { id: waveId.current++, x, y, until: performance.now() + 1600 }]
            return arr.slice(-MAX_WAVES)
          })
        } else {
          setWaves(prev => prev.filter(w => w.until > performance.now()))
        }

        /* ---- SPAWN PLAINE ---- */
        if (performance.now() >= nextSpawnAt.current) {
          nextSpawnAt.current = performance.now() + 8500 + Math.random() * 9500
          spawnPlainAnimal()
        }

        /* ---- MOUVEMENTS PLAINE ---- */
        setAnimals(prev => {
          const arr = prev.map(a => ({ ...a }))
          for (const a of arr) {
            const shouldStay = (a.phaseTag === 'day' && isDayNow) || (a.phaseTag === 'night' && !isDayNow)
            if (!shouldStay && a.state !== 'leaving') {
              a.state = 'leaving'
              a.target = { x: a.x < 50 ? -20 : 120, y: clamp(a.y + (Math.random() - 0.5) * 6, PLAIN_Y_MIN, PLAIN_Y_MAX) }
            }
            if (shouldStay && a.state === 'leaving') {
              a.state = 'walk'
              a.target = randomTargetPlain()
            }
            if (a.state === 'walk') {
              if (!a.target || Math.hypot(a.x - a.target.x, a.y - a.target.y) < 1.2 || Math.random() < 0.002) {
                a.target = randomTargetPlain(); if (Math.random() < 0.15) a.state = 'idle'
              }
            } else if (a.state === 'idle' && Math.random() < 0.01) {
              a.state = 'walk'
            }
            if ((a.state === 'walk' || a.state === 'leaving') && a.target) {
              const dx = a.target.x - a.x, dy = a.target.y - a.y
              const d = Math.hypot(dx, dy) || 1e-6
              const vx = (dx / d) * a.speed, vy = (dy / d) * a.speed
              a.dir = vx >= 0 ? 1 : -1
              a.x += vx * dt
              a.y = clamp(a.y + vy * dt, PLAIN_Y_MIN, PLAIN_Y_MAX)
            }
          }

          // repro avec collecte d'effets
          const newHearts: HeartFX[] = []
          for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
            const A = arr[i], B = arr[j]
            if (A.phaseTag !== B.phaseTag || A.type !== B.type) continue
            if (A.state === 'leaving' || B.state === 'leaving') continue
            const nowMs = performance.now()
            if ((A.cooldownMateUntil ?? 0) > nowMs || (B.cooldownMateUntil ?? 0) > nowMs) continue
            const d = Math.hypot(A.x - B.x, A.y - B.y)
            if (d < 2.3 && Math.random() < 0.008) {
              const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2
              A.state = 'idle'; B.state = 'idle'
              const cd = 60000 + Math.random() * 40000
              A.cooldownMateUntil = nowMs + cd; B.cooldownMateUntil = nowMs + cd
              newHearts.push({ id: (A.id * 10000 + B.id) ^ 0x9e3779b9, x: cx, y: cy - 2, until: nowMs + HEART_MS })
              if (arr.filter(x => x.type === A.type).length < 3) {
                setTimeout(() => spawnPlainAnimal({ babyOf: A.type, near: { x: cx, y: cy } }), 350)
              }
            }
          }
          if (newHearts.length) {
            setHearts(prevH => {
              const kept = prevH.filter(h => h.until > performance.now())
              return [...kept, ...newHearts].slice(-12)
            })
          } else {
            setHearts(prevH => prevH.filter(h => h.until > performance.now()))
          }

          return arr.filter(a => a.x > -25 && a.x < 125)
        })

        /* ---- SHORE (CRAB/TURTLE) ---- */
        setShore(prev => {
          let arr = prev.map(a => ({ ...a }))
          if (adultsCountCombined(arr) < MAX_SHORE_ADULTS && Math.random() < 0.008) {
            const forceCrab = (!hasCrabAdult(arr) && performance.now() - lastCrabCheckAt.current > 10000)
            const spawnCrab = forceCrab || Math.random() < 0.5
            if (forceCrab) lastCrabCheckAt.current = performance.now()
            arr.push({
              id: nextShoreId.current++,
              kind: spawnCrab ? 'crab' : 'turtle',
              x: Math.random() < 0.5 ? -10 : 110,
              y: spawnCrab ? (78 + Math.random() * 6) : (88 + Math.random() * 4),
              dir: Math.random() < 0.5 ? 1 : -1,
              speedSand: spawnCrab ? 6 : 4.2,
              speedWater: spawnCrab ? 8.0 : 6.0,
              zone: spawnCrab ? 'sand' : 'water',
              sizeScale: 1,
              isBaby: false,
            })
          }

          const newSplashes: SplashFX[] = []
          const newBubbles: BubbleFX[] = []
          for (const a of arr) {
            const prevZone = a.zone
            const targetX = a.x + a.dir * (a.zone === 'water' ? a.speedWater : a.speedSand)
            const targetY = a.zone === 'water'
              ? (a.kind === 'crab' ? 77.5 + Math.sin(performance.now() / 700 + a.id) * 0.8 : 88 + Math.sin(performance.now() / 850 + a.id) * 0.6)
              : (a.kind === 'crab' ? 78 + Math.sin(performance.now() / 900 + a.id) * 0.5 : 78 + Math.sin(performance.now() / 1050 + a.id) * 0.4)

            const dx = targetX - a.x, dy = targetY - a.y
            const d = Math.hypot(dx, dy) || 1e-6
            const sp = a.zone === 'water' ? a.speedWater : a.speedSand
            const vx = (dx / d) * sp * 0.8, vy = (dy / d) * sp * 0.8

            a.x += vx * dt
            a.y += vy * dt

            if (Math.random() < 0.0025) a.dir *= -1
            if (Math.random() < 0.0012) a.zone = a.zone === 'water' ? 'sand' : 'water'

            if (prevZone !== a.zone) {
              const baseId = splashId.current++
              const isToWater = a.zone === 'water'
              const yOff = isToWater ? 1.1 : -1.1
              const nowMs = performance.now()
              // 2 cercles + 0..1 goutte (au lieu de 3) → moins d’objets
              newSplashes.push({ id: baseId, x: a.x, y: a.y + yOff, until: nowMs + 700, water: isToWater })
              newSplashes.push({ id: baseId + 1000, x: a.x + (Math.random() - 0.5) * 1.0, y: a.y, until: nowMs + 650, water: isToWater })
              if (Math.random() < 0.5) newSplashes.push({ id: baseId + 2000, x: a.x + (Math.random() - 0.5) * 1.0, y: a.y, until: nowMs + 600, water: isToWater })
            }
            if (a.zone === 'water' && Math.random() < 0.18 * dt) {
              newBubbles.push({
                id: bubbleId.current++,
                x: a.x - a.dir * 1.1 + (Math.random() - 0.5) * 0.7,
                y: a.y - 0.4 + (Math.random() - 0.5) * 0.5,
                until: performance.now() + 1200 + Math.random() * 400,
              })
            }
          }

          if (newSplashes.length) {
            setSplashes(prevS => {
              const kept = prevS.filter(s => s.until > performance.now())
              const merged = [...kept, ...newSplashes]
              return merged.slice(-MAX_SPLASHES)
            })
          } else {
            setSplashes(prevS => prevS.filter(s => s.until > performance.now()))
          }
          if (newBubbles.length) {
            setBubbles(prevB => {
              const kept = prevB.filter(b => b.until > performance.now())
              const merged = [...kept, ...newBubbles]
              return merged.slice(-MAX_WATER_BUBBLES)
            })
          } else {
            setBubbles(prevB => prevB.filter(b => b.until > performance.now()))
          }

          // repro shore
          const newHearts: HeartFX[] = []
          for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
            const A = arr[i], B = arr[j]
            if (A.kind !== B.kind) continue
            const nowMs = performance.now()
            if ((A.cooldownMateUntil ?? 0) > nowMs || (B.cooldownMateUntil ?? 0) > nowMs) continue
            const d = Math.hypot(A.x - B.x, A.y - B.y)
            if (d < 2.1 && Math.random() < 0.016) {
              const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2
              A.cooldownMateUntil = nowMs + 90000; B.cooldownMateUntil = nowMs + 90000
              if (arr.filter(x => x.kind === A.kind).length < 3) {
                arr.push({
                  id: nextShoreId.current++,
                  kind: A.kind,
                  x: cx + (Math.random() - 0.5) * 1.4,
                  y: cy + (Math.random() - 0.5) * 0.6,
                  dir: Math.random() < 0.5 ? -1 : 1,
                  speedSand: A.kind === 'crab' ? 6 : 4.2,
                  speedWater: A.kind === 'crab' ? 8.0 : 6.0,
                  zone: Math.random() < 0.5 ? 'sand' : 'water',
                  sizeScale: 0.6,
                  isBaby: true,
                })
              }
              newHearts.push({ id: (A.id * 10000 + B.id) ^ 0x9e3779b9, x: cx, y: cy - 2, until: nowMs + 8000 })
            }
          }
          if (newHearts.length) {
            setShoreHearts(prevH => {
              const kept = prevH.filter(h => h.until > performance.now())
              return [...kept, ...newHearts].slice(-12)
            })
          } else {
            setShoreHearts(prevH => prevH.filter(h => h.until > performance.now()))
          }

          arr = arr.filter(a => a.x > -20 && a.x < 120)
          return arr
        })
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [isDayNow])

  /* --------- Montagnes / Arbres ---------- */
  const mountainsFront = useMemo(() => {
    const rng = mulberry32(420042)
    const items: Array<{ x: number; w: number; y: number; z: number }> = []
    let x = -12
    while (x < 112) {
      const w = 18 + rng() * 16
      const step = w * 0.88
      const y = 30 + rng() * 3.5
      items.push({ x, w, y, z: 4 }); x += step
    }
    return items
  }, [])
  const treeLayers = useMemo(() => {
    const rng = mulberry32(777001)
    const bands = 6, perBand = 5
    const layers: Array<{ x: number; yBottomVh: number; size: number; src: string }> = []
    for (let b = 0; b < bands; b++) {
      const depth = b / (bands - 1)
      const baseSize = lerp(120, 60, depth)
      const yBottom = lerp(1.2, 18.5, depth)
      for (let i = 0; i < perBand; i++) {
        let x = 2 + (i + rng()) * (96 / perBand)
        x += (rng() - 0.5) * (6 + 8 * (1 - depth))
        layers.push({
          x: clamp(x, 0, 98),
          yBottomVh: yBottom,
          size: baseSize + (rng() - 0.5) * 12,
          src: TREE_SVGS[Math.floor(rng() * TREE_SVGS.length)],
        })
      }
    }
    return layers.sort((a, b) => a.size - b.size)
  }, [])

  /* ============================== RENDER ============================== */
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {/* CIEL */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${skyTop} 55%, ${skyBottom} 100%)`, zIndex: 0 }} />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '3px 3px', opacity: 0.35, zIndex: 0 }} />

      {/* ÉTOILES */}
      {stars.map(s => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: starStrength === 0 ? 0 : [0.1 * starStrength, 0.8 * starStrength, 0.1 * starStrength] }}
          transition={{ duration: s.tw, repeat: Infinity, delay: s.delay }}
          style={{ position: 'absolute', left: `${s.left}vw`, top: `${s.top}vh`, width: s.size, height: s.size, borderRadius: s.size, background: '#fff', boxShadow: '0 0 6px #fff8', zIndex: 1 }}
        />
      ))}

      {/* SOLEIL / LUNE */}
      {showMoon && (
        <div style={{ position: 'absolute', left: `${moonX}vw`, top: `${moonY}vh`, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
          <div style={{ position: 'absolute', inset: -22, borderRadius: '50%', background: `radial-gradient(${PAL.moonHalo}99, ${PAL.moonHalo}00 70%)`, filter: 'blur(10px)' }} />
          <img src={MOON_SVG} alt="moon" style={{ width: 84, height: 84 }} />
        </div>
      )}
      {showSun && (
        <div style={{ position: 'absolute', left: `${sunX}vw`, top: `${sunY}vh`, transform: 'translate(-50%, -50%)', zIndex: 2 }}>
          <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', background: `radial-gradient(${PAL.sunHalo}88, ${PAL.sunHalo}00 70%)`, filter: 'blur(8px)' }} />
          <img src={SUN_SVG} alt="sun" style={{ width: 90, height: 90 }} />
        </div>
      )}

      {/* Nuages */}
      {clouds}

      {/* Montagnes */}
      {mountainsFront.map((m, i) => (
        <div key={`mntf-${i}`} style={{ position: 'absolute', left: `${m.x}vw`, top: `${m.y}vh`, width: `${m.w}vw`, zIndex: 3 }}>
          <img src={MOUNTAIN_SVG} alt="mountain" style={{ width: '100%', height: 'auto' }} />
        </div>
      ))}

      {/* PLAINE */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '52vh',
          height: '22.5vh',
          zIndex: 4,
          backgroundImage: [
            'linear-gradient(to top,#379f3d 65%,#56b95a 100%)',
            'repeating-linear-gradient(45deg, #1b5e2014 0 6px, #0000 6px 14px)',
            'radial-gradient(#ffffff22 0.7px, transparent 0.7px)',
            'radial-gradient(#0000001f 0.7px, transparent 0.7px)',
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22'><path d='M11 19c-1-3 0-6 0-6s1 2 2 4c1-2 2-4 2-4s0 3-1 6' fill='none' stroke='%233b7c3b' stroke-width='1.2' stroke-linecap='round'/></svg>\")",
            'radial-gradient(closest-side, #27582822, #0000 70%)',
          ].join(','),
          backgroundSize: '100% 100%, 20px 20px, 6px 6px, 8px 8px, 22px 22px, 80px 60px',
          backgroundPosition: '0 0, 0 0, 0 0, 3px 4px, 0 0, 2vw 4vh',
          backgroundRepeat: 'no-repeat, repeat, repeat, repeat, repeat, repeat',
        }}
      />
      {flowers}

      {/* PLAGE */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '74vh',
          height: '10.5vh',
          zIndex: 6,
          backgroundImage: [
            'linear-gradient(#f6d39b,#edc585)',
            'repeating-linear-gradient(0deg, #b98d5a4d 0 2px, #0000 2px 8px)',
            'radial-gradient(#7a5a2a44 1.2px, transparent 1.2px)',
            'radial-gradient(#ffffffaa 1.2px, transparent 1.2px)',
            'repeating-linear-gradient(60deg, #0000 0 16px, #00000017 16px 19px)',
          ].join(','),
          backgroundSize: '100% 100%, 100% 10px, 10px 10px, 14px 14px, 22px 22px',
          backgroundPosition: '0 0, 0 0, 0 0, 4px 6px, 0 0',
          backgroundRepeat: 'no-repeat, repeat, repeat, repeat, repeat',
        }}
      />
      {shells}

      {/* RIVIÈRE — eau (fond + petits traits) */}
      <div
        className="absolute left-0 right-0"
        style={{
          bottom: 0, top: '84.5vh',
          zIndex: 2,
          overflow: 'hidden',
          backgroundImage: [
            'linear-gradient(to top,#2f90d8 70%,#49b0fb 100%)',
            'repeating-linear-gradient(0deg, #ffffff22 0 1px, #0000 1px 7px)',
            'repeating-linear-gradient(135deg, #ffffff18 0 4px, #0000 4px 10px)',
            'radial-gradient(#ffffff22 1.1px, transparent 1.1px)',
          ].join(','),
          backgroundSize: '100% 100%, 100% 8px, 8px 8px, 10px 10px',
          backgroundPosition: '0 0, 0 0, 0 0, 0 0',
          backgroundRepeat: 'no-repeat, repeat, repeat, repeat',
        }}
      >
        {useMemo(() => {
          const rng = mulberry32(424242)
          const lines = Array.from({ length: 14 }).map((_, i) => {
            const topPct = 20 + rng() * 50
            const widthPx = 24 + rng() * 38
            const thickness = 1 + (rng() < 0.25 ? 1 : 0)
            const duration = 28 + rng() * 18
            const delay = -rng() * duration
            const opacity = 0.18 + rng() * 0.18
            return (
              <motion.div
                key={`wline-${i}`}
                initial={{ x: '-20vw' }}
                animate={{ x: '120vw' }}
                transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
                style={{
                  position: 'absolute',
                  top: `${topPct}%`,
                  left: 0,
                  width: widthPx,
                  height: thickness,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.9)',
                  opacity,
                  filter: 'blur(0.2px)',
                  mixBlendMode: 'screen',
                }}
              />
            )
          })
          return lines
        }, [])}
      </div>

      {/* Vaguelettes ponctuelles */}
      {waves.map(w => {
        const life = Math.max(0, w.until - performance.now())
        const k = 1 - life / 1600
        const op = 0.45 * (1 - k)
        const size = 20 + 16 * k
        return (
          <div key={`wave-${w.id}`} style={{ position: 'absolute', left: `${w.x}vw`, top: `${w.y}vh`, transform: 'translate(-50%, -50%)', zIndex: 4, pointerEvents: 'none', opacity: op }}>
            <div style={{ width: size, height: size * 0.5, borderRadius: 999, border: '2px solid #e6f5ff', background: '#ffffff10', filter: 'blur(0.2px)' }} />
          </div>
        )
      })}

      {/* FEUILLES flottantes */}
      {debris.map(d => (
        <div
          key={`deb-${d.id}`}
          style={{
            position: 'absolute',
            left: `${d.x}vw`, top: `${d.y}vh`,
            transform: 'translate(-50%,-50%)',
            zIndex: 11,
            pointerEvents: 'none',
            opacity: d.op,
            filter: 'drop-shadow(0 0.6px 1.2px #0003)',
          }}>
          <svg viewBox="0 0 24 12" width={d.size} height={(d.size * 12) / 24}>
            <path d="M2 6 Q10 -2 22 6 Q10 14 2 6 Z" fill="#8AD18E" stroke="#4E9B63" strokeWidth="1.1" />
            <path d="M3 6 L21 6" stroke="#4E9B63" strokeWidth="0.8" />
          </svg>
        </div>
      ))}

      {/* Bulles feuilles */}
      {leafBubbles.map(b => {
        const life = Math.max(0, b.until - performance.now())
        const k = 1 - life / 1400
        const r = 3 + 2 * k
        const op = 0.58 * (1 - k)
        return (
          <div key={`lb-${b.id}`} style={{ position: 'absolute', left: `${b.x}vw`, top: `${b.y - k * 1.2}vh`, transform: 'translate(-50%, -50%)', zIndex: 11, opacity: op, pointerEvents: 'none' }}>
            <div style={{ width: r, height: r, borderRadius: 999, border: '1px solid #dff2ff', background: '#ffffff10', filter: 'blur(0.2px)' }} />
          </div>
        )
      })}

      {/* ANIMAUX PLAINE */}
      {animals.map(a => {
        const babyFilter = a.isBaby ? 'saturate(0.85) brightness(1.18) hue-rotate(10deg)' : 'none'
        return (
          <div key={`animal-${a.id}`} style={{ position: 'absolute', top: `${a.y}vh`, left: `${a.x}vw`, transform: 'translate(-50%, -50%)', zIndex: 9 }}>
            <img
              src={ICONS[a.type]} alt={a.type}
              style={{
                width: BASE_SIZE[a.type] * a.sizeScale,
                height: 'auto',
                transform: a.dir < 0 ? 'scaleX(-1)' : undefined,
                filter: `drop-shadow(0 2px 4px #0003) ${babyFilter}`,
              }}
            />
          </div>
        )
      })}

      {/* SHORE — CRAB & TURTLE */}
      {shore.map(s => {
        const isCrab = s.kind === 'crab'
        const imgSrc = isCrab ? CRAB_SVG : TURTLE_SVG
        const z = s.zone === 'sand' ? 10 : 8
        const babyFilter = s.isBaby ? 'saturate(0.85) brightness(1.18) hue-rotate(10deg)' : 'none'
        if (isCrab) {
          const flip = s.dir < 0 ? ' scaleX(-1)' : ''
          return (
            <div key={`shore-${s.id}`} style={{ position: 'absolute', left: `${s.x}vw`, top: `${s.y}vh`, transform: 'translate(-50%, -50%)', zIndex: z }}>
              <img src={imgSrc} alt="crab" style={{ width: 32 * s.sizeScale, height: 'auto', transform: `rotate(180deg)${flip}`, filter: `drop-shadow(0 2px 4px #0003) ${babyFilter}` }} />
            </div>
          )
        }
        const extra = s.dir < 0 ? ' scaleX(-1)' : ''
        return (
          <div key={`shore-${s.id}`} style={{ position: 'absolute', left: `${s.x}vw`, top: `${s.y}vh`, transform: 'translate(-50%, -50%)', zIndex: z }}>
            <img src={imgSrc} alt="turtle" style={{ width: 34 * s.sizeScale, height: 'auto', transform: `scaleX(-1)${extra}`, filter: `drop-shadow(0 2px 4px #0003) ${babyFilter}` }} />
          </div>
        )
      })}

      {/* Splashes (optimisés) */}
      {splashes.map(s => {
        const life = Math.max(0, s.until - performance.now())
        const k = 1 - life / 700
        const r = 8 + 9 * k
        const op = 0.5 * (1 - k)
        return (
          <div key={`spl-${s.id}`} style={{ position: 'absolute', left: `${s.x}vw`, top: `${s.y}vh`, transform: 'translate(-50%, -50%)', zIndex: 9, pointerEvents: 'none', opacity: op }}>
            <div style={{ width: r, height: r * 0.5, borderRadius: 999, border: '2px solid #e6f5ff', background: '#ffffff10', filter: 'blur(0.2px)' }} />
          </div>
        )
      })}

      {/* Bulles shore */}
      {bubbles.map(b => {
        const life = Math.max(0, b.until - performance.now())
        const k = 1 - life / 1300
        const r = 3.5 + 2.0 * k
        const op = 0.55 * (1 - k)
        return (
          <div key={`wb-${b.id}`} style={{ position: 'absolute', left: `${b.x}vw`, top: `${b.y - k * 1.2}vh`, transform: 'translate(-50%, -50%)', zIndex: 9, opacity: op, pointerEvents: 'none' }}>
            <div style={{ width: r, height: r, borderRadius: 999, border: '1px solid #dff2ff', background: '#ffffff10', filter: 'blur(0.2px)' }} />
          </div>
        )
      })}

      {/* Cœurs */}
      {hearts.map(h => {
        const life = Math.max(0, h.until - performance.now())
        const alpha = Math.min(1, life / 7000)
        return (
          <motion.div key={`heart-pl-${h.id}-${Math.round(h.until)}`} style={{ position: 'absolute', left: `${h.x}vw`, top: `${h.y}vh`, zIndex: 11, transform: 'translate(-50%, -50%)' }}
            animate={{ y: [0, -2, 0], opacity: [alpha, alpha * 0.8, alpha] }} transition={{ duration: 2.2, repeat: Infinity }}>
            <svg viewBox="0 0 32 28" width={18} height={(18 * 28) / 32}><path d="M16 26 C-10 10 8 -2 16 8 C24 -2 42 10 16 26 Z" fill="#ff5a8a" stroke="#ff2d6b" strokeWidth="1" /></svg>
          </motion.div>
        )
      })}
      {shoreHearts.map(h => {
        const life = Math.max(0, h.until - performance.now())
        const alpha = Math.min(1, life / 8000)
        return (
          <motion.div key={`heart-sh-${h.id}-${Math.round(h.until)}`} style={{ position: 'absolute', left: `${h.x}vw`, top: `${h.y}vh`, zIndex: 11, transform: 'translate(-50%, -50%)' }}
            animate={{ y: [0, -2, 0], opacity: [alpha, alpha * 0.8, alpha] }} transition={{ duration: 2.2, repeat: Infinity }}>
            <svg viewBox="0 0 32  28" width={18} height={(18 * 28) / 32}><path d="M16 26 C-10 10 8 -2 16 8 C24 -2 42 10 16 26 Z" fill="#ff5a8a" stroke="#ff2d6b" strokeWidth="1" /></svg>
          </motion.div>
        )
      })}

      {/* ARBRES (devant) */}
      <div className="absolute left-0 right-0" style={{ top: '52vh', height: '22.5vh', width: '100vw', zIndex: 12, pointerEvents: 'none' }}>
        {treeLayers.map((t, i) => (
          <div key={`tree-${i}`} style={{ position: 'absolute', left: `${t.x}vw`, bottom: `${t.yBottomVh}vh` }}>
            <img src={TREE_SVGS[(i + 1) % TREE_SVGS.length]} alt="tree" style={{ width: t.size, height: 'auto', filter: 'drop-shadow(0 3px 6px #0002)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}

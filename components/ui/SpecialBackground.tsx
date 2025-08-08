'use client'

import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  MotionValue,
} from 'framer-motion'
import React, { useEffect, useState, useMemo, useRef } from 'react'

/* -------------------------------------------------------------------------- */
/* 1.  ICONES SVG - améliorés et ajoutés                                      */
/* -------------------------------------------------------------------------- */

/* Soleil + halo */
function SunIcon({ size = 90 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <radialGradient id="sunHalo" r="0.6">
          <stop offset="0%" stopColor="#fff799" />
          <stop offset="100%" stopColor="#ffd23f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="24" fill="url(#sunHalo)" />
      <circle cx="32" cy="32" r="16" fill="#ffd23f" />
    </svg>
  )
}

/* Lune avec halo et cratères visibles */
function MoonIcon({ size = 70 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <radialGradient id="moonHalo" r="0.8">
          <stop offset="0%" stopColor="#fff9e5" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#fff9e5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moonGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff9e5" />
          <stop offset="100%" stopColor="#d5d8e0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="24" fill="url(#moonHalo)" />
      <circle cx="32" cy="32" r="18" fill="url(#moonGrad)" />
      {/* petits cratères */}
      <circle cx="22" cy="26" r="3" fill="#c7cbd3" />
      <circle cx="36" cy="18" r="2" fill="#c7cbd3" />
      <circle cx="40" cy="34" r="2.5" fill="#bfc3cc" />
    </svg>
  )
}

/* Petite ferme avec girouette animée */
function Farm({ rotation }: { rotation: MotionValue<string> }) {
  return (
    <div style={{ position: 'absolute', top: '58vh', left: '6vw', zIndex: 9 }}>
      {/* Bâtiment de ferme */}
      <svg viewBox="0 0 80 60" width={80} height={60}>
        <rect x="5" y="25" width="70" height="30" fill="#b5651d" />
        <polygon points="5,25 40,5 75,25" fill="#d67f2e" />
        {/* porte */}
        <rect x="30" y="38" width="20" height="17" fill="#8b4513" />
      </svg>
      {/* Girouette sur le toit, liée à l'angle du vent */}
      <motion.div
        style={{
          position: 'absolute',
          left: '40px',
          top: '-10px',
          originX: 0.5,
          originY: 1,
          rotate: rotation,
        }}
      >
        <svg viewBox="0 0 20 20" width={20} height={20}>
          <path
            d="M10 0 L13 5 H11 V18 H9 V5 H7 L10 0 Z"
            fill="#555"
          />
          <path d="M10 8 H2 L10 12" fill="#777" />
          <path d="M10 8 H18 L10 4" fill="#999" />
        </svg>
      </motion.div>
    </div>
  )
}

/* Nuages : 10 formes VRAIMENT différentes */
const cloudShapes = [
  // arrondi classique
  'M12 22a10 10 0 0 1 0-6A8 8 0 0 1 21 11a9 9 0 0 1 17-2 7 7 0 0 1 9 7 6 6 0 0 1-1 12H13Z',
  // forme compacte
  'M7 24a9 9 0 0 1 0-5A7 7 0 0 1 15 12a8 8 0 0 1 15-2 6 6 0 0 1 8 6 5 5 0 0 1-1 10H8Z',
  // long en "moustache"
  'M5 24 Q12 19 25 21 Q29 15 39 18 Q48 15 59 23 Q65 27 60 28 Q50 27 10 26 Z',
  // nuage plat étalé
  'M3 21 Q10 17 19 18 Q21 10 35 15 Q44 10 53 19 Q62 20 62 23 Q60 27 55 26 H8Z',
  // décalé en escalier
  'M8 25 Q12 14 20 17 Q24 10 32 12 Q36 5 44 10 Q52 8 58 16 Q64 18 62 26 H9Z',
  // très compact rond
  'M14 28 Q19 18 25 24 Q30 14 38 20 Q45 10 56 18 Q62 24 56 28 H16Z',
  // deux bosses
  'M11 23 Q17 16 25 21 Q29 12 35 17 Q41 10 54 22 Q63 22 63 25 H13Z',
  // bossu sur la droite
  'M5 27 Q14 15 27 17 Q33 13 39 19 Q54 10 62 29 H7Z',
  // petit & haut
  'M18 24 Q24 10 36 20 Q47 10 54 28 Q54 31 48 28 H22Z',
  // en U
  'M7 26 Q18 15 32 29 Q46 12 59 27 H9Z'
]

function CloudIcon({ size = 110, v = 0 }: { size?: number; v?: number }) {
  // v = seed random, pour varier la forme aléatoirement à chaque nuage
  const shapeIdx = v % cloudShapes.length
  return (
    <svg
      viewBox="0 0 64 32"
      width={size}
      height={(size * 32) / 64}
      fill="#fff"
      style={{ filter: 'drop-shadow(0 3px 8px #0002)' }}
    >
      <path d={cloudShapes[shapeIdx]} />
    </svg>
  )
}

/* Deux variantes d’arbres */
function TreeIcon({ size = 90, v = 0 }: { size?: number; v?: number }) {
  return v % 2 ? (
    <svg viewBox="0 0 64 96" width={size} height={(size * 96) / 64}>
      <rect x="28" y="60" width="8" height="36" fill="#6b4226" />
      <ellipse cx="32" cy="48" rx="26" ry="22" fill="#4caf50" />
      <ellipse cx="32" cy="28" rx="20" ry="18" fill="#43a047" />
    </svg>
  ) : (
    <svg viewBox="0 0 64 96" width={size} height={(size * 96) / 64}>
      <rect x="30" y="60" width="6" height="36" fill="#6b4226" />
      <polygon points="32,10 52,52 12,52" fill="#4caf50" />
      <polygon points="32,26 46,58 18,58" fill="#43a047" />
    </svg>
  )
}

/* Fleur (plusieurs couleurs pour variety) */
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

/* Feuille flottante */
const LeafIcon = ({ size = 24 }: { size?: number }) => (
  <svg viewBox="0 0 32 16" width={size} height={size / 2}>
    <path d="M2 8 Q16 -2 30 8 Q16 18 2 8Z" fill="#6fbf73" />
    <path d="M2 8 Q16 8 30 8" stroke="#4b9956" strokeWidth="1" fill="none" />
  </svg>
)

/* Animaux de la plaine */
const HedgehogIcon = ({ size = 34 }: { size?: number }) => (
  <svg viewBox="0 0 40 24" width={size} height={(size * 24) / 40}>
    <ellipse cx="20" cy="14" rx="18" ry="10" fill="#775447" />
    <path d="M4 14 Q20 2 36 14" fill="#8d6656" />
    <circle cx="30" cy="14" r="2" fill="#000" />
  </svg>
)

const RabbitIcon = ({ size = 50 }: { size?: number }) => (
  <svg viewBox="0 0 60 40" width={size} height={(size * 40) / 60}>
    <ellipse cx="30" cy="26" rx="20" ry="12" fill="#d9d9d9" />
    <circle cx="38" cy="16" r="8" fill="#d9d9d9" />
    <ellipse cx="42" cy="6" rx="4" ry="10" fill="#e6e6e6" />
    <ellipse cx="34" cy="6" rx="4" ry="10" fill="#e6e6e6" />
    <circle cx="40" cy="16" r="2" fill="#000" />
    <circle cx="38" cy="18" r="1" fill="#fff" />
  </svg>
)

/* Etoile simple avec couleur légère */
const Star = ({ size = 2, color = '#fff' }: { size?: number; color?: string }) => (
  <svg viewBox="0 0 4 4" width={size} height={size}>
    <circle cx="2" cy="2" r="2" fill={color} />
  </svg>
)

/* Coquillage & Crabe (inchangés) */
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

/* Ville améliorée avec lumières intelligentes (patron stable) */
function City({ dayProgress = 0 }: { dayProgress: number }) {
  const buildings = useMemo(
    () => [
      { x: 10, w: 50, h: 140, color: '#46586a' },
      { x: 90, w: 50, h: 170, color: '#54738c' },
      { x: 170, w: 40, h: 130, color: '#455d71' },
      { x: 230, w: 60, h: 150, color: '#687da1' },
    ],
    [],
  )
  const patterns = useMemo(() => {
    return buildings.map((b) => {
      const rows = Math.floor(b.h / 20)
      const cols = Math.floor(b.w / 14)
      const night = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => Math.random() < 0.7),
      )
      const midnight = night.map((row) => row.map(() => Math.random() < 0.07))
      const rounded = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => Math.random() < 0.25),
      )
      return { rows, cols, night, midnight, rounded }
    })
  }, [buildings])

  function isLit(bIndex: number, r: number, c: number) {
    if (dayProgress < 0.5 || dayProgress > 0.9) return false
    if (dayProgress > 0.75 && dayProgress <= 0.9)
      return patterns[bIndex].midnight[r][c]
    return patterns[bIndex].night[r][c]
  }

  return (
    <svg viewBox="0 0 350 200" style={{ width: '36vw', height: '22vh', minWidth: 320 }}>
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={200 - b.h} width={b.w} height={b.h} fill={b.color} />
          <polygon
            points={`${b.x},${200 - b.h} ${b.x + b.w / 2},${200 - b.h - 12 - i * 2} ${b.x + b.w},${200 - b.h}`}
            fill="#b1b2b6"
          />
          {Array.from({ length: patterns[i].rows }).map((_, r) =>
            Array.from({ length: patterns[i].cols }).map((__, c) => {
              const lit = isLit(i, r, c)
              return (
                <rect
                  key={`${r}-${c}`}
                  x={b.x + 4 + c * 14}
                  y={200 - b.h + 4 + r * 20}
                  width="8"
                  height="12"
                  rx={patterns[i].rounded[r][c] ? 6 : 1}
                  fill={lit ? '#ffd23f' : '#1a1a19'}
                  opacity={lit ? 1 : 0.15}
                  style={{ transition: 'opacity 2s' }}
                />
              )
            }),
          )}
        </g>
      ))}
      <rect x="0" y="150" width="70" height="50" fill="#3e4d5a" />
      <rect x="60" y="162" width="60" height="38" fill="#36444f" />
      <rect x="145" y="155" width="46" height="44" fill="#42546a" />
      <g>
        <rect x="310" y="174" width="4" height="26" fill="#d7d9da" />
        <circle
          cx="312"
          cy="174"
          r="6"
          fill="#ffd23f"
          opacity={dayProgress > 0.5 && dayProgress < 0.9 ? 1 : 0.2}
          style={{ transition: 'opacity 2s' }}
        />
        <rect x="280" y="190" width="3" height="10" fill="#d7d9da" />
        <circle
          cx="281.5"
          cy="190"
          r="3"
          fill="#ffd23f"
          opacity={dayProgress > 0.5 && dayProgress < 0.9 ? 1 : 0.15}
          style={{ transition: 'opacity 2s' }}
        />
      </g>
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* 2.  Composant principal                                                    */
/* -------------------------------------------------------------------------- */

export default function SpecialBackground() {
  const [clouds, setClouds] = useState<{
    id: number
    size: number
    top: number
    dur: number
    delay: number
    shapeIdx: number
  }[]>([])
  const [flowers, setFlowers] = useState<React.ReactElement[]>([])
  const [shells, setShells] = useState<React.ReactElement[]>([])
  const [animals, setAnimals] = useState<{
    id: number
    type: 'hedgehog' | 'rabbit'
    start: string
    end: string
    top: number
    size: number
    dur: number
  }[]>([])
  const [leaves, setLeaves] = useState<{
    id: number
    top: number
    size: number
    dur: number
  }[]>([])

  // Arbres positionnés aléatoirement mais stables
  const bgTrees = useMemo(
    () =>
      Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 50 + Math.random() * 20,
        v: i,
      })),
    [],
  )
  const fgTrees = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 90 + Math.random() * 20,
        v: i,
      })),
    [],
  )

  /* Cycle jour/nuit - 0 = matin, 0.5 = minuit, 1 = matin */
  const cycle = 120
  const [dayProgress, setDayProgress] = useState(0)
  useEffect(() => {
    let frame: number
    const start = Date.now()
    function loop() {
      const now = Date.now()
      const t = ((now - start) / (cycle * 1000)) % 1
      setDayProgress(t)
      frame = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(frame)
  }, [])
  const dayRef = useRef(0)
  useEffect(() => {
    dayRef.current = dayProgress
  }, [dayProgress])

  // Etoiles pré-générées
  const stars = useMemo(
    () =>
      Array.from({ length: 80 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 30,
        size: 1 + Math.random() * 1.5,
        color: Math.random() < 0.2 ? '#ffe9b5' : '#fff', // léger ton chaud
      })),
    [],
  )

  // Crabe unique qui se balade sur la plage
  const crab = (
    <motion.div
      animate={{ x: ['-10vw', '110vw', '-10vw'] }}
      transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      style={{ position: 'absolute', top: '78vh', zIndex: 6, pointerEvents: 'none' }}
    >
      <CrabIcon size={24} />
    </motion.div>
  )

  // Animation vent
  const windAngle = useMotionValue(0)
    useEffect(() => {
      const controls = animate(
        windAngle,
        [0, 180, 0],
        { duration: 600, repeat: Infinity, ease: 'easeInOut' },
      )
      return controls.stop
    }, [windAngle])

    // Nuages, fleurs, coquillages
    useEffect(() => {
      // Nuages : seed et forme VRAIMENT différente pour chaque nuage
      const cl: {
        id: number
        size: number
        top: number
        dur: number
        delay: number
        shapeIdx: number
      }[] = []
      for (let i = 0; i < 12; i++) {
        const size = 80 + Math.random() * 110
        const top = Math.random() * 16
        const dur = 50 + Math.random() * 35
        const delay = -Math.random() * dur
        const shapeIdx = Math.floor(Math.random() * cloudShapes.length)
        cl.push({ id: i, size, top, dur, delay, shapeIdx })
      }

      // Fleurs sur la plaine : dispersées
      const flowerColors = ['#f8c8ec', '#ffdb99', '#c7e2ad', '#eae5ff', '#f0c3c3']
      const fl: React.ReactElement[] = []
      for (let i = 0; i < 36; i++) {
        const size = 10 + Math.random() * 8
        const left = 6 + Math.random() * 88
        const top = 57 + Math.random() * 14 // Sur la plaine uniquement (vh)
        const color = flowerColors[Math.floor(Math.random() * flowerColors.length)]
        fl.push(
          <div
            key={'fl' + i}
            style={{
              position: 'absolute',
              left: `${left}vw`,
              top: `${top}vh`,
              pointerEvents: 'none',
              zIndex: 6,
            }}
          >
            <FlowerIcon size={size} color={color} />
          </div>,
        )
      }

      // Coquillages espacés sur la plage
      const sh: React.ReactElement[] = []
      for (let i = 0; i < 6; i++) {
        const size = 8 + Math.random() * 5
        const left = 5 + Math.random() * 90
        const top = 76 + Math.random() * 4
        sh.push(
          <div
            key={'s' + i}
            style={{ position: 'absolute', left: `${left}vw`, top: `${top}vh`, pointerEvents: 'none', zIndex: 5 }}
          >
            <ShellIcon size={size} />
          </div>,
        )
      }

      setClouds(cl)
      setFlowers(fl)
      setShells(sh)
    }, [])

    // Feuilles dérivant sur la rivière
    useEffect(() => {
      function spawnLeaf() {
        setLeaves((arr) => {
          if (arr.length >= 2) return arr
          const id = Date.now()
          const top = 84 + Math.random() * 7
          const size = 18 + Math.random() * 6
          const dur = 35 + Math.random() * 10
          setTimeout(
            () => setLeaves((a) => a.filter((l) => l.id !== id)),
            dur * 1000,
          )
          return [...arr, { id, top, size, dur }]
        })
      }
      const interval = setInterval(() => {
        if (Math.random() < 0.5) spawnLeaf()
      }, 8000)
      return () => clearInterval(interval)
    }, [])

    // Apparition d'animaux sur la plaine
    useEffect(() => {
      function spawnAnimal() {
        if (dayRef.current >= 0.5) return
        setAnimals((arr) => {
          const type: 'hedgehog' | 'rabbit' = Math.random() < 0.5 ? 'hedgehog' : 'rabbit'
          if (arr.find((a) => a.type === type)) return arr
          const id = Date.now()
          const fromLeft = Math.random() < 0.5
          const start = fromLeft ? '-10vw' : '110vw'
          const end = fromLeft ? '110vw' : '-10vw'
          const top = 64 + Math.random() * 6
          const size = type === 'hedgehog' ? 34 : 50
          const dur = 25 + Math.random() * 10
          setTimeout(
            () => setAnimals((a) => a.filter((an) => an.id !== id)),
            dur * 1000,
          )
          return [...arr, { id, type, start, end, top, size, dur }]
        })
      }
      const interval = setInterval(() => {
        if (Math.random() < 0.25) spawnAnimal()
      }, 12000)
      return () => clearInterval(interval)
    }, [])

    useEffect(() => {
      if (dayProgress >= 0.5) setAnimals([])
    }, [dayProgress])

  // Ciel dynamique (dégradé)
  const sky = [
    '#75c9ff', // matin
    '#ffa95d', // crépuscule
    '#0d1b2a', // nuit
    '#ffa95d', // crépuscule
    '#75c9ff', // matin
  ]

  // Montagnes avec dégradé neige > rocher
  function MountainBackground() {
    return (
      <svg
        viewBox="0 0 1000 200"
        className="absolute inset-x-0"
        style={{ top: '30vh', height: '22vh', width: '100vw', minWidth: 1200 }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="neige" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="12%" stopColor="#fff" />
            <stop offset="20%" stopColor="#e0e2e4" />
            <stop offset="45%" stopColor="#8b9aa7" />
            <stop offset="100%" stopColor="#4e6574" />
          </linearGradient>
        </defs>
        {/* Montagnes, pas de zigzag blanc */}
        <path
          d="M0 150 L120 80 L240 140 L380 60 L520 120 L650 90 L780 140 L1000 60 V200 H0 Z"
          fill="url(#neige)"
        />
        {/* détails de roches et mini arbres */}
        <g fill="#3f4d57" opacity="0.4">
          <path d="M150 130 l20 -12 12 22z" />
          <path d="M420 110 l18 -10 8 18z" />
          <path d="M760 125 l22 -14 10 20z" />
        </g>
        <g fill="#2f3a42" opacity="0.6">
          <polygon points="260,150 266,136 272,150" />
          <polygon points="600,145 606,131 612,145" />
          <polygon points="880,148 886,134 892,148" />
        </g>
      </svg>
    )
  }

  // Rotation de la girouette
  const arrowRotation = useTransform(windAngle, (a) => `${a}deg`)

  // Gestion dégradé ciel
  const skyStops = sky
  function lerp(a: string, b: string, t: number) {
    // interpolation hex couleur rapide
    function hex2rgb(hex: string) {
      const n = hex.startsWith('#') ? 1 : 0
      return [
        parseInt(hex.substr(n, 2), 16),
        parseInt(hex.substr(n + 2, 2), 16),
        parseInt(hex.substr(n + 4, 2), 16),
      ]
    }
    function rgb2hex([r, g, b]: number[]) {
      return (
        '#' +
        [r, g, b]
          .map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
          .join('')
      )
    }
    const ra = hex2rgb(a)
    const rb = hex2rgb(b)
    return rgb2hex([0, 1, 2].map((i) => ra[i] + (rb[i] - ra[i]) * t))
  }
  // gestion dégradé progressif sur 0-0.25, 0.25-0.5, etc.
  let skyColor = skyStops[0]
  for (let i = 1; i < skyStops.length; i++) {
    const p = (i - 1) / (skyStops.length - 1)
    const nextP = i / (skyStops.length - 1)
    if (dayProgress >= p && dayProgress < nextP) {
      const local = (dayProgress - p) / (nextP - p)
      skyColor = lerp(skyStops[i - 1], skyStops[i], local)
      break
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      {/* Ciel dégradé */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(to bottom,${skyColor},${lerp(
            skyColor,
            '#000000',
            0.3,
          )})`,
        }}
      />

      {/* Plan d'étoiles dérivant légèrement avec la lune */}
      <motion.div
        className="absolute inset-0"
        animate={{ x: `${(dayProgress - 0.5) * 20}vw` }}
        transition={{ duration: 1, ease: 'linear' }}
      >
        {stars.map((s) => (
          <div
            key={s.id}
            style={{
              position: 'absolute',
              left: `${s.left}vw`,
              top: `${s.top}vh`,
              opacity: dayProgress >= 0.5 ? 1 : 0,
              transition: 'opacity 2s',
            }}
          >
            <Star size={s.size} color={s.color} />
          </div>
        ))}
      </motion.div>

      {/* Soleil & Lune */}
      {[
        { icon: <SunIcon />, op: [1, 1, 0, 0, 1], key: 'sun' },
        { icon: <MoonIcon />, op: [0, 0, 1, 1, 0], key: 'moon' },
      ].map(({ icon, op, key }) => (
        <motion.div
          key={key}
          animate={{
            x: ['-10vw', '10vw', '50vw', '90vw', '110vw'],
            y: ['70vh', '60vh', '10vh', '60vh', '80vh'],
            opacity: op,
          }}
          transition={{ duration: cycle, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', pointerEvents: 'none' }}
        >
          {icon}
        </motion.div>
      ))}

      {/* Nuages */}
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          initial={{ x: '110vw' }}
          animate={{ x: '-120vw' }}
          transition={{ duration: c.dur, repeat: Infinity, delay: c.delay, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: `${c.top}vh`,
            pointerEvents: 'none',
            opacity: dayProgress > 0.5 ? 0.6 : 1,
            filter: dayProgress > 0.5 ? 'brightness(0.7)' : 'none',
          }}
        >
          <CloudIcon size={c.size} v={c.shapeIdx} />
        </motion.div>
      ))}

      {/* Montagnes */}
      <MountainBackground />

      {/* Ville à droite, collée au bord */}
      <div className="absolute" style={{ top: '30vh', right: 0 }}>
        <City dayProgress={dayProgress} />
      </div>

      {/* Petite ferme avec girouette animée */}
      <Farm rotation={arrowRotation} />

      {/* Plaine/Arbres — fond vert jusqu'à la plage */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: '52vh',
          height: '21vh',
          width: '100vw',
          background: 'linear-gradient(to top,#379F3D 70%,#4caf50 100%)',
          zIndex: 2,
        }}
      >
        {bgTrees.map((t) => (
          <div
            key={'bg' + t.id}
            style={{
              position: 'absolute',
              left: `${t.left}vw`,
              bottom: 0,
              opacity: 0.6,
              filter: 'saturate(0.6)',
              zIndex: 3,
            }}
          >
            <TreeIcon size={t.size} v={t.v} />
          </div>
        ))}
        {fgTrees.map((t) => (
          <div
            key={'fg' + t.id}
            style={{ position: 'absolute', left: `${t.left}vw`, bottom: 0, zIndex: 10 }}
          >
            <TreeIcon size={t.size} v={t.v} />
          </div>
        ))}
      </div>

      {/* Fleurs sur la plaine */}
      {flowers}

      {/* Animaux traversant la plaine */}
      {animals.map((a) => (
        <motion.div
          key={a.id}
          initial={{ x: a.start }}
          animate={{ x: a.end }}
          transition={{ duration: a.dur, ease: 'linear' }}
          style={{ position: 'absolute', top: `${a.top}vh`, zIndex: 8, pointerEvents: 'none' }}
          onAnimationComplete={() =>
            setAnimals((arr) => arr.filter((an) => an.id !== a.id))
          }
        >
          {a.type === 'hedgehog' ? (
            <HedgehogIcon size={a.size} />
          ) : (
            <RabbitIcon size={a.size} />
          )}
        </motion.div>
      ))}

      {/* Plage — un peu agrandie */}
      <svg
        viewBox="0 0 1000 100"
        className="absolute left-0 right-0"
        style={{
          top: '73vh',
          height: '11vh',
          width: '100vw',
          minWidth: 1200,
          zIndex: 3,
        }}
        preserveAspectRatio="none"
      >
        {/* Plage droite collée à la plaine */}
        <rect x="0" y="0" width="1000" height="100" fill="#f9d9a6" />
      </svg>

      {/* Coquillages + crabe */}
      {shells}
      {crab}

      {/* Rivière - va jusqu'en bas */}
      <motion.div
        className="absolute left-0 right-0"
        style={{
          bottom: 0,
          top: '84vh',
          height: '16vh',
          width: '100vw',
          minWidth: 1200,
          background: 'linear-gradient(to top,#3296e0 70%,#3fa9f5 100%)',
          zIndex: 4,
        }}
      />
      {/* Feuilles flottantes */}
      {leaves.map((l) => (
        <motion.div
          key={l.id}
          initial={{ x: '-10vw' }}
          animate={{ x: '110vw' }}
          transition={{ duration: l.dur, ease: 'linear' }}
          style={{ position: 'absolute', top: `${l.top}vh`, zIndex: 10, pointerEvents: 'none' }}
        >
          <LeafIcon size={l.size} />
        </motion.div>
      ))}
    </div>
  )
}

  /*
  ────────────────────────────────────────────
  Décor dynamique :
  - Ciel dégradé animé selon l'heure et étoiles la nuit profonde.
  - Soleil et lune suivent un arc naturel.
  - Nuages variés (12 formes) traversant le ciel.
  - Montagnes avec dégradé neige > roche.
  - Plaine herbeuse sans bande parasite, arbres répartis naturellement.
  - Fleurs dispersées et animaux occasionnels (lapin/hérisson).
  - Plage droite avec coquillages espacés et un crabe animé.
  - Rivière réaliste avec quelques feuilles dérivantes.
  - Ville : fenêtres et lampadaires synchronisés au cycle jour/nuit.
  ─────────────────────────────────────────────
  */

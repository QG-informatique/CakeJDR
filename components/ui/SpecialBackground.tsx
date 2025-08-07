'use client'

import {
  motion,
  animate,
  useMotionValue,
  useTransform,
} from 'framer-motion'
import React, { useEffect, useState } from 'react'

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

/* Lune */
function MoonIcon({ size = 70 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <path d="M42 8A24 24 0 1 0 42 56 18 18 0 1 1 42 8Z" fill="#f0f4ff" />
    </svg>
  )
}

/* Flèche de vent */
function WindArrow({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size}>
      <path
        d="M2 16 H26 M18 8 L26 16 L18 24"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
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

/* Nénuphar */
const LilyPadIcon = ({ size = 44 }: { size?: number }) => (
  <svg viewBox="0 0 32 22" width={size} height={size / 2}>
    <ellipse cx="16" cy="11" rx="15" ry="9" fill="#78c674" />
    <path d="M16,11 L16,2" stroke="#4b9956" strokeWidth="2" />
    {/* Fleur sur le nénuphar */}
    <circle cx="16" cy="7" r="3" fill="#ffeaea" />
    <circle cx="16" cy="7" r="1" fill="#ffd000" />
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

/* Ville améliorée avec lumières intelligentes */
function City({ dayProgress = 0 }: { dayProgress: number }) {
  // dayProgress : 0 (matin) à 0.5 (minuit) à 1 (matin)
  // => 0/1 = jour ; 0.20 à 0.33 = nuit ; 0.28 à 0.35 = minuit
  // Plus on est proche de la nuit profonde, moins de fenêtres allumées
function shouldLightOn() {
  if (dayProgress < 0.18 || dayProgress > 0.85) return false // Plein jour
  if (dayProgress > 0.27 && dayProgress < 0.33) {
    // pleine nuit : très peu allumé
    return Math.random() < 0.07
  }
  // Nuit : 70% fenêtres allumées
  return Math.random() < 0.7
}
  return (
    <svg viewBox="0 0 350 200" style={{ width: '36vw', height: '22vh', minWidth: 320 }}>
      {/* Grands immeubles */}
      {[{ x: 10, w: 50, h: 140 }, { x: 90, w: 50, h: 170 }, { x: 170, w: 40, h: 130 }, { x: 230, w: 60, h: 150 }].map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={200 - b.h} width={b.w} height={b.h} fill={['#46586a', '#54738c', '#455d71', '#687da1'][i]} />
          {/* Toits */}
          <polygon points={`${b.x},${200 - b.h} ${b.x + b.w / 2},${200 - b.h - 12 - i * 2} ${b.x + b.w},${200 - b.h}`} fill="#b1b2b6" />
          {/* Fenêtres : gérées selon l'heure */}
          {Array.from({ length: Math.floor(b.h / 20) }).map((_, r) =>
            Array.from({ length: Math.floor(b.w / 14) }).map((__, c) => {
              const lit = shouldLightOn()
              return (
                <rect
                  key={`${r}-${c}`}
                  x={b.x + 4 + c * 14}
                  y={200 - b.h + 4 + r * 20}
                  width="8"
                  height="12"
                  rx={Math.random() < 0.25 ? 6 : 1}
                  fill={lit ? "#ffd23f" : "#1a1a19"}
                  opacity={lit ? 1 : 0.15}
                />
              )
            }),
          )}
        </g>
      ))}
      {/* Petits bâtiments devant */}
      <rect x="0" y="150" width="70" height="50" fill="#3e4d5a" />
      <rect x="60" y="162" width="60" height="38" fill="#36444f" />
      <rect x="145" y="155" width="46" height="44" fill="#42546a" />
      {/* Lampadaires */}
      <g>
        <rect x="310" y="174" width="4" height="26" fill="#d7d9da" />
        <circle cx="312" cy="174" r="6" fill="#ffd23f" opacity={dayProgress > 0.22 && dayProgress < 0.38 ? 1 : 0.2} />
        <rect x="280" y="190" width="3" height="10" fill="#d7d9da" />
        <circle cx="281.5" cy="190" r="3" fill="#ffd23f" opacity={dayProgress > 0.22 && dayProgress < 0.38 ? 1 : 0.15} />
      </g>
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* 2.  Composant principal                                                    */
/* -------------------------------------------------------------------------- */

export default function SpecialBackground() {
  const [clouds, setClouds] = useState<React.ReactElement[]>([])
  const [flowers, setFlowers] = useState<React.ReactElement[]>([])
  const [shells, setShells] = useState<React.ReactElement[]>([])
  const [crabs, setCrabs] = useState<React.ReactElement[]>([])
  const [lilyPads, setLilyPads] = useState<React.ReactElement[]>([])

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

  // Nuages, fleurs, nénuphars, etc.
  useEffect(() => {
    // Nuages : seed et forme VRAIMENT différente pour chaque nuage
    const cl: React.ReactElement[] = []
    for (let i = 0; i < 12; i++) {
      const size = 80 + Math.random() * 110
      const top = Math.random() * 16
      const dur = 50 + Math.random() * 35
      const delay = -Math.random() * dur
      const shapeIdx = Math.floor(Math.random() * cloudShapes.length)
      cl.push(
        <motion.div
          key={'c' + i + '-' + shapeIdx}
          initial={{ x: '110vw' }}
          animate={{ x: '-120vw' }}
          transition={{ duration: dur, repeat: Infinity, delay, ease: 'linear' }}
          style={{ position: 'absolute', top: `${top}vh`, pointerEvents: 'none' }}
        >
          <CloudIcon size={size} v={shapeIdx} />
        </motion.div>,
      )
    }

    // Fleurs sur la plaine : dispersées
    const flowerColors = ['#f8c8ec', '#ffdb99', '#c7e2ad', '#eae5ff', '#f0c3c3']
    const fl: React.ReactElement[] = []
    for (let i = 0; i < 36; i++) {
      const size = 10 + Math.random() * 8
      const left = 6 + Math.random() * 88
      const top = 71 + Math.random() * 16 // Sur la plaine (vh)
      const color = flowerColors[Math.floor(Math.random() * flowerColors.length)]
      fl.push(
        <div
          key={'fl' + i}
          style={{
            position: 'absolute',
            left: `${left}vw`,
            top: `${top}vh`,
            pointerEvents: 'none',
            zIndex: 7,
          }}
        >
          <FlowerIcon size={size} color={color} />
        </div>,
      )
    }

    // Nénuphars animés sur la rivière
    const nenu: React.ReactElement[] = []
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      const size = 36 + Math.random() * 24
      const dur = 42 + Math.random() * 12
      const delay = -Math.random() * dur
      const top = 84 + Math.random() * 7 // sur la rivière
      nenu.push(
        <motion.div
          key={'lilypad' + i}
          initial={{ x: '110vw' }}
          animate={{ x: '-120vw' }}
          transition={{ duration: dur, repeat: Infinity, delay, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: 0,
            top: `${top}vh`,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <LilyPadIcon size={size} />
        </motion.div>,
      )
    }

    // Coquillages
    const sh: React.ReactElement[] = []
    for (let i = 0; i < 16; i++) {
      const size = 8 + Math.random() * 5
      const left = Math.random() * 100
      sh.push(
        <div
          key={'s' + i}
          style={{ position: 'absolute', left: `${left}vw`, bottom: '13vh', pointerEvents: 'none' }}
        >
          <ShellIcon size={size} />
        </div>,
      )
    }
    // Crabes
    const cr: React.ReactElement[] = []
    for (let i = 0; i < 5; i++) {
      const size = 18 + Math.random() * 6
      const left = Math.random() * 100
      const dur = 10 + Math.random() * 6
      cr.push(
        <motion.div
          key={'cr' + i}
          initial={{ y: 0 }}
          animate={{ y: [0, 4, -2, 0] }}
          transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', left: `${left}vw`, bottom: '13vh', pointerEvents: 'none' }}
        >
          <CrabIcon size={size} />
        </motion.div>,
      )
    }

    setClouds(cl)
    setFlowers(fl)
    setLilyPads(nenu)
    setShells(sh)
    setCrabs(cr)
  }, [])

  /* Cycle jour/nuit - 0 = matin, 0.5 = minuit, 1 = matin */
  const cycle = 200
  const [dayProgress, setDayProgress] = useState(0)
  useEffect(() => {
    let frame: number
    const start = Date.now()
    function loop() {
      const now = Date.now()
      const t = ((now - start) / (cycle * 1000)) % 1 // boucle 0-1
      setDayProgress(t)
      frame = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(frame)
  }, [])

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
            <stop offset="65%" stopColor="#eee" />
            <stop offset="85%" stopColor="#bebfc1" />
            <stop offset="100%" stopColor="#4e6574" />
          </linearGradient>
        </defs>
        {/* Montagnes, pas de zigzag blanc */}
        <path
          d="M0 150 L120 80 L240 140 L380 60 L520 120 L650 90 L780 140 L1000 60 V200 H0 Z"
          fill="url(#neige)"
        />
      </svg>
    )
  }

  // Rotation flèche vent
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
        style={{ background: `linear-gradient(to bottom,${skyColor} 60%,#75c9ff 100%)` }}
      />

      {/* Soleil & Lune */}
      {[
        { icon: <SunIcon />, op: [1, 1, 0, 0, 1], key: 'sun' },
        { icon: <MoonIcon />, op: [0, 0, 1, 1, 0], key: 'moon' },
      ].map(({ icon, op, key }) => (
        <motion.div
          key={key}
          animate={{
            x: ['-10vw', '110vw'],
            y: ['50vh', '-10vh', '50vh', '110vh'],
            opacity: op,
          }}
          transition={{ duration: cycle, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', pointerEvents: 'none' }}
        >
          {icon}
        </motion.div>
      ))}

      {/* Flèche de vent */}
      <motion.div
        style={{
          position: 'absolute',
          top: '4vh',
          left: '4vw',
          originX: 0.5,
          originY: 0.5,
          rotate: arrowRotation,
        }}
      >
        <WindArrow />
      </motion.div>

      {/* Nuages */}
      {clouds}

      {/* Montagnes */}
      <MountainBackground />

      {/* Ville à droite, collée au bord */}
      <div className="absolute" style={{ top: '30vh', right: 0 }}>
        <City dayProgress={dayProgress} />
      </div>

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
        <div className="flex justify-evenly items-end h-full">
          {Array.from({ length: 11 }).map((_, i) => (
            <TreeIcon key={i} size={90 + (i % 3) * 10} v={i} />
          ))}
        </div>
      </div>

      {/* Fleurs sur la plaine */}
      {flowers}

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
        <path
          d="M0 45 Q100 25 200 48 T400 40 T600 50 T800 45 T1000 38 V100 H0 Z"
          fill="#f9d9a6"
        />
      </svg>

      {/* Coquillages + crabes */}
      {shells}
      {crabs}

      {/* Rivière - va jusqu'en bas, nénuphars dessus */}
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
      {/* Nénuphars animés */}
      {lilyPads}
    </div>
  )
}

/* 
────────────────────────────────────────────
Modifications effectuées :
- Les poissons sont supprimés. 
- La rivière va jusqu'en bas de l'écran, elle est élargie.
- La plage est agrandie, bien collée à la rivière.
- Le front vert (plaine) va jusqu'à la plage, sans fond blanc.
- Ajout de fleurs variées sur la plaine.
- Nénuphars animés sur la rivière à la place des poissons.
- Montagnes avec dégradé neige > roche (plus de zigzag blanc).
- Nuages : 10 formes SVG vraiment différentes, choix aléatoire par nuage.
- Ville : lumières des fenêtres gérées selon l'heure (jour, nuit, minuit).
- Animation fluide et code optimisé, bien commenté.
────────────────────────────────────────────
*/

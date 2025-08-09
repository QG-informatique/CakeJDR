'use client'
// MOD: 1 2025-08-09 - remove any casts from mixBlendMode to satisfy eslint

/**
 * Background 9 – “Nebula + Stardust Trails” (v7-combined)
 * =======================================================
 * ✅ Combine le fond “Aurora Nebula” (dégradés + étoiles scintillantes)
 *    AVEC ton animation “Stardust Trails” par-dessus.
 * ✅ Plus de `-z-10` : le composant reste visible. Garde ton contenu au-dessus
 *    avec un z-index > 0 côté layout si nécessaire.
 * ✅ `isolate z-0` : le stacking context est confiné, pas de voile global.
 * ✅ `pointer-events-none` partout : n’interfère pas avec l’UI.
 *
 * ---------------------------
 * MODIFS par rapport à ton v6-spread3
 * ---------------------------
 * [1] Ajout du socle Nebula : base sombre + texture discrète + étoiles twinkle.
 * [2] Conservation et superposition des “Stardust Trails” (diagonale ↙︎).
 * [3] Suppression du `-z-10` qui pouvait masquer l’anim suivant le parent.
 * [4] Paramètres regroupés dans CONFIG pour tout régler vite.
 */

import { motion } from 'framer-motion'
import React, { useMemo } from 'react'

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ------------------------------------------------------------
// CONFIG global (facile à régler)
// ------------------------------------------------------------
const CONFIG = {
  // Étoiles fines (twinkle – nebula)
  stars: {
    count: 110,
    seed: 1337,
    minSize: 1,
    maxSize: 2.4,
    minOpacity: 0.25,
    maxOpacity: 0.9,
  },
  // Aurores (3 blobs – nebula)
  auroras: [
    {
      from: 'rgba(88, 101, 242, 0.35)', // indigo
      via: 'rgba(56, 189, 248, 0.28)',  // sky
      to: 'rgba(0,0,0,0)',
      sizeVW: 70,
      sizeVH: 60,
      opacity: 0.9,
      startX: -10,
      startY: 10,
      driftX: 18,
      driftY: 12,
      duration: 48,
      delay: -12,
      blend: 'screen' as const,
    },
    {
      from: 'rgba(244,114,182,0.28)',   // rose
      via: 'rgba(192,132,252,0.28)',    // violet
      to: 'rgba(0,0,0,0)',
      sizeVW: 75,
      sizeVH: 70,
      opacity: 0.8,
      startX: 45,
      startY: 35,
      driftX: -22,
      driftY: 10,
      duration: 62,
      delay: -25,
      blend: 'screen' as const,
    },
    {
      from: 'rgba(16,185,129,0.22)',    // emerald
      via: 'rgba(34,197,94,0.18)',      // green
      to: 'rgba(0,0,0,0)',
      sizeVW: 60,
      sizeVH: 55,
      opacity: 0.75,
      startX: 10,
      startY: 60,
      driftX: 14,
      driftY: -16,
      duration: 54,
      delay: -5,
      blend: 'lighten' as const,
    },
  ],
  // Stardust Trails (ton animation)
  trails: {
    count: 60,           // densité
    angle: 210,          // ↙︎ (210°)
    sizeMin: 20,
    sizeMax: 44,
    xShiftMin: 160,      // 160‑240 vw
    xShiftMax: 240,
    yStartMin: -20,      // −20 → 120 vh
    yStartMax: 120,
    durationMin: 18,     // 18 → 30 s
    durationMax: 30,
    hueMin: 180,         // pastel
    hueMax: 300,
  },
}

// ------------------------------------------------------------
// Nebula – étoiles fines (twinkle)
// ------------------------------------------------------------
function StarsField({
  count,
  seed,
  minSize,
  maxSize,
  minOpacity,
  maxOpacity,
}: typeof CONFIG['stars']) {
  const stars = useMemo(() => {
    const rnd = mulberry32(seed)
    return Array.from({ length: count }).map((_, i) => {
      const x = rnd() * 100 // vw
      const y = rnd() * 100 // vh
      const size = clamp(minSize + rnd() * (maxSize - minSize), minSize, maxSize)
      const baseOpacity = clamp(minOpacity + rnd() * (maxOpacity - minOpacity), minOpacity, maxOpacity)
      const twinkleDelay = -rnd() * 8
      const twinkleDuration = 4 + rnd() * 6
      return { id: i, x, y, size, baseOpacity, twinkleDelay, twinkleDuration }
    })
  }, [count, seed, minSize, maxSize, minOpacity, maxOpacity])

  return (
    <div aria-hidden className="absolute inset-0 pointer-events-none">
      {stars.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: `${s.x}vw`,
            top: `${s.y}vh`,
            width: s.size,
            height: s.size,
            background: 'white',
            opacity: s.baseOpacity,
            filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.3))',
          }}
          animate={{ opacity: [s.baseOpacity, s.baseOpacity * 0.4, s.baseOpacity] }}
          transition={{ duration: s.twinkleDuration, delay: s.twinkleDelay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ------------------------------------------------------------
// Nebula – blobs d’aurores
// ------------------------------------------------------------
type AuroraProps = {
  from: string
  via?: string
  to: string
  sizeVW: number
  sizeVH: number
  opacity: number
  startX: number
  startY: number
  driftX: number
  driftY: number
  duration: number
  delay?: number
  blend?: 'screen' | 'lighten' | 'plus-lighter'
}

function AuroraBlob({
  from,
  via,
  to,
  sizeVW,
  sizeVH,
  opacity,
  startX,
  startY,
  driftX,
  driftY,
  duration,
  delay = 0,
  blend = 'screen',
}: AuroraProps) {
  return (
    <motion.div
      aria-hidden
      className="absolute rounded-full blur-3xl pointer-events-none"
      style={{
        width: `${sizeVW}vw`,
        height: `${sizeVH}vh`,
        left: `${startX}vw`,
        top: `${startY}vh`,
        opacity,
        mixBlendMode: blend, // MOD: 1
        background: via
          ? `radial-gradient(60% 60% at 50% 50%, ${from} 0%, ${via} 40%, ${to} 70%, transparent 100%)`
          : `radial-gradient(60% 60% at 50% 50%, ${from} 0%, ${to} 70%, transparent 100%)`,
      }}
      initial={{ x: 0, y: 0 }}
      animate={{ x: [0, driftX * 0.5, driftX, driftX * 0.5, 0], y: [0, -driftY * 0.5, -driftY, -driftY * 0.5, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

// ------------------------------------------------------------
// Stardust Trails – ton animation (au-dessus du Nebula)
// ------------------------------------------------------------
function StarIcon ({ size = 32, hue = 200 }: { size?: number; hue?: number }) {
  const gradId = useMemo(() => `starGrad_${Math.random().toString(36).slice(2, 8)}`, [])
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: 'block' }}>
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`hsla(${hue},100%,95%,1)`} />
          <stop offset="60%" stopColor={`hsla(${hue},100%,80%,0.9)`} />
          <stop offset="100%" stopColor={`hsla(${hue},100%,60%,0.3)`} />
        </radialGradient>
      </defs>
      <polygon
        points="32 8 40 24 56 32 40 40 32 56 24 40 8 32 24 24"
        fill={`url(#${gradId})`}
        style={{ filter: `drop-shadow(0 0 6px hsla(${hue},100%,80%,0.9))` }}
      />
    </svg>
  )
}

function StardustTrails() {
  const {
    count, angle, sizeMin, sizeMax, xShiftMin, xShiftMax, yStartMin, yStartMax, durationMin, durationMax, hueMin, hueMax,
  } = CONFIG.trails

  const items = useMemo(() => {
    const rnd = mulberry32(2025)
    const arr: React.ReactElement[] = []
    for (let i = 0; i < count; i++) {
      const size = sizeMin + rnd() * (sizeMax - sizeMin)
      const startXPct = rnd() * 100              // 0‑100 vw
      const startYPct = yStartMin + rnd() * (yStartMax - yStartMin) // −20 → 120 vh
      const xShift = xShiftMin + rnd() * (xShiftMax - xShiftMin)    // 160‑240 vw
      const duration = durationMin + rnd() * (durationMax - durationMin) // 18 → 30 s
      const delay = -rnd() * duration
      const hue = hueMin + rnd() * (hueMax - hueMin)

      arr.push(
        <motion.div
          key={i}
          initial={{ x: `${startXPct}vw`, y: `${startYPct}vh`, opacity: 0 }}
          animate={{ x: `${startXPct - xShift}vw`, y: '140vh', opacity: [0, 1, 0.9, 0] }}
          transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
          className="absolute pointer-events-none"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {/* on contre-rotate pour garder l’étoile droite visuellement */}
          <div style={{ transform: `rotate(${-angle}deg)` }}>
            <StarIcon size={size} hue={hue} />
          </div>
        </motion.div>
      )
    }
    return arr
  }, [count, angle, sizeMin, sizeMax, xShiftMin, xShiftMax, yStartMin, yStartMax, durationMin, durationMax, hueMin, hueMax])

  // z-[2] pour passer devant les aurores/étoiles du nebula
  return <div aria-hidden className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">{items}</div>
}

// ------------------------------------------------------------
// Composant principal
// ------------------------------------------------------------
export default function Background9 () {
  // le fond galaxie fixe (ancien galaxyStyle)
  const galaxyStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(180deg, #060a12 0%, #0a1220 60%, #0d1828 100%)',
    backgroundSize: 'cover',
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none isolate z-0" style={galaxyStyle} aria-hidden>
      {/* Couche 0 : base sombre + légère texture */}
      <div
        className="absolute inset-0 opacity-100"
        style={{
          background:
            'radial-gradient(120% 80% at 20% 10%, rgba(15,13,24,0.7) 0%, rgba(11,10,18,0.7) 40%, rgba(10,9,17,0.7) 60%, rgba(9,8,15,0.7) 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            'radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.5) 0, transparent 60%), radial-gradient(1px 1px at 80% 40%, rgba(255,255,255,0.3) 0, transparent 60%), radial-gradient(1px 1px at 50% 80%, rgba(255,255,255,0.4) 0, transparent 60%)',
          backgroundSize: '120px 120px, 160px 160px, 200px 200px',
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Couche 1 : étoiles fines (twinkle) */}
      <StarsField {...CONFIG.stars} />

      {/* Couche 2 : aurores (3 blobs lents) */}
      {CONFIG.auroras.map((a, idx) => (
        <AuroraBlob key={idx} {...a} />
      ))}

      {/* Couche 3 : TON animation Stardust Trails (au-dessus) */}
      <StardustTrails />

      {/* Couche 4 : douce lueur en bas (fixe) */}
      <div
        className="absolute -bottom-[25vh] left-1/2 -translate-x-1/2 blur-3xl opacity-60 pointer-events-none"
        style={{
          width: '120vw',
          height: '60vh',
          background:
            'radial-gradient(60% 60% at 50% 30%, rgba(59,130,246,0.18) 0%, rgba(59,130,246,0.08) 35%, transparent 70%)',
          mixBlendMode: 'screen', // MOD: 1
        }}
      />
    </div>
  )
}

/* ============================================================
   RÉGLAGES EXPRESS
   - Densité Trails         : CONFIG.trails.count
   - Vitesse Trails         : durationMin/Max
   - Angle Trajectoire      : CONFIG.trails.angle (deg)
   - Intensité Nebula       : auroras[i].opacity et couleurs from/via
   - Densité étoiles fines  : CONFIG.stars.count
   - Si besoin, remets un z-index négatif sur le conteneur parent
     (pas ici) si tu veux forcer le background derrière tout.
   ============================================================ */

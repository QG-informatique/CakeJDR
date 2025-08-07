'use client'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

/**
 * Background 9 – “Stardust Trails” ✨ (v6‑spread3)
 * ------------------------------------------------------------
 * Nouvelle stratégie de “spread” pour couvrir TOUT l’écran :
 *   • Départs X : **0 – 100 vw** (uniforme).
 *   • Départs Y : **‑20 vh → 120 vh** pour que certaines étoiles
 *     apparaissent déjà dans le viewport, d’autres plus haut.
 *   • xShift : **160‑240 vw** – assez long pour traverser/ dépasser
 *     tout l’écran même depuis X = 0.
 * ------------------------------------------------------------
 */

const PATH_ANGLE = 210 // ↙︎ (210°)

function StarIcon ({ size = 32, hue = 200 }: { size?: number; hue?: number }) {
  const gradId = `starGrad_${Math.random().toString(36).slice(2, 8)}`
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
        filter={`drop-shadow(0 0 6px hsla(${hue},100%,80%,0.9))`}
      />
    </svg>
  )
}

export default function Background9 () {
  const [stars, setStars] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const items: React.ReactElement[] = []
    const n = 60
    for (let i = 0; i < n; i++) {
      const size      = 20 + Math.random() * 24     // 20 → 44 px
      const startXPct = Math.random() * 100         // 0‑100 vw (uniform)
      const startYPct = -20 + Math.random() * 140   // −20 → 120 vh (uniform)
      const xShift    = 160 + Math.random() * 80    // 160‑240 vw
      const duration  = 18 + Math.random() * 12     // 18 → 30 s
      const delay     = -Math.random() * duration
      const hue       = 180 + Math.random() * 120   // pastel

      items.push(
        <motion.div
          key={i}
          initial={{ x: `${startXPct}vw`, y: `${startYPct}vh`, opacity: 0 }}
          animate={{
            x: `${startXPct - xShift}vw`,
            y: '140vh',
            opacity: [0, 1, 0.9, 0],
          }}
          transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
          style={{ position: 'absolute', pointerEvents: 'none', transform: `rotate(${PATH_ANGLE}deg)` }}
        >
          <div style={{ transform: `rotate(${-PATH_ANGLE}deg)` }}>
            <StarIcon size={size} hue={hue} />
          </div>
        </motion.div>
      )
    }
    setStars(items)
  }, [])

  const galaxyStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(180deg, #060a12 0%, #0a1220 60%, #0d1828 100%)',
    backgroundSize: 'cover',
  }

  return (
    <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none" style={galaxyStyle}>
      {stars}
    </div>
  )
}

/* ============================================================
   v6‑spread3 (uniform full‑screen)
   ------------------------------------------------------------
   • X 0‑100 vw, Y −20 → 120 vh.
   • xShift 160‑240 vw.
   ============================================================ */

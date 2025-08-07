'use client'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

/**
 * Background 8 – “Pixel Hearts” ❤️ (v3)
 * ------------------------------------------------------------
 * • Cœurs 8-bit parfaitement symétriques (grille 7×6).
 * • Battement scale +30 %.
 * • Palette : rouge, rose, or.
 * ------------------------------------------------------------
 */

/* ╔═════════════╗
   ║  ICÔNE COEUR ║
   ╚═════════════╝ */
function PixelHeartIcon (
  { size = 48, color = '#ff4d4f' }: { size?: number; color?: string },
) {
  // Tableau de blocs (x, y) – axe de symétrie x = 3
  const blocks: [number, number][] = [
    /* y=0 */ [1, 0], [5, 0],
    /* y=1 */ [0, 1], [1, 1], [2, 1], [4, 1], [5, 1], [6, 1],
    /* y=2 */ [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2],
    /* y=3 */ [1, 3], [2, 3], [3, 3], [4, 3], [5, 3],
    /* y=4 */ [2, 4], [3, 4], [4, 4],
    /* y=5 */ [3, 5],
  ]

  return (
    <svg
      viewBox="0 0 7 6"
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'pixelated' }}
    >
      {blocks.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={color} />
      ))}
    </svg>
  )
}

/* ╔═══════════════════════════╗
   ║  BACKGROUND COMPONENT v3  ║
   ╚═══════════════════════════╝ */
export default function Background8 () {
  const [hearts, setHearts] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const palette = ['#ff4d4f', '#ff7aa8', '#ffd23f']
    const items: React.ReactElement[] = []
    const n = 40

    for (let i = 0; i < n; i++) {
      const size = 32 + Math.random() * 32          // 32 → 64 px
      const left = Math.random() * 100
      const duration = 16 + Math.random() * 10      // 16 → 26 s
      const delay = -Math.random() * duration
      const color = palette[i % palette.length]

      items.push(
        <motion.div
          key={i}
          initial={{ y: '110vh', opacity: 0, scale: 0.9 }}
          animate={{
            y: '-120vh',
            opacity: [0, 1, 0.95, 1, 0],
            scale: [0.9, 1.3, 1], // battement +30 %
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay,
            ease: 'linear',
            times: [0, 0.25, 0.5, 1],
          }}
          style={{
            position: 'absolute',
            left: `${left}vw`,
            pointerEvents: 'none',
          }}
        >
          <PixelHeartIcon size={size} color={color} />
        </motion.div>
      )
    }
    setHearts(items)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {hearts}
      {/* Overlay rose pastel pour conserver la lisibilité */}
      <div className="absolute inset-0 bg-rose-800/40" />
    </div>
  )
}

/* ============================================================
   🆕 Changelog v3
   ------------------------------------------------------------
   1. PixelHeartIcon redessiné (grille 7×6) pour symétrie parfaite.
   ============================================================ */

'use client'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

/**
 * Background 7 – “Paper Lanterns” (v7) 🔥
 * ------------------------------------------------------------
 * • Overlay remplacé par un **dégradé lever/​coucher de soleil** :
 *   from‑amber‑400/30 → via‑rose‑500/30 → to‑purple‑600/30.
 *   → Atmosphère plus douce et réaliste.
 * • Aucune autre logique modifiée (lanternes, flamme, halo).
 * ------------------------------------------------------------
 */

function LanternIcon ({ size = 56, hue = 30 }: { size?: number, hue?: number }) {
  const gradId   = `lanternGrad_${Math.random().toString(36).slice(2, 8)}`
  const flameId  = `flameBlur_${Math.random().toString(36).slice(2, 8)}`
  const flickDur = 0.7 + Math.random() * 1.1
  const flameHue = 10

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      style={{ display: 'block', filter: `drop-shadow(0 0 16px hsla(${flameHue},100%,75%,0.95))` }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="64">
          <stop offset="0%"   stopColor={`hsl(${hue},90%,92%)`} />
          <stop offset="50%"  stopColor={`hsl(${hue},90%,72%)`} />
          <stop offset="100%" stopColor={`hsl(${hue},90%,52%)`} />
        </linearGradient>
        <filter id={flameId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="16" y="12" width="32" height="40" rx="6" ry="6" fill={`url(#${gradId})`} />
      <polygon points="16,12 32,0 48,12" fill={`hsl(${hue},90%,60%)`} />
      <line x1="32" y1="12" x2="32" y2="52" stroke="hsla(0,0%,100%,0.45)" strokeWidth="2" />

      <circle cx="32" cy="32" r="14" fill={`hsla(${flameHue},100%,85%,0.65)`} filter={`url(#${flameId})`} />
      <circle cx="32" cy="32" r="10" fill={`hsl(${flameHue},100%,97%)`}>
        <animate attributeName="opacity" values="0.55;1;0.6;1;0.55" dur={`${flickDur}s`} repeatCount="indefinite" />
        <animate attributeName="r" values="9;12;9" dur={`${flickDur}s`} repeatCount="indefinite" />
      </circle>
    </svg>
  )
}

export default function Background7 () {
  const [lanterns, setLanterns] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const items: React.ReactElement[] = []
    const n = 30
    for (let i = 0; i < n; i++) {
      const size     = 40 + Math.random() * 40
      const left     = Math.random() * 100
      const duration = 22 + Math.random() * 15
      const delay    = -Math.random() * duration
      const hue      = 20 + Math.random() * 20
      const sway     = 8 + Math.random() * 12

      items.push(
        <motion.div
          key={i}
          initial={{ y: '110vh', opacity: 0, x: 0, scale: 0.95 }}
          animate={{ y: '-120vh', opacity: [0, 1, 0.9, 1, 0], x: [0, sway, -sway, 0], scale: [0.95, 1.1, 1] }}
          transition={{ duration, repeat: Infinity, delay, ease: 'linear', times: [0, 0.25, 0.75, 1] }}
          style={{ position: 'absolute', left: `${left}vw`, pointerEvents: 'none' }}
        >
          <LanternIcon size={size} hue={hue} />
        </motion.div>
      )
    }
    setLanterns(items)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {lanterns}
      {/* Dégradé lever/coucher de soleil */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-400/30 via-rose-500/30 to-purple-600/30" />
    </div>
  )
}

/*
============================================================
🆕 Changelog v7
============================================================
1. Overlay → dégradé sunrise/sunset (amber→rose→purple).
============================================================
*/

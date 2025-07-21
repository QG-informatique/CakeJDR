'use client'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

/**
 * D20 stylisé (SVG) - couleurs dorées/arc-en-ciel, petit effet “shine”
 */
function D20Icon({ size = 64, rotate = 0, color = "#ffe066" }: { size?: number, rotate?: number, color?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      style={{
        display: 'block',
        transform: `rotate(${rotate}deg)`,
        filter: 'drop-shadow(0 2px 6px #0002)'
      }}
    >
      <defs>
        <linearGradient id="d20Gold" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor={color}/>
          <stop offset="0.4" stopColor="#fff8dc" />
          <stop offset="0.7" stopColor="#ffd23f" />
          <stop offset="1" stopColor="#bb8a26" />
        </linearGradient>
      </defs>
      {/* Polygone principal D20 */}
      <polygon
        points="32,4 62,20 51,56 13,56 2,20"
        fill="url(#d20Gold)"
        stroke="#b7922c"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Face centrale */}
      <polygon
        points="32,4 51,56 13,56"
        fill="#fffde6"
        opacity="0.20"
      />
      {/* Arêtes secondaires */}
      <polyline points="32,4 32,56" stroke="#fff2ac" strokeWidth="1.2" opacity="0.55"/>
      <polyline points="2,20 32,56 62,20" stroke="#fff2ac" strokeWidth="1.2" opacity="0.55"/>
      {/* Chiffre 20 au centre */}
      <text
        x="32"
        y="40"
        fontFamily="monospace"
        fontWeight="bold"
        fontSize="22"
        textAnchor="middle"
        fill="#fff9e2"
        stroke="#b49231"
        strokeWidth="0.6"
        paintOrder="stroke"
        style={{
          letterSpacing: -1
        }}
      >20</text>
    </svg>
  )
}

export default function SpecialBackground() {
  const [dices, setDices] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const arr: React.ReactElement[] = []
    const golds = [
      "#ffe066", "#ffd23f", "#fff3b0", "#fff8dc", "#f59ef7",
      "#7fcafc", "#b4e08d", "#eab308"
    ]
    for (let i = 0; i < 32; ++i) {
      const size = Math.random() * 42 + 60
      const left = Math.random() * 100
      const duration = 15 + Math.random() * 12
      const delay = -Math.random() * duration
      const rotate = Math.random() * 45 - 22
      const color = golds[i % golds.length]
      arr.push(
        <motion.div
          key={i}
          initial={{ y: '120vh', opacity: 0 }}
          animate={{
            y: '-130vh',
            opacity: [0.75, 1, 0.9, 0.82, 0.77],
            rotate: rotate + 20 * Math.sin(i), // Petit effet de rotation variable
          }}
          transition={{
            duration,
            repeat: Infinity,
            delay,
            ease: 'linear'
          }}
          style={{
            position: 'absolute',
            left: `${left}vw`,
            pointerEvents: 'none',
          }}
        >
          <D20Icon size={size} rotate={rotate} color={color} />
        </motion.div>
      )
    }
    setDices(arr)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {dices}
      {/* Overlay sombre pour garder la lisibilité du texte comme tous tes backgrounds */}
      <div className="absolute inset-0 bg-gray-900/60" />
    </div>
  )
}

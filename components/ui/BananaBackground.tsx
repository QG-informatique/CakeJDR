'use client'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

/**
 * SVG d'une banane lisse et bien courbée, silhouette inspirée du pixel art fourni.
 */
function BananaIcon({ size = 60, rotate = 0 }: { size?: number; rotate?: number }) {
  return (
    <svg
      viewBox="0 0 70 48"
      width={size}
      height={(size * 48) / 70}
      style={{ display: 'block', transform: `rotate(${rotate}deg)` }}
    >
      <defs>
        {/* Dégradé principal jaune */}
        <linearGradient id="bananaYellow" x1="12" y1="35" x2="60" y2="6" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffe87a" />
          <stop offset="0.6" stopColor="#ffd93a" />
          <stop offset="1" stopColor="#ffbe00" />
        </linearGradient>
      </defs>
      {/* Corps de la banane, silhouette fine et courbée */}
      <path
        d="
          M13 41 
          Q8 31 16 23
          Q30 8 53 11
          Q63 13 62 24
          Q61 33 50 36
          Q34 41 22 43
          Q16 44 13 41
          Z"
        fill="url(#bananaYellow)"
        stroke="#b68916"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Reflet blanc */}
      <path
        d="
          M19 32 
          Q31 19 54 17"
        stroke="#fffde9"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.48"
        fill="none"
      />
      {/* Ombre douce sous la banane */}
      <path
        d="
          M19 42
          Q28 41 48 37
          Q55 35 59 29"
        stroke="#eab308"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity="0.32"
        fill="none"
      />
      {/* Bout marron à gauche */}
      <ellipse
        cx="13"
        cy="41"
        rx="2.2"
        ry="1.3"
        fill="#965A1B"
        stroke="#62411a"
        strokeWidth="1"
      />
      {/* Tige à droite */}
      <rect
        x="61"
        y="20"
        width="4"
        height="9"
        rx="1.5"
        fill="#A07C3B"
        stroke="#62411a"
        strokeWidth="1"
      />
    </svg>
  )
}

export default function BananaBackground() {
  const [bananas, setBananas] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const arr: React.ReactElement[] = []
    for (let i = 0; i < 36; ++i) {
      const size = Math.random() * 30 + 42 // tailles variées
      const left = Math.random() * 100
      const duration = 16 + Math.random() * 11
      const delay = -Math.random() * duration
      const rotate = Math.random() * 28 - 14 // petite inclinaison aléatoire
      arr.push(
        <motion.div
          key={i}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{ y: '-120vh', opacity: 0.85 }}
          transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: `${left}vw`,
            pointerEvents: 'none',
          }}
        >
          <BananaIcon size={size} rotate={rotate} />
        </motion.div>
      )
    }
    setBananas(arr)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {bananas}
      {/* Fond sombre semi-transparent pour l'effet */}
      <div className="absolute inset-0 bg-gray-900/60" />
    </div>
  )
}

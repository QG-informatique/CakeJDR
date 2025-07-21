'use client'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

/**
 * Grosse tête de licorne rose (vue de face), deux yeux kawaii, corne multicolore bien visible.
 */
function UnicornIcon({ size = 160, rotate = 0 }: { size?: number; rotate?: number }) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      style={{ display: 'block', transform: `rotate(${rotate}deg)` }}
    >
      <defs>
        {/* Dégradé multicolore pour la corne */}
        <linearGradient id="hornGradient" x1="60" y1="10" x2="60" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffb7e5"/>
          <stop offset="20%" stopColor="#ffe066"/>
          <stop offset="40%" stopColor="#b4e08d"/>
          <stop offset="60%" stopColor="#7fcafc"/>
          <stop offset="80%" stopColor="#f59ef7"/>
          <stop offset="100%" stopColor="#ffd23f"/>
        </linearGradient>
        {/* Dégradé blush joue */}
        <radialGradient id="blush" cx="0.5" cy="0.5" r="0.5">
          <stop stopColor="#fbb2d9" offset="0%" />
          <stop stopColor="#fff1fb" offset="100%" />
        </radialGradient>
      </defs>
      {/* Oreilles peluche */}
      <ellipse cx="32" cy="37" rx="11" ry="20" fill="#fff1fb" stroke="#e1aaff" strokeWidth="2.2"/>
      <ellipse cx="88" cy="37" rx="11" ry="20" fill="#fff1fb" stroke="#e1aaff" strokeWidth="2.2"/>
      {/* Tête géante rose pâle */}
      <ellipse cx="60" cy="68" rx="45" ry="43" fill="#fbe7f6" stroke="#e1aaff" strokeWidth="4"/>
      {/* Corne multicolore bien au centre */}
      <rect x="54" y="10" width="12" height="45" rx="6" fill="url(#hornGradient)" stroke="#e1aaff" strokeWidth="2"/>
      {/* Crinière : encadre la corne mais NE PAS dessus */}
      <ellipse cx="45" cy="26" rx="10" ry="16" fill="#fbb6e9" opacity="0.96"/>
      <ellipse cx="75" cy="26" rx="10" ry="16" fill="#ffd3f7" opacity="0.9"/>
      <ellipse cx="60" cy="22" rx="8" ry="13" fill="#ffbee3" opacity="0.83"/>
      {/* Joues roses */}
      <ellipse cx="40" cy="92" rx="8" ry="3.3" fill="url(#blush)" opacity="0.93"/>
      <ellipse cx="80" cy="92" rx="8" ry="3.3" fill="url(#blush)" opacity="0.93"/>
      {/* Museau arrondi, plus clair */}
      <ellipse cx="60" cy="104" rx="26" ry="16" fill="#fff1fb" stroke="#e1aaff" strokeWidth="2"/>
      {/* Yeux kawaii gauche/droite */}
      <ellipse cx="46" cy="68" rx="8" ry="12" fill="#3a2456"/>
      <ellipse cx="74" cy="68" rx="8" ry="12" fill="#3a2456"/>
      {/* Reflets d'yeux */}
      <ellipse cx="48.5" cy="64.5" rx="2" ry="4" fill="#fff" opacity="0.8"/>
      <ellipse cx="76.5" cy="64.5" rx="2" ry="4" fill="#fff" opacity="0.8"/>
      {/* Narines */}
      <ellipse cx="54" cy="108" rx="1.9" ry="2.7" fill="#e1aaff"/>
      <ellipse cx="66" cy="108" rx="1.9" ry="2.7" fill="#e1aaff"/>
      {/* Mini bouche */}
      <ellipse cx="60" cy="115" rx="7" ry="1.6" fill="#e1aaff" opacity="0.14"/>
    </svg>
  )
}

export default function UnicornBackground() {
  const [unicorns, setUnicorns] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const arr: React.ReactElement[] = []
    for (let i = 0; i < 12; ++i) {
      const size = Math.random() * 40 + 140
      const left = Math.random() * 100
      const duration = 19 + Math.random() * 8
      const delay = -Math.random() * duration
      const rotate = Math.random() * 10 - 5
      arr.push(
        <motion.div
          key={i}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{ y: '-120vh', opacity: 0.95 }}
          transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: `${left}vw`,
            pointerEvents: 'none',
          }}
        >
          <UnicornIcon size={size} rotate={rotate} />
        </motion.div>
      )
    }
    setUnicorns(arr)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {unicorns}
      {/* Overlay foncé comme les autres backgrounds */}
      <div className="absolute inset-0 bg-gray-900/60" />
    </div>
  )
}

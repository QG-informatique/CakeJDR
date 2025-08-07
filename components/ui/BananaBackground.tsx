'use client'

import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

/**
 * BananaBackground – v1 (fond jaune doux)
 * ======================================
 * 🎯 Objectif : remplacer le fond gris foncé par un **jaune clair** qui met en valeur les bananes,
 * sans ternir le reste de la page.
 *
 * - **Overlay isolé** (`isolate z-0`) comme sur CakeBackground → l'overlay reste sous les icônes et
 *   n'affecte pas le contenu en dehors du composant.
 * - **Couleur de fond** : `bg-amber-100/40` (jaune pastel ≃ 16 % d'opacité). Change `OVERLAY_CLASS`
 *   si tu veux une nuance différente (`amber-50` ou `yellow-100`, etc.).
 * - **Animation** : icônes à `opacity: 1` (pas de voile).
 */

// === Overlay configuration ===
const OVERLAY_CLASS = 'bg-amber-100/40' // jaune pastel, 16 % opacité

/**
 * SVG d'une banane lisse et bien courbée.
 */
function BananaIcon() {
  return (
    <svg width="60px" height="60px" viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.86,22.77C-1.41,43.27.53,91.37,18.94,115.59c21.9,28.81,80.15,48.65,124.37,0,4.08-4.49,0-9.31-4.2-7.5C82,132.69,30.84,62.59,36.52,27.94,38.63,15.11,44,5.77,33,5.77S23.86,22.77,23.86,22.77Z"
        fill="#FFD700" stroke="#5C3B0B" strokeWidth="2"
      />
      <path
        d="M31.38,22.69a11.85,11.85,0,0,1-5.62-1.23c-.13-2.51,0-8.57,2.49-11.53a5.71,5.71,0,0,1,4.27-2.19c2,0,3.79.2,4.59,1.19,1.2,1.47.13,6.22-.95,10.84-.18.76-.35,1.66-.53,2.45A15.27,15.27,0,0,1,31.38,22.69Z"
        fill="#FFE066" stroke="#5C3B0B" strokeWidth="1.5"
      />
      <path d="M24.31,21.66c2.31,2.28,11,1.91,12.84,1.25" fill="none" stroke="#5C3B0B" strokeWidth="1.5" />
      <path
        d="M36.67,23.92C18.59,20,16.67,72.13,34.5,95.17c24.71,31.92,69.5,40.83,109,14.1-1.17-1.34-2-3.06-4.24-2.24-13.63,5-46.42,14.64-79.4-21.55C34.29,57.43,36.67,32.83,36.67,23.92Z"
        fill="#FFC700" stroke="#5C3B0B" strokeWidth="2"
      />
    </svg>
  )
}

export default function BananaBackground() {
  const [bananas, setBananas] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const arr: React.ReactElement[] = []
    for (let i = 0; i < 36; ++i) {
      const left = Math.random() * 100
      const duration = 16 + Math.random() * 11
      const delay = -Math.random() * duration
      arr.push(
        <motion.div
          key={i}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{ y: '-120vh', opacity: 1 }} // icônes pleinement opaques
          transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
          style={{ position: 'absolute', left: `${left}vw`, pointerEvents: 'none' }}
        >
          <BananaIcon />
        </motion.div>
      )
    }
    setBananas(arr)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden isolate z-0">
      {/* Overlay jaune doux placé derrière les bananes */}
      <div className={`absolute inset-0 -z-10 ${OVERLAY_CLASS}`} />
      {bananas}
    </div>
  )
}

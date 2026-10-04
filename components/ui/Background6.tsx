'use client'
import { motion } from 'framer-motion'
import React, { useId, useState } from 'react'

/**
 * Background 6 – “Floating Runes”
 * ------------------------------------------------------------
 * Petites runes hexagonales néon qui s’élèvent continuellement.
 * Inspiré de SpecialBackground (D20) mais avec :
 *   • Nouveau composant RuneIcon (hexagone + symbole SVG)
 *   • Palette dynamique violet‑bleu (hue 240‑300)
 *   • Rotation complète 0‑360° et drop‑shadow coloré
 *   • Overlay indigo pour garder la lisibilité du texte
 * ------------------------------------------------------------
 */

/**
 * RuneIcon
 * -----------------------------------------------------------------
 * @param size   — taille en pixels (default: 48)
 * @param rotate — rotation initiale (deg)
 * @param hue    — teinte HSL pour varier les couleurs
 * -----------------------------------------------------------------
 * Le SVG est divisé en :
 *   1. un polygone hexagonal externe (contour + dégradé radial)
 *   2. un symbole interne simplifié (losange) simulant une rune
 * Chaque instance obtient un id de gradient unique pour éviter
 * les collisions dans le DOM.
 */
function RuneIcon ({ size = 48, rotate = 0, hue = 280 }: { size?: number, rotate?: number, hue?: number }) {
  // id unique par instance ⇒ évite doublons defs/gradients
  const gradientId = `runeGrad_${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      style={{
        display: 'block',
        transform: `rotate(${rotate}deg)`,
        // Lueur néon dans la même teinte que le dégradé principal
        filter: `drop-shadow(0 0 8px hsla(${hue},100%,65%,0.85))`
      }}
    >
      <defs>
        {/* Dégradé radial du centre vers la bordure */}
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={`hsla(${hue},100%,85%,1)`} />
          <stop offset="60%"  stopColor={`hsla(${hue},100%,65%,0.85)`} />
          <stop offset="100%" stopColor={`hsla(${hue},100%,45%,0.3)`} />
        </radialGradient>
      </defs>

      {/* Hexagone externe */}
      <polygon
        points="32 4 56 16 56 48 32 60 8 48 8 16"
        fill={`url(#${gradientId})`}
        stroke={`hsla(${hue},100%,80%,0.9)`}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Symbole interne (losange) – simple, lisible à petite taille */}
      <path
        d="M32 18 L24 32 L32 46 L40 32 Z"
        fill="none"
        stroke={`hsla(${hue},100%,90%,0.9)`}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Background6 () {
  // Tirage au sort une seule fois, au premier affichage (fond chargé côté navigateur seulement).
  const [runes] = useState<React.ReactElement[]>(() => {
    /**
     * Génère 36 runes avec attributs aléatoires
     * ------------------------------------------------
     * - size    : 32 → 80 px
     * - left    : 0 → 100 vw (répartition horizontale)
     * - duration: 18 → 32 s (vitesse de montée)
     * - rotate  : 0 → 360°
     * - hue     : 240 → 300 (de bleu indigo à violet)
     */
    const elements: React.ReactElement[] = []

    for (let i = 0; i < 36; i++) {
      const size     = 32 + Math.random() * 48
      const left     = Math.random() * 100
      const duration = 18 + Math.random() * 14
      const delay    = -Math.random() * duration
      const rotate   = Math.random() * 360
      const hue      = 240 + Math.random() * 60

      elements.push(
        <motion.div
          key={i}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{
            y: '-120vh',            // même principe que SpecialBackground
            opacity: [0.2, 0.9, 0.7, 0.3, 0],
            rotate: rotate + 120    // légère rotation continue
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
          <RuneIcon size={size} rotate={rotate} hue={hue} />
        </motion.div>
      )
    }

    return elements
  })

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {runes}

      {/*
       * Overlay indigo foncé : 60 % d’opacité. Comme pour tes autres
       * backgrounds, cela garantit le contraste pour le contenu.
       */}
      <div className="absolute inset-0 bg-indigo-950/60" />
    </div>
  )
}

/*
============================================================
🆕 Modifications clés par rapport à SpecialBackground (D20)   
============================================================
1. Ajout du composant RuneIcon (SVG  + gradient radial + rune)
2. Remplacement du tableau “golds” par un spectre HSL dynamique.
3. Augmentation du nombre d’éléments (36) et rotation complète.
4. Nouvelles keyframes d’opacité pour un effet de disparition.
5. Overlay teinté indigo au lieu de gris ; garde la lisibilité.
============================================================
*/

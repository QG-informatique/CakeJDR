'use client'

import { motion } from 'framer-motion'
import CakeLogo from '../ui/CakeLogo'
import React, { useEffect, useState } from 'react'

/**
 * CakeBackground – v9 (bleu ciel, overlay isolé)
 * =============================================
 * ✅ Ce fichier résout définitivement l’effet de « voile pâle » sur toute la page :
 *   - Le wrapper porte désormais `isolate z-0`, créant un *stacking context* indépendant.
 *   - L’overlay bleu ciel reste sous les icônes (`-z-10`) **mais ne touche plus le reste du contenu**.
 *   - Couleur revue : `bg-sky-200/60` (bleu clair un peu plus soutenu que sky‑50).
 *   - Toutes les tailles/icônes inchangées (pâtisseries ×2).
 *
 * 👉 Copie‑colle tel quel ; aucun safelist n’est requis, car la classe est codée en dur.
 */

// === Configuration simple ===
const OVERLAY_CLASS = 'bg-sky-200/60' // bleu ciel doux, 24 % opacité
const LOGO_COLOR_CLASS = 'text-pink-300'
const PASTRY_COLOR_CLASS = 'text-rose-400'

interface CakeBackgroundProps {
  /** Proportion de pâtisseries (0 → jamais, 1 → toujours). */
  pastryRatio?: number
}

export default function CakeBackground({ pastryRatio = 0.15 }: CakeBackgroundProps) {
  // === Constantes ===
  const LOGO_COUNT = 40
  const MIN_SIZE = 30 // px
  const MAX_SIZE = 68 // px
  const MIN_DURATION = 18 // s
  const EXTRA_DURATION = 10 // s
  const PASTRY_SCALE = 2 // emojis ×2 pour égaler visuellement le SVG
  const PASTRY_EMOJIS = ['🍩', '🍪', '🍰'] as const

  /**
   * Crée un élément flottant (CakeLogo ou pâtisserie)
   */
  const createFloatingItem = (key: number): React.ReactElement => {
    const baseSize = Math.random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE
    const isPastry = Math.random() < pastryRatio
    const size = isPastry ? baseSize * PASTRY_SCALE : baseSize

    const left = Math.random() * 100 // % largeur viewport
    const duration = MIN_DURATION + Math.random() * EXTRA_DURATION
    const delay = -Math.random() * duration

    return (
      <motion.div
        key={key}
        initial={{ y: '110vh', opacity: 0 }}
        animate={{ y: '-110vh', opacity: 0.66 }}
        transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
        style={{ position: 'absolute', left: `${left}vw`, width: size, height: size }}
      >
        {/* Ombre subtile */}
        <div style={{ width: '100%', height: '100%', opacity: 0.9, filter: 'drop-shadow(0 2px 8px #fff4)' }}>
          {isPastry ? (
            // ==> Emoji pâtisserie (agrandi via fontSize inline)
            <span
              className={`inline-block w-full h-full flex items-center justify-center ${PASTRY_COLOR_CLASS}`}
              style={{ lineHeight: 1, fontSize: size }}
            >
              {PASTRY_EMOJIS[Math.floor(Math.random() * PASTRY_EMOJIS.length)]}
            </span>
          ) : (
            // ==> CakeLogo (SVG)
            <CakeLogo xl showText={false} className={LOGO_COLOR_CLASS} />
          )}
        </div>
      </motion.div>
    )
  }

  const [items, setItems] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const arr: React.ReactElement[] = []
    for (let i = 0; i < LOGO_COUNT; ++i) arr.push(createFloatingItem(i))
    setItems(arr)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastryRatio])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden isolate z-0">
      {/* Overlay bleu ciel sous les icônes, mais isolé du reste de la page */}
      <div className={`absolute inset-0 -z-10 ${OVERLAY_CLASS}`} />

      {/* Icônes flottantes */}
      {items}
    </div>
  )
}

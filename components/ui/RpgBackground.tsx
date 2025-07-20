'use client'
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react'
import { motion } from 'framer-motion'
import React from 'react'

/**
 * Fond animé – dés uniquement ascendants.
 * Ajustements :
 *  • 40 dés au lieu de 20  // ★ +++
 *  • Durées variées 18–28 s pour casser la synchro  // ★
 *  • Décalage initial négatif sur toute la durée  // ★
 *    ⇒ flux continu : pas d’écran « vide ».
 */
export default function RpgBackground() {
  const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]

  // ★  nombre de dés augmenté
  const dice = Array.from({ length: 40 }).map((_, i) => {
    const Icon = icons[i % icons.length]

    const size = Math.random() * 40 + 24        // 24 px → 64 px (inchangé)
    const left = Math.random() * 100            // position horizontale (vw)

    // ★  durée aléatoire + décalage cohérent
    const duration = 18 + Math.random() * 10    // 18 → 28 s
    const delay = -Math.random() * duration     // phase initiale répartie

    return (
      <motion.div
        key={i}
        initial={{ y: '110vh', opacity: 0 }}     // démarre un peu plus bas
        animate={{ y: '-110vh', opacity: 0.6 }} // monte un peu plus haut
        transition={{ duration, repeat: Infinity, delay, ease: 'linear' }} // ★ durée/delay
        style={{ position: 'absolute', left: `${left}vw` }}
      >
        <Icon
          style={{ width: size, height: size }}
          className="text-pink-300"
        />
      </motion.div>
    )
  })

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {dice}

      {/* Overlay sombre léger pour garder le texte lisible */}
      <div className="absolute inset-0 bg-gray-900/60" />
    </div>
  )
}

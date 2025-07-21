'use client'
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from 'lucide-react'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

/**
 * Fond animé – dés ascendants (40) – SAFE POUR NEXT/SSR !
 */
export default function RpgBackground() {
  const icons = React.useMemo(() => [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6], [])
  const [dice, setDice] = useState<React.ReactElement[]>([])

  useEffect(() => {
    // ⚠️ Tout le random ici, jamais dans le render !
    const arr: React.ReactElement[] = []
    for (let i = 0; i < 40; ++i) {
      const Icon = icons[i % icons.length]
      const size = Math.random() * 40 + 24
      const left = Math.random() * 100
      const duration = 18 + Math.random() * 10
      const delay = -Math.random() * duration
      arr.push(
        <motion.div
          key={i}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{ y: '-110vh', opacity: 0.6 }}
          transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
          style={{ position: 'absolute', left: `${left}vw` }}
        >
          <Icon
            style={{ width: size, height: size }}
            className="text-pink-300"
          />
        </motion.div>
      )
    }
    setDice(arr)
  }, [icons]) // ← Random/JSX généré **seulement** après le mount client

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {dice}
      {/* Overlay sombre léger pour garder le texte lisible */}
      <div className="absolute inset-0 bg-gray-900/60" />
    </div>
  )
}

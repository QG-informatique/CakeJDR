'use client'
import { motion } from 'framer-motion'
import CakeLogo from '../ui/CakeLogo'
import React, { useEffect, useState } from 'react'

export default function CakeBackground() {
  const [cakes, setCakes] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const arr: React.ReactElement[] = []
    for (let i = 0; i < 40; ++i) {
      const size = Math.random() * 38 + 30
      const left = Math.random() * 100
      const duration = 18 + Math.random() * 10
      const delay = -Math.random() * duration
      arr.push(
        <motion.div
          key={i}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{ y: '-110vh', opacity: 0.66 }}
          transition={{ duration, repeat: Infinity, delay, ease: 'linear' }}
          style={{ position: 'absolute', left: `${left}vw` }}
        >
          <div style={{ width: size, height: size, opacity: 0.85, filter: 'drop-shadow(0 2px 8px #fff4)' }}>
            <CakeLogo xl showText={false} className="text-pink-300" />
          </div>
        </motion.div>
      )
    }
    setCakes(arr)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {cakes}
      <div className="absolute inset-0 bg-gray-900/60" />
    </div>
  )
}

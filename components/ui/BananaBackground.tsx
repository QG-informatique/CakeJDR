'use client'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'

function BananaIcon({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: size, height: size }}
    >
      <path
        d="M2 22c6 4 14 4 20-4-5 2-9-1-10-5-2 5-4 7-10 9z"
        fill="#FDE047"
        stroke="#FBBF24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function BananaBackground() {
  const [bananas, setBananas] = useState<React.ReactElement[]>([])

  useEffect(() => {
    const arr: React.ReactElement[] = []
    for (let i = 0; i < 40; ++i) {
      const size = Math.random() * 36 + 32
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
          <BananaIcon size={size} />
        </motion.div>
      )
    }
    setBananas(arr)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden -z-10">
      {bananas}
      <div className="absolute inset-0 bg-gray-900/60" />
    </div>
  )
}

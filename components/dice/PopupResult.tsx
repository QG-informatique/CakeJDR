'use client'

import { FC, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  show: boolean
  result: number | null
  diceType: number
  onFinish?: () => void
}

const DiceFace: FC<{ value: string | number }> = ({ value }) => (
  <motion.div
    initial={{ scale: 0, rotate: 0, opacity: 0 }}
    animate={{ scale: 1.2, rotate: 360, opacity: 1 }}
    transition={{ duration: 0.6 }}
    className="flex items-center justify-center w-32 h-32 text-black text-6xl font-extrabold rounded-2xl bg-white border-4 border-gray-400 shadow-xl select-none"
  >
    {value}
  </motion.div>
)

const NeoDice3D: FC<Props> = ({ show, result, diceType, onFinish }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show && result !== null) {
      setVisible(true)
      const timeout = setTimeout(() => {
        setVisible(false)
        onFinish?.()
      }, 3000) // dé visible 3s

      return () => clearTimeout(timeout)
    }
  }, [show, result, onFinish])

  if (!visible || result === null) return null

  const isCrit = result === diceType
  const isFail = result === 1

  const bgGlow = isCrit
    ? 'shadow-[0_0_60px_rgba(253,224,71,0.8)]'
    : isFail
    ? 'shadow-[0_0_60px_rgba(239,68,68,0.8)]'
    : 'shadow-[0_0_40px_rgba(96,165,250,0.6)]'

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
      <div className={`${bgGlow} rounded-2xl`}>
        <DiceFace value={result} />
      </div>
    </div>
  )
}

export default NeoDice3D

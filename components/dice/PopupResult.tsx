'use client'

import { FC, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  show: boolean
  result: number | null
  diceType: number
  onReveal?: () => void
  onFinish?: () => void
}

const DiceFace: FC<{ value: string | number }> = ({ value }) => (
  <motion.div
    key={String(value)}
    initial={{ scale: 0, rotate: 0, opacity: 0 }}
    animate={{ scale: 1.2, rotate: 360, opacity: 1 }}
    transition={{ duration: 0.3 }}
    className="flex items-center justify-center w-32 h-32 text-black text-6xl font-extrabold rounded-2xl bg-white border-4 border-gray-400 shadow-xl select-none"
  >
    {value}
  </motion.div>
)

const NeoDice3D: FC<Props> = ({ show, result, diceType, onReveal, onFinish }) => {
  const [visible, setVisible] = useState(false)
  const [display, setDisplay] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)

  useEffect(() => {
    if (show && result !== null) {
      setVisible(true)
      setRolling(true)
      setDisplay(Math.floor(Math.random() * diceType) + 1)
      const interval = setInterval(() => {
        setDisplay(Math.floor(Math.random() * diceType) + 1)
      }, 100)
      const revealTimeout = setTimeout(() => {
        clearInterval(interval)
        setDisplay(result)
        setRolling(false)
        onReveal?.()
      }, 1000)
      const hideTimeout = setTimeout(() => {
        setVisible(false)
        onFinish?.()
      }, 2000)
      return () => {
        clearInterval(interval)
        clearTimeout(revealTimeout)
        clearTimeout(hideTimeout)
      }
    }
  }, [show, result, diceType, onReveal, onFinish])

  if (!visible || display === null) return null

  const isCrit = !rolling && display === diceType
  const isFail = !rolling && display === 1

  const bgGlow = isCrit
    ? 'shadow-[0_0_60px_rgba(253,224,71,0.9)]'
    : isFail
    ? 'shadow-[0_0_60px_rgba(239,68,68,0.9)]'
    : 'shadow-[0_0_40px_rgba(96,165,250,0.7)]'

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
      <div className={`${bgGlow} rounded-2xl relative`}>
        <DiceFace value={display} />
        {isCrit && (
          <motion.div
            className="absolute inset-0 rounded-2xl border-4 border-yellow-300"
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: [0.8, 0], scale: [1.2, 1.6] }}
            transition={{ duration: 0.6 }}
          />
        )}
        {isFail && (
          <motion.div
            className="absolute inset-0 rounded-2xl border-4 border-red-400"
            initial={{ x: 0 }}
            animate={{ x: [0, -8, 8, -8, 8, 0] }}
            transition={{ duration: 0.6 }}
          />
        )}
      </div>
    </div>
  )
}

export default NeoDice3D

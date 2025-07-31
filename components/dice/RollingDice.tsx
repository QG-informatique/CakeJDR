'use client'

import { FC, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  show: boolean
  result: number | null
  diceType: number
  onFinish?: () => void
}

const RollingDice: FC<Props> = ({ show, result, diceType, onFinish }) => {
  const [rolling, setRolling] = useState(false)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (show && result !== null) {
      setRolling(true)
      setRevealed(false)
      const rollTimer = setTimeout(() => {
        setRolling(false)
        setRevealed(true)
        const endTimer = setTimeout(() => onFinish?.(), 1500)
        return () => clearTimeout(endTimer)
      }, 3000)
      return () => clearTimeout(rollTimer)
    }
  }, [show, result, onFinish])

  if (!show || result === null) return null

  const isCrit = revealed && result === diceType
  const isFail = revealed && result === 1

  const glow = isCrit
    ? 'shadow-[0_0_30px_rgba(253,224,71,0.9)]'
    : isFail
    ? 'shadow-[0_0_30px_rgba(239,68,68,0.9)]'
    : 'shadow-[0_0_20px_rgba(255,255,255,0.7)]'

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
      <motion.div
        className={`w-32 h-32 bg-white rounded-xl flex items-center justify-center font-extrabold text-6xl select-none ${glow}`}
        style={{ perspective: 800 }}
        initial={{ rotateX: 0, rotateY: 0, scale: 1 }}
        animate={
          rolling
            ? {
                rotateX: [0, 720],
                rotateY: [0, 720],
                transition: { duration: 3, ease: 'linear' }
              }
            : isFail
            ? {
                rotateX: [0, -15, 15, -10, 10, 0],
                scale: [1, 1.05, 0.95, 1.02, 1],
                transition: { duration: 0.6 }
              }
            : isCrit
            ? {
                scale: [1, 1.3, 1],
                transition: { duration: 0.6 }
              }
            : { rotateX: 0, rotateY: 0, scale: 1 }
        }
      >
        <AnimatePresence mode="wait">
          {!revealed && (
            <motion.span
              key="q"
              initial={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: 90, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              ?
            </motion.span>
          )}
          {revealed && (
            <motion.span
              key="r"
              initial={{ rotateY: -90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {result}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default RollingDice

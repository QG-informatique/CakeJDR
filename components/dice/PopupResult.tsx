'use client'

import { FC, useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  show: boolean
  result: number | null
  diceType: number
  onFinish?: () => void
}

const PopupResult: FC<Props> = ({ show, result, diceType, onFinish }) => {
  const [visible, setVisible] = useState(false)
  const [reveal, setReveal] = useState(false)

  // When the parent requests the roll, display the dice
  useEffect(() => {
    if (show && result !== null) {
      setVisible(true)
      setReveal(false)
    }
  }, [show, result])

  // After 3s of spinning, reveal the number
  useEffect(() => {
    if (!visible || reveal) return
    const timer = setTimeout(() => setReveal(true), 3000)
    return () => clearTimeout(timer)
  }, [visible, reveal])

  // Hide the dice shortly after the reveal and notify parent
  useEffect(() => {
    if (!reveal) return
    const timer = setTimeout(() => {
      setVisible(false)
      onFinish?.()
    }, 1500)
    return () => clearTimeout(timer)
  }, [reveal, onFinish])

  if (!visible || result === null) return null

  const isCrit = result === diceType
  const isFail = result === 1

  const glow = isCrit
    ? 'shadow-[0_0_60px_rgba(253,224,71,0.8)]'
    : isFail
    ? 'shadow-[0_0_60px_rgba(239,68,68,0.8)]'
    : 'shadow-[0_0_40px_rgba(96,165,250,0.6)]'

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
      <motion.div
        initial={false}
        animate={
          reveal
            ? isFail
              ? { rotateX: 0, rotateY: 0, rotateZ: 0, x: [0, -6, 6, -4, 4, -2, 2, 0], scale: [1.2, 1] }
              : { rotateX: 0, rotateY: 0, rotateZ: 0, scale: [1.2, 1] }
            : { rotateX: [0, 360, 720], rotateY: [0, 360, 720], rotateZ: [0, 360], scale: 1.2 }
        }
        transition={
          reveal
            ? { type: 'spring', stiffness: 200, damping: 12 }
            : { duration: 3, ease: 'easeInOut' }
        }
        className={`${glow} flex items-center justify-center w-32 h-32 rounded-2xl bg-white border-4 border-gray-400 shadow-xl text-6xl font-extrabold select-none relative`}
      >
        {isCrit && reveal && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-yellow-300/40"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 0.8 }}
          />
        )}
        {isFail && reveal && (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-red-500/30"
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
        <motion.span
          key={reveal ? 'result' : 'question'}
          initial={{ rotateY: 0, opacity: 1 }}
          animate={{ rotateY: [0, 90, 90, 0], opacity: [1, 0, 0, 1] }}
          transition={{ duration: 0.6 }}
          className="z-10"
        >
          {reveal ? result : '?'}
        </motion.span>
      </motion.div>
    </div>
  )
}

export default PopupResult

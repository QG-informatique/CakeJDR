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
  <div className="flex items-center justify-center w-32 h-32 text-black text-6xl font-extrabold rounded-2xl bg-white border-4 border-gray-400 shadow-xl select-none">
    {value}
  </div>
)

const NeoDice3D: FC<Props> = ({ show, result, diceType, onFinish }) => {
  const [phase, setPhase] = useState<'hidden' | 'anim' | 'result'>('hidden')

  useEffect(() => {
    if (show && result !== null) {
      setPhase('anim')
      const t1 = setTimeout(() => setPhase('result'), 2000)
      const t2 = setTimeout(() => {
        setPhase('hidden')
        onFinish?.()
      }, 3000)
      return () => {
        clearTimeout(t1)
        clearTimeout(t2)
      }
    }
  }, [show, result, onFinish])
  if (phase === 'hidden' || result === null) return null

  const isCrit = result === diceType
  const isFail = result === 1

  const bgGlow = isCrit
    ? 'shadow-[0_0_60px_rgba(253,224,71,0.8)]'
    : isFail
    ? 'shadow-[0_0_60px_rgba(239,68,68,0.8)]'
    : 'shadow-[0_0_40px_rgba(96,165,250,0.6)]'

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
      {phase === 'anim' && (
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 720 }}
          transition={{ duration: 2, ease: 'easeInOut' }}
          className="flex items-center justify-center w-32 h-32 text-6xl"
        >
          🎲
        </motion.div>
      )}
      {phase === 'result' && (
        <div className={`${bgGlow} rounded-2xl`}>
          <DiceFace value={result} />
        </div>
      )}
    </div>
  )
}

export default NeoDice3D

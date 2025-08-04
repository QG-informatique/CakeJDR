'use client'

import { FC, useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'

// Props definition for the dice component
// - sides: number of sides (e.g. 6, 20)
// - result: final number to show
// - onComplete: callback after animation ends
// - size: optional pixel size of the dice
// - variant: optional style variant
interface Props {
  sides: number
  result: number
  onComplete?: () => void
  size?: number
  variant?: string
}

const NeoDice2D: FC<Props> = ({ sides, result, onComplete, size = 80, variant = 'default' }) => {
  const controls = useAnimation()
  const [displayValue, setDisplayValue] = useState<number | string>('')

  useEffect(() => {
    // start showing random faces while rolling
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * sides) + 1)
    }, 100)

    // random rotation values for 3D-like spin
    const duration = 1.5 + Math.random() // 1.5 to 2.5 s
    const randomX = 360 * (2 + Math.random() * 2)
    const randomY = 360 * (2 + Math.random() * 2)
    const randomZ = 360 * (2 + Math.random() * 2)

    controls
      .start({
        rotateX: randomX,
        rotateY: randomY,
        rotateZ: randomZ,
        transition: { duration, ease: 'easeOut' }
      })
      .then(() => {
        // reveal the final result when animation ends
        clearInterval(interval)
        setDisplayValue(result)
        onComplete?.()
      })

    return () => clearInterval(interval)
  }, [controls, result, sides, onComplete])

  const isCrit = result === 20
  const isFail = result === 1
  const variantClass = variant === 'outline' ? 'border-2 border-white' : ''

  return (
    <motion.div
      // shake effect on failure
      animate={isFail ? { x: [0, -6, 6, -6, 0] } : {}}
      transition={{ duration: 0.4 }}
      style={{ width: size, height: size, perspective: 600 }}
    >
      <motion.div
        className={`
          flex items-center justify-center
          text-3xl font-extrabold rounded-lg select-none
          ${isCrit ? 'bg-yellow-400 text-black shadow-[0_0_40px_rgba(253,224,71,0.8)]'
            : isFail ? 'bg-red-600 text-white shadow-[0_0_40px_rgba(239,68,68,0.8)]'
            : 'bg-white text-black shadow-lg'}
          ${variantClass}
        `}
        style={{ width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
        initial={{ rotateX: 0, rotateY: 0, rotateZ: 0 }}
        animate={controls}
      >
        {displayValue}
      </motion.div>
    </motion.div>
  )
}

export default NeoDice2D


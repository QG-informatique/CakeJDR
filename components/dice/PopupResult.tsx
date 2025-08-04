'use client'

import { FC, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  show: boolean
  result: number
  diceType: number
  onFinish?: (result: number) => void
}

// Component displaying a 3D cube dice animation.
// Faces show '?' while rolling and reveal the final result on the front face.
const Dice3D: FC<Props> = ({ show, result, diceType, onFinish }) => {
  const cubeRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [showNumber, setShowNumber] = useState(false)
  const rotX = useRef(0)
  const rotY = useRef(0)

  useEffect(() => {
    let revealTimeout: NodeJS.Timeout
    let hideTimeout: NodeJS.Timeout

    if (show) {
      setVisible(true)
      setShowNumber(false)
      const cube = cubeRef.current
      if (cube) {
        rotX.current += 360 * (Math.floor(Math.random() * 4) + 2)
        rotY.current += 360 * (Math.floor(Math.random() * 4) + 2)
        cube.style.transition = 'transform 1s ease-in-out'
        cube.style.transform = `rotateX(${rotX.current}deg) rotateY(${rotY.current}deg)`
      }
      revealTimeout = setTimeout(() => {
        setShowNumber(true)
        onFinish?.(result)
        hideTimeout = setTimeout(() => setVisible(false), 1500)
      }, 1000)
    }

    return () => {
      clearTimeout(revealTimeout)
      clearTimeout(hideTimeout)
    }
  }, [show, result, onFinish])

  if (!visible) return null

  const isCrit = result === diceType
  const isFail = result === 1

  const glowClass = isCrit
    ? 'shadow-[0_0_60px_rgba(253,224,71,0.8)]'
    : isFail
    ? 'shadow-[0_0_60px_rgba(239,68,68,0.8)]'
    : 'shadow-[0_0_40px_rgba(96,165,250,0.6)]'

  // Helper to render each face of the cube
  const renderFace = (style: React.CSSProperties, key: string) => (
    <div
      key={key}
      className="absolute w-full h-full flex items-center justify-center text-black text-5xl font-bold bg-white rounded-lg border-4 border-gray-300 select-none"
      style={style}
    >
      {showNumber && key === 'front' ? result : '?'}
    </div>
  )

  const size = 4 // translateZ value in rem (half of w-32/h-32)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={glowClass}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
          >
            <div className="relative w-32 h-32" style={{ perspective: '600px' }}>
              <div
                ref={cubeRef}
                className="w-full h-full relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {renderFace({ transform: `translateZ(${size}rem)` }, 'front')}
                {renderFace({ transform: `rotateY(180deg) translateZ(${size}rem)` }, 'back')}
                {renderFace({ transform: `rotateY(90deg) translateZ(${size}rem)` }, 'right')}
                {renderFace({ transform: `rotateY(-90deg) translateZ(${size}rem)` }, 'left')}
                {renderFace({ transform: `rotateX(90deg) translateZ(${size}rem)` }, 'top')}
                {renderFace({ transform: `rotateX(-90deg) translateZ(${size}rem)` }, 'bottom')}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Dice3D

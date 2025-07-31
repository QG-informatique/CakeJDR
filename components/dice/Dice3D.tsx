import { FC, useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'

interface Props {
  show: boolean
  result: number | null
  diceType: number
  onFinish?: () => void
}

const faceStyle =
  'absolute w-full h-full flex items-center justify-center text-black text-4xl font-extrabold bg-white rounded-md select-none border border-gray-300 backface-hidden'

const ORIENTATIONS = [
  { x: 0, y: 0, z: 0 }, // 1
  { x: 0, y: -90, z: 0 }, // 2
  { x: -90, y: 0, z: 0 }, // 3
  { x: 90, y: 0, z: 0 }, // 4
  { x: 0, y: 90, z: 0 }, // 5
  { x: 0, y: 180, z: 0 }, // 6
]

const Dice3D: FC<Props> = ({ show, result, diceType, onFinish }) => {
  const [visible, setVisible] = useState(false)
  const [reveal, setReveal] = useState(false)
  const controls = useAnimation()

  useEffect(() => {
    if (show && result !== null) {
      setVisible(true)
      setReveal(false)
      controls.set({ rotateX: 45, rotateY: 45, rotateZ: 0 })
      let elapsed = 0
      const interval = setInterval(() => {
        controls.start({
          rotateX: "+=" + (90 + Math.random() * 180),
          rotateY: "+=" + (90 + Math.random() * 180),
          rotateZ: "+=" + (90 + Math.random() * 180),
          transition: { duration: 0.3, ease: 'easeInOut' },
        })
        elapsed += 300
        if (elapsed >= 2700) {
          clearInterval(interval)
          const idx = ((result - 1) % 6 + 6) % 6
          const final = ORIENTATIONS[idx]
          controls
            .start({
              rotateX: final.x,
              rotateY: final.y,
              rotateZ: final.z,
              transition: { duration: 0.6, ease: 'easeOut' },
            })
            .then(() => {
              setReveal(true)
              setTimeout(() => {
                setVisible(false)
                onFinish?.()
              }, 1200)
            })
        }
      }, 300)
      return () => clearInterval(interval)
    }
  }, [show, result, controls, onFinish])

  if (!visible || result === null) return null

  const isCrit = result === diceType
  const isFail = result === 1

  const wrapperClass = isCrit
    ? 'shadow-[0_0_60px_rgba(253,224,71,0.8)]'
    : isFail
    ? 'shadow-[0_0_60px_rgba(239,68,68,0.8)] shake'
    : 'shadow-[0_0_40px_rgba(96,165,250,0.6)]'

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
      <div className={wrapperClass} style={{ perspective: 600 }}>
        <motion.div
          className="relative w-24 h-24"
          style={{ transformStyle: 'preserve-3d' }}
          animate={controls}
        >
          <div className="" style={{ transform: 'rotateY(0deg) translateZ(48px)' }}>
            <div className={faceStyle}>{reveal ? result : '?'}</div>
          </div>
          <div style={{ transform: 'rotateY(180deg) translateZ(48px)' }}>
            <div className={faceStyle}>?</div>
          </div>
          <div style={{ transform: 'rotateY(90deg) translateZ(48px)' }}>
            <div className={faceStyle}>?</div>
          </div>
          <div style={{ transform: 'rotateY(-90deg) translateZ(48px)' }}>
            <div className={faceStyle}>?</div>
          </div>
          <div style={{ transform: 'rotateX(90deg) translateZ(48px)' }}>
            <div className={faceStyle}>?</div>
          </div>
          <div style={{ transform: 'rotateX(-90deg) translateZ(48px)' }}>
            <div className={faceStyle}>?</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Dice3D

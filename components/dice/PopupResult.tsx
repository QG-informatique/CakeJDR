'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import './popupresult.css'

interface Props {
  show: boolean
  result: number | null
  diceType: number
  onFinish?: (result: number) => void
  onReveal?: (result: number) => void
}

// Track alternance of spin patterns to vary animation
let patternToggle = 0

export default function PopupResult({ show, result, diceType, onFinish, onReveal }: Props) {
  const [visible,   setVisible]   = useState(false)
  const [faceIndex, setFaceIndex] = useState(0)
  const [spin,      setSpin]      = useState({ x: 0, y: 0 })
  const [showResult, setShowResult] = useState(false)

  // stocker les callbacks dans des refs pour éviter de relancer l'animation
  const finishRef = useRef<Props['onFinish'] | null>(null)
  const revealRef = useRef<Props['onReveal'] | null>(null)

  useEffect(() => {
    finishRef.current = onFinish
  }, [onFinish])

  useEffect(() => {
    revealRef.current = onReveal
  }, [onReveal])

  // Durées (ms)
  const SPIN_DURATION = 2000      // durée de la rotation
  const RESULT_DELAY  = 300       // délai pour démarrer le fondu
  const HOLD_DURATION = 2000      // temps avant de démonter après le fondu

  useEffect(() => {
    if (!show || result === null) return

    // reset
    setShowResult(false)
    setVisible(true)
    setFaceIndex(0) // always finish on the front face

    // Alterner 2 ou 3 tours pour varier
    const toursX = 2 + (patternToggle % 2)
    const toursY = 2 + ((patternToggle + 1) % 2)
    patternToggle++

    setSpin({
      x: 360 * toursX,
      y: 360 * toursY,
    })

    // Tant que la pop-up reste visible, on fera :
    // 1) rotation (SPIN_DURATION)
    // 2) attendre RESULT_DELAY
    // 3) showResult = true
    // 4) laisser HOLD_DURATION puis onFinish
    // 5) setVisible(false)
    const totalDelay = SPIN_DURATION + RESULT_DELAY
    const t1 = window.setTimeout(() => {
      setShowResult(true)
      revealRef.current?.(result)
      // Hold un peu plus pour visualiser puis déclencher le callback
      window.setTimeout(() => {
        setVisible(false)
        finishRef.current?.(result)
      }, HOLD_DURATION)
    }, totalDelay)

    return () => {
      window.clearTimeout(t1)
    }
  }, [show, result])

  if (!visible || result === null) return null

  const glowClass =
    result === diceType
      ? 'shadow-[0_0_60px_rgba(253,224,71,0.8)]'
      : result === 1
      ? 'shadow-[0_0_60px_rgba(239,68,68,0.8)]'
      : 'shadow-[0_0_40px_rgba(96,165,250,0.6)]'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="w-32 h-32 perspective">
        <motion.div
          className="relative w-full h-full transform-style preserve-3d will-change-transform"
          initial={{ rotateX: 0, rotateY: 0 }}
          animate={{ rotateX: spin.x, rotateY: spin.y }}
          transition={{ duration: SPIN_DURATION / 1000, ease: 'easeOut' }}
        >
          {['front','back','left','right','top','bottom'].map((face, i) => (
            <div
              key={face}
              className={`face-${face} absolute w-full h-full
                flex items-center justify-center
                bg-white border-2 border-gray-300 rounded-xl
                backface-hidden`}
            >
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: showResult && i === faceIndex ? 0 : 1 }}
                transition={{ delay: RESULT_DELAY / 1000, duration: 0.3 }}
                className="text-5xl font-black text-black"
                style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}
              >
                ?
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showResult && i === faceIndex ? 1 : 0 }}
                transition={{ delay: (RESULT_DELAY + 200) / 1000, duration: 0.5 }}
                className="absolute text-5xl font-black text-black"
                style={{ textShadow: '0 0 2px rgba(0,0,0,0.8)' }}
              >
                {result}
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Glow derrière */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showResult ? 1 : 0 }}
        transition={{ delay: (RESULT_DELAY + 200) / 1000, duration: 0.5 }}
        className={`absolute w-32 h-32 rounded-xl ${glowClass}`}
      />
    </div>
  )
}

'use client'

import { FC, useEffect, useMemo, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'

const facesFor = (d: number) =>
  d === 100
    ? Array.from({ length: 10 }, (_, i) => (i + 1) * 10)
    : Array.from({ length: d }, (_, i) => i + 1)

type Phase = 'hidden' | 'shake' | 'spin' | 'glow' | 'reveal'

interface Props {
  show: boolean
  result: number | null
  diceType: number
  onFinish?: () => void
}

const getCubeFaceValues = (faces: number[], result: number) => {
  const arr = Array.from({ length: Math.max(6, faces.length) }, (_, i) => faces[i % faces.length])
  const idx = arr.indexOf(result)
  if (idx !== -1) {
    [arr[2], arr[idx]] = [arr[idx], arr[2]]
  } else {
    arr[2] = result
  }
  return arr.slice(0, 6)
}

const SHAKE_MS = 380
const SPIN_TIME = 1.9
const GLOW_MS = 280
const REVEAL_MS = 1000

const DiceFace: FC<{ value: number, bg: string, rot: string }> = ({ value, bg, rot }) => (
  <div
    className={`absolute inset-0 flex items-center justify-center text-4xl font-black
      rounded-xl bg-gradient-to-br ${bg} text-slate-700 border
      border-slate-300 shadow-inner select-none`}
    style={{
      transform: rot,
      backfaceVisibility: 'hidden',
    }}
  >
    {value}
  </div>
)

const EffectsWrapper: FC<Props> = (props) => {
  return <>
    <NeoDice3D {...props} />
    <PageEffects {...props} />
  </>
}

const NeoDice3D: FC<Props> = ({ show, result, diceType, onFinish }) => {
  const faces = useMemo(() => facesFor(diceType), [diceType])
  const [phase, setPhase] = useState<Phase>('hidden')
  const controls = useAnimationControls()
  const [fixedRot, setFixedRot] = useState<{ x: number, y: number, z: number } | null>(null)

  const finalRot = useMemo(() => {
    if (result === null) return { x: 0, y: 0, z: 0 }
    if (faces.length === 6) {
      return { x: 0, y: 0, z: 0 }
    }
    return { x: 0, y: 0, z: 0 }
  }, [result, faces])

  useEffect(() => {
    if (!show || result === null) {
      setPhase('hidden')
      setFixedRot(null)
      return
    }
    setPhase('shake')
    const t = setTimeout(() => {
      setPhase('spin')
      controls
        .start({
          rotateX: [0, 720],
          rotateY: [0, 720],
          rotateZ: [0, 720],
          transition: {
            duration: SPIN_TIME,
            ease: [0.22, 1, 0.36, 1],
          },
        })
        .then(() => {
          setPhase('glow')
          controls.set(finalRot)
          setFixedRot(finalRot)
          const t2 = setTimeout(() => {
            setPhase('reveal')
            const t3 = setTimeout(() => {
              onFinish?.()
            }, REVEAL_MS)
            return () => clearTimeout(t3)
          }, GLOW_MS)
          return () => clearTimeout(t2)
        })
    }, SHAKE_MS)
    return () => clearTimeout(t)
  }, [show, result, controls, finalRot, onFinish])

  if (phase === 'hidden') return null

  const isCrit = result === diceType
  const isFail = result === 1
  const halo =
    isCrit
      ? 'after:shadow-[0_0_38px_9px_rgba(253,224,71,0.94)]'
      : isFail
      ? 'after:shadow-[0_0_96px_28px_rgba(239,68,68,1)]'
      : 'after:shadow-[0_0_24px_6px_rgba(96,165,250,0.77)]'

  const showGlow = phase === 'glow' || phase === 'reveal'

  // 🟠 FIX: on définit cubeFaces juste avant le render !
  const cubeFaces = getCubeFaceValues(faces, result ?? faces[0])

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[999]">
      <motion.div
        className={`relative w-36 h-36 [transform-style:preserve-3d] ${showGlow ? halo : ''}
          after:absolute after:inset-0 after:rounded-2xl after:mix-blend-screen
          ${showGlow ? 'after:animate-pulse' : 'after:opacity-0'}`}
        animate={fixedRot || controls}
        style={{
          perspective: 900,
          animation:
            phase === 'shake'
              ? `shake ${SHAKE_MS}ms ease-in-out`
              : undefined,
        }}
        id="neo-dice-cube"
      >
        <DiceFace value={cubeFaces[0]} bg="from-slate-100 to-slate-50" rot="rotateX(90deg) translateZ(72px)" />
        <DiceFace value={cubeFaces[1]} bg="from-slate-200 to-slate-100" rot="rotateX(-90deg) translateZ(72px)" />
        <DiceFace value={cubeFaces[2]} bg="from-slate-50 to-slate-200" rot="translateZ(72px)" />
        <DiceFace value={cubeFaces[3]} bg="from-slate-50 to-slate-200" rot="rotateY(180deg) translateZ(72px)" />
        <DiceFace value={cubeFaces[4]} bg="from-slate-50 to-slate-200" rot="rotateY(-90deg) translateZ(72px)" />
        <DiceFace value={cubeFaces[5]} bg="from-slate-50 to-slate-200" rot="rotateY(90deg) translateZ(72px)" />
      </motion.div>
      <style jsx>{`
        @keyframes shake {
          0% { transform: translate(0); }
          25% { transform: translate(-7px, 6px); }
          50% { transform: translate(7px, -7px); }
          75% { transform: translate(-5px, 5px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  )
}

const PageEffects: FC<Props> = ({ show, result, diceType }) => {
  const [phase, setPhase] = useState<'hidden'|'reveal'>('hidden')
  const [sparkKey, setSparkKey] = useState(0)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  useEffect(() => {
    if (show && result !== null) {
      setTimeout(() => setPhase('reveal'), SHAKE_MS + SPIN_TIME*1000 + (GLOW_MS-32))
      setSparkKey(k => k+1)
    } else {
      setPhase('hidden')
    }
  }, [show, result])

  const isCrit = result === diceType
  const isFail = result === 1
  const getBlueStarCount = () => {
    if (!result || !diceType) return 8
    if (isCrit) return 0
    if (isFail) return 0
    const base = Math.round((result / diceType) * 36)
    return Math.max(8, Math.min(40, base))
  }
  const GoldPulses = ({ count = 56 }) => (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * (windowSize.width - 54)
        const top = Math.random() * (windowSize.height - 54)
        return (
          <motion.span
            key={i + '_' + sparkKey}
            initial={{ opacity: 0, scale: 0.2 }}
            animate={{
              opacity: [0.7, 1, 0],
              scale: [0.8, 2.1, 0.3],
              transition: {
                delay: 0.05 + Math.random() * 0.2,
                duration: 0.82 + Math.random() * 0.38,
              },
            }}
            className="fixed text-yellow-300 font-black drop-shadow-lg select-none pointer-events-none"
            style={{
              left, top, fontSize: '52px', zIndex: 999999,
            }}
          >
            +
          </motion.span>
        )
      })}
    </>
  )
  const RedMinuses = ({ count = 34 }) => (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * (windowSize.width - 62)
        const top = Math.random() * (windowSize.height - 38)
        const angle = Math.random() * 360
        return (
          <motion.span
            key={i + '_' + sparkKey}
            initial={{ opacity: 0, scale: 0.22 }}
            animate={{
              opacity: [0.8, 1, 0],
              scale: [1, 1.22, 0.5],
              transition: {
                delay: 0.045 + Math.random() * 0.12,
                duration: 0.68 + Math.random() * 0.34,
              },
            }}
            className="fixed text-red-500 font-black drop-shadow-xl select-none pointer-events-none"
            style={{
              left, top, fontSize: '54px', zIndex: 999999,
              transform: `rotate(${angle}deg)`
            }}
          >
            –
          </motion.span>
        )
      })}
      {/* Petits traits rouges horizontaux (minus fins) */}
      {Array.from({ length: 16 }).map((_, i) => {
        const left = Math.random() * (windowSize.width - 60)
        const top = Math.random() * (windowSize.height - 16)
        return (
          <motion.div
            key={'line_' + i + '_' + sparkKey}
            initial={{ opacity: 0, scale: 0.7, x: -20 }}
            animate={{
              opacity: [0.7, 1, 0],
              scale: [0.9, 1.4, 0.7],
              x: [0, 16, -8, 0],
              transition: {
                delay: 0.08 + Math.random() * 0.13,
                duration: 0.44 + Math.random() * 0.19,
              },
            }}
            className="fixed pointer-events-none"
            style={{
              left, top, height: 6, width: 40,
              borderRadius: 8,
              background: 'linear-gradient(90deg,#f43f5e,#ef4444 75%)',
              boxShadow: '0 0 14px #f43f5e',
              zIndex: 999999,
            }}
          />
        )
      })}
    </>
  )
  const BlueStars = ({ count = 24 }) => (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * (windowSize.width - 36)
        const top = Math.random() * (windowSize.height - 36)
        return (
          <motion.span
            key={i + '_' + sparkKey}
            initial={{ opacity: 0, scale: 0.17 }}
            animate={{
              opacity: [0.8, 1, 0],
              scale: [0.7, 1.5, 0.3],
              transition: {
                delay: 0.06 + Math.random() * 0.22,
                duration: 0.72 + Math.random() * 0.34,
              },
            }}
            className="fixed text-blue-400 drop-shadow-lg select-none pointer-events-none"
            style={{
              left, top, fontSize: '36px', zIndex: 999999,
            }}
          >
            ★
          </motion.span>
        )
      })}
    </>
  )
  if (phase !== 'reveal') return null
  return <>
    {isCrit && <GoldPulses count={56} />}
    {isFail && <RedMinuses count={34} />}
    {!isCrit && !isFail && <BlueStars count={getBlueStarCount()} />}
  </>
}

export default EffectsWrapper

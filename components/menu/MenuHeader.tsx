'use client'
import { FC, useState, useRef, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dice6 } from 'lucide-react'
import CakeLogo from '../ui/CakeLogo'
import { motion, useAnimation, type Variants } from 'framer-motion'
import { useBackground } from '../context/BackgroundContext'

export type User = {
  pseudo: string
  isMJ: boolean
  color: string
}

interface MenuHeaderProps {
  user: User | null
  scale?: number
  topPadding?: number
  bottomPadding?: number
}

const SIDE_WIDTH  = 120
const HEADER_PAD  = 16
const DICE_SIZE   = 112

const LOGO_SIZE = 160 // ← ajuste ici pour la taille finale du CakeLogo

const MenuHeader: FC<MenuHeaderProps> = ({
  user,
  scale = 1,
  topPadding = 48,
  bottomPadding = 32,

}) => {
  const router = useRouter()
  const [phase, setPhase] = useState<'idle' | 'spin'>('idle')
  const btnRef = useRef<HTMLButtonElement | null>(null)

  // --- Animation gâteau ---
  const [cakeAnim, setCakeAnim] = useState<'idle'|'walking'>('idle')
  const cakeControls = useAnimation()
  const { cycleBackground } = useBackground()

  const handleCakeClick = async () => {
    if (cakeAnim === 'walking') return
    setCakeAnim('walking')
    await cakeControls.start('walking')
    setCakeAnim('idle')
    cakeControls.start('idle')
    cycleBackground()
  }

  // Animation CakeLogo : centre -> gauche -> droite -> centre
  const cakeVariants: Variants = {
    idle: {
      x: 0,
      y: 0,
      rotate: 0,
      scale: 1.0,
      transition: { duration: 0.4, type: 'spring' }
    },
    walking: {
      scale: 1.0,
      x: [0, -LOGO_SIZE * 0.7, LOGO_SIZE * 0.7, 0],
      y: [0, -LOGO_SIZE * 0.28, -LOGO_SIZE * 0.24, 0],
      rotate: [0, -16, 18, 0],
      transition: { duration: 1.35, times: [0, 0.28, 0.65, 1], ease: "easeInOut" }
    }
  }

  // --- Animation bouton dé ---
  const [diceHover, setDiceHover] = useState(false)

  const handleClickPlay = () => {
    if (!user || phase !== 'idle') return
    setPhase('spin')
    setTimeout(() => {
      router.push('/')
    }, 260)
  }

  useLockBodyScroll(false)

  return (
    <header
      className="relative w-full select-none"
      style={{
        paddingTop: topPadding,
        paddingBottom: bottomPadding,
        paddingInline: HEADER_PAD,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center'
      }}
    >
      {/* Logo Cake animé, centré, taille personnalisable */}
      <div className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20">
        <motion.div
          animate={cakeControls}
          initial="idle"
          variants={cakeVariants}
          onClick={handleCakeClick}
          className="inline-flex items-center justify-center overflow-visible"
          style={{
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <CakeLogo
            xl
            showText={false}
            className="pointer-events-none"
          />
        </motion.div>
      </div>

      {/* Ligne principale */}
      <div className="relative z-10 flex items-center w-full">
        {/* Colonne gauche */}
        <div
          className="flex items-center justify-start ml-4"
          style={{ width: SIDE_WIDTH, minWidth: SIDE_WIDTH }}
        >
          {user && (
            <motion.button
              ref={btnRef}
              type="button"
              aria-label="Aller à la table de jeu"
              disabled={phase !== 'idle'}
              onClick={handleClickPlay}
              onHoverStart={() => setDiceHover(true)}
              onHoverEnd={() => setDiceHover(false)}
              className={`
                group relative inline-flex items-center justify-center
                rounded-2xl border-2 border-pink-300/40
                shadow-md shadow-pink-200/20
                transition
                focus:outline-none focus:ring-2 focus:ring-pink-200/40 focus:ring-offset-2 focus:ring-offset-black
                overflow-visible
                ${phase === 'spin' ? 'cursor-wait' : ''}
                ${phase === 'idle' ? 'cursor-pointer' : ''}
              `}
              style={{
                width: DICE_SIZE,
                height: DICE_SIZE,
                background: diceHover || phase !== 'idle'
                  ? 'radial-gradient(circle at 60% 35%, #ffe0f1 40%, #fff7 80%, #ffe2 100%)'
                  : 'rgba(38,16,56,0.14)',
                transition: "background 0.22s cubic-bezier(.77,.2,.56,1)",
                boxShadow: diceHover
                  ? "0 0 12px 2px #ffb0e366, 0 2px 20px 8px #fff2"
                  : "0 0 4px 1px #ffe5fa44, 0 2px 8px 2px #fff2",
                borderColor: diceHover ? "#ff90cc" : "#f7bbf7"
              }}
              animate={diceHover ? { scale: 1.08, y: -3 }
                                 : { scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <Dice6
                className={`
                  w-16 h-16 text-white drop-shadow-[0_2px_5px_rgba(255,70,190,0.45)]
                  transition-transform duration-400
                `}
              />
            </motion.button>
          )}
        </div>

        {/* Centre flexible */}
        <div className="flex-1" />
      </div>

      <style jsx>{`
        @keyframes diceSpin {
          0% { transform: rotate3d(1,1,0,0deg) scale(1); }
          40% { transform: rotate3d(.6,1,.2,200deg) scale(.9); }
          70% { transform: rotate3d(.4,1,.3,310deg) scale(1.08); }
          100% { transform: rotate3d(.3,1,.4,360deg) scale(1.03); }
        }
        .animate-diceSpin {
          animation: diceSpin 0.55s cubic-bezier(.55,.3,.3,1);
        }
      `}</style>
    </header>
  )
}

function useLockBodyScroll(lock: boolean) {
  useLayoutEffect(() => {
    if (!lock) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [lock])
}

export default MenuHeader

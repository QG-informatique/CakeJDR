'use client'

// MODIFICATION SUMMARY
// - Replace manual animation control with variant-driven state (approx. lines 25-50).
// - Reset animation and cycle backgrounds on animation completion (around line 40).
// - Drop unused `useAnimation` hook to prevent stale state causing one-shot clicks (line 5 removal).

import { FC, useState } from 'react'
import CakeLogo from '../ui/CakeLogo'
import { motion, type Variants } from 'framer-motion'
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

const LOGO_SIZE   = 48

const MenuHeader: FC<MenuHeaderProps> = ({
  scale = 1,
}) => {
  // Animation gâteau
  const [cakeAnim, setCakeAnim] = useState<'idle' | 'walking'>('idle')
  const { cycleBackground } = useBackground()

  const handleCakeClick = () => {
    if (cakeAnim === 'walking') return // FIX: ignore clicks while animation runs
    setCakeAnim('walking') // FIX: trigger walking animation sequence
  }

  // Animation CakeLogo
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
      x: [0, LOGO_SIZE * 0.6, -LOGO_SIZE * 0.6, 0],
      transition: {
        duration: 1.4,
        times: [0, 0.33, 0.66, 1],
        ease: 'easeInOut'
      }
    }
  }

  // Une barre basse : le logo à gauche, les réglages (fixés en haut à droite)
  // gardent leur place. Un clic sur le gâteau change le fond, comme avant.
  return (
    <header
      className="relative mx-auto flex w-full max-w-7xl items-center px-6 pt-3 select-none"
      style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: 'top left' }}
    >
      <motion.div
        animate={cakeAnim}
        initial="idle"
        variants={cakeVariants}
        onClick={handleCakeClick}
        onAnimationComplete={(def) => {
          if (def === 'walking') {
            cycleBackground()
            setCakeAnim('idle')
          }
        }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex cursor-pointer items-center"
      >
        <CakeLogo large className="pointer-events-none !gap-2 [&>span]:!text-2xl" />
      </motion.div>
    </header>
  )
}

export default MenuHeader

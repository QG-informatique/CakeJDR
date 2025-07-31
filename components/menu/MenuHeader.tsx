'use client'

import { FC, useState } from 'react'
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
const LOGO_SIZE   = 160

const MenuHeader: FC<MenuHeaderProps> = ({
  scale = 1,
  topPadding = 48,
  bottomPadding = 32,
}) => {
  // Animation gâteau
  const [cakeAnim, setCakeAnim] = useState<'idle'|'walking'>('idle')
  const cakeControls = useAnimation()

  // --- CORRECTION ICI : UN SEUL HOOK ---
  const { cycleBackground } = useBackground()
  
  const handleCakeClick = async () => {
    if (cakeAnim === 'walking') return
    setCakeAnim('walking')
    await cakeControls.start('walking')
    setCakeAnim('idle')
    cakeControls.start('idle')
    cycleBackground()
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
      x: [0, -LOGO_SIZE * 0.7, LOGO_SIZE * 0.7, 0],
      y: [0, -LOGO_SIZE * 0.28, -LOGO_SIZE * 0.24, 0],
      rotate: [0, -16, 18, 0],
      transition: { duration: 1.35, times: [0, 0.28, 0.65, 1], ease: "easeInOut" }
    }
  }

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
      <div
        className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20"
        style={{ top: 'calc(50% + 100px)' }}
      >
        <motion.div
          animate={cakeControls}
          initial="idle"
          variants={cakeVariants}
          whileHover={{ scale: 1.08, filter: 'drop-shadow(0 0 8px #f9a8d4)' }}
          transition={{ type: 'spring', stiffness: 300 }}
          onClick={handleCakeClick}
          className="inline-flex items-center justify-center overflow-visible"
          role="button"
          aria-label="Change background"
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
        />

        {/* Centre flexible */}
        <div className="flex-1" />
      </div>
    </header>
  )
}

export default MenuHeader

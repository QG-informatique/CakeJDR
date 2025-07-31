'use client'

import { FC, useState } from 'react'
import CakeLogo from '../ui/CakeLogo'
import { motion, useAnimation } from 'framer-motion'
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
  const { cycleBackground } = useBackground()

  const controls = useAnimation()
  const [animating, setAnimating] = useState(false)

  const JIGGLE = LOGO_SIZE * 0.25

  const handleCakeClick = async () => {
    if (animating) return
    setAnimating(true)
    await controls.start({
      x: [0, -JIGGLE, JIGGLE, 0],
      transition: { duration: 2, ease: 'easeInOut', times: [0, 0.33, 0.66, 1] }
    })
    setAnimating(false)
    cycleBackground()
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
      <div className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-20">
        <motion.div
          animate={controls}
          initial={{ x: 0 }}
          whileHover={{ scale: 1.07 }}
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
        />

        {/* Centre flexible */}
        <div className="flex-1" />
      </div>
    </header>
  )
}

export default MenuHeader

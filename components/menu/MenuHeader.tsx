'use client'

import { FC } from 'react'
import CakeLogo from '../ui/CakeLogo'

interface MenuHeaderProps {
  scale?: number
}

// Une barre basse : le logo à gauche, les réglages (fixés en haut à droite)
// gardent leur place. Le clic sur le gâteau changeait le fond ; chaque thème a
// désormais un seul fond, il n'y a plus rien à faire tourner.
const MenuHeader: FC<MenuHeaderProps> = ({ scale = 1 }) => (
  <header
    className="relative mx-auto flex w-full max-w-7xl items-center px-6 pt-3 select-none"
    style={{ transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: 'top left' }}
  >
    <CakeLogo large className="pointer-events-none !gap-2 [&>span]:!text-2xl" />
  </header>
)

export default MenuHeader

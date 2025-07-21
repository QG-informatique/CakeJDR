'use client'
import { Cake } from 'lucide-react'
import { Titan_One } from 'next/font/google'
import React from 'react'

// Fonte Google « Titan One »
const titan = Titan_One({ subsets: ['latin'], weight: '400' })

interface Props {
  className?: string
  showText?: boolean
  small?: boolean  // 32 px
  large?: boolean  // 48 px
  huge?: boolean   // 64 px
  xl?: boolean     // 80 px  ← AJOUT
}

export default function CakeLogo({
  className = '',
  showText = true,
  small,
  large,
  huge,
  xl,
}: Props) {
  // Choix de la taille
  const size =
    xl    ? 'w-20 h-20' :
    huge  ? 'w-16 h-16' :
    large ? 'w-12 h-12' :
    small ? 'w-8  h-8'  :
            'w-10 h-10' // défaut intermédiaire

  const textSize = xl ? 'text-5xl' : huge ? 'text-4xl' : 'text-3xl'

  return (
    <span className={`inline-flex items-center gap-3 bg-transparent ${className}`}>
      {/* On force le fond transparent de l’icône */}
      <Cake className={`${size} text-pink-400 bg-transparent`} />
      {showText && (
        <span className={`${titan.className} text-white drop-shadow bg-transparent ${textSize}`}>
          Cake&nbsp;JDR
        </span>
      )}
    </span>
  )
}

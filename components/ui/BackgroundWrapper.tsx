'use client'
import React, { useEffect, useState } from 'react'

/* ---------- BACKGROUNDS EXISTANTS ---------- */
import RpgBackground from './RpgBackground'
import CakeBackground from './CakeBackground'
import BananaBackground from './BananaBackground'
import UnicornBackground from './UnicornBackground'
import SpecialBackground from './SpecialBackground'

/* ---------- 🆕 BACKGROUNDS 6 → 10 ---------- */
import Background6 from './Background6'
import Background7 from './Background7'
import Background8 from './Background8'
import Background9 from './Background9'
import Background10 from './Background10'

import { useBackground, BackgroundType } from '../context/BackgroundContext'

function renderBackground(bg: BackgroundType) {
  if (bg === 'cake') return <CakeBackground />
  if (bg === 'banana') return <BananaBackground />
  if (bg === 'unicorn') return <UnicornBackground />
  if (bg === 'special') return <SpecialBackground />
  if (bg === 'bg6') return <Background6 />
  if (bg === 'bg7') return <Background7 />
  if (bg === 'bg8') return <Background8 />
  if (bg === 'bg9') return <Background9 />
  if (bg === 'bg10') return <Background10 />
  return <RpgBackground />
}

export default function BackgroundWrapper() {
  const { background } = useBackground()
  const [prev, setPrev] = useState<BackgroundType>(background)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (background === prev) return
    setFading(true)
    const t = setTimeout(() => {
      setPrev(background)
      setFading(false)
    }, 300)
    return () => clearTimeout(t)
  }, [background, prev])

  return (
    <div className="absolute inset-0">
      {renderBackground(background)}
      {fading && (
        <div className="absolute inset-0 pointer-events-none animate-fadeOut">
          {renderBackground(prev)}
        </div>
      )}
      <style jsx>{`
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-fadeOut {
          animation: fadeOut 0.3s forwards;
        }
      `}</style>
    </div>
  )
}


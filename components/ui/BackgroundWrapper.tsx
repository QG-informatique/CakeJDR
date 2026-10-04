'use client'
import React, { useEffect, useState } from 'react'

import dynamic from 'next/dynamic'

/* Chaque fond est chargé à la demande : un seul est affiché à la fois, et
   certains sont lourds (SpecialBackground fait 1600 lignes d'animations). */
const RpgBackground = dynamic(() => import('./RpgBackground'), { ssr: false })
const CakeBackground = dynamic(() => import('./CakeBackground'), { ssr: false })
const BananaBackground = dynamic(() => import('./BananaBackground'), { ssr: false })
const UnicornBackground = dynamic(() => import('./UnicornBackground'), { ssr: false })
const SpecialBackground = dynamic(() => import('./SpecialBackground'), { ssr: false })
const Background6 = dynamic(() => import('./Background6'), { ssr: false })
const Background7 = dynamic(() => import('./Background7'), { ssr: false })
const Background8 = dynamic(() => import('./Background8'), { ssr: false })
const Background9 = dynamic(() => import('./Background9'), { ssr: false })
const Background10 = dynamic(() => import('./Background10'), { ssr: false })

import { useBackground, BackgroundType } from '../context/BackgroundContext'

function renderBackground(bg: BackgroundType) {
  if (bg === 'plain') return <div className="absolute inset-0" style={{ background: 'var(--c-backdrop)' }} />
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


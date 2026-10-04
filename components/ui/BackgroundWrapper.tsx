'use client'
import React, { useSyncExternalStore } from 'react'

import dynamic from 'next/dynamic'
import { useTheme } from '../context/ThemeContext'

/* Chaque thème a un seul fond : Ardoise un fond fixe, Classique les dés roses.
   Les dés ne sont chargés que si on est en Classique. */
const RpgBackground = dynamic(() => import('./RpgBackground'), { ssr: false })

/* Qui a demandé à son système de réduire les animations garde le fond fixe du
   thème, même en Classique. */
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const prefersReducedMotion = () => window.matchMedia(REDUCED_MOTION).matches

export default function BackgroundWrapper() {
  const { theme } = useTheme()
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false)

  return (
    <div className="absolute inset-0">
      {theme.background === 'rpg' && !reducedMotion ? (
        <RpgBackground />
      ) : (
        <div className="absolute inset-0" style={{ background: 'var(--c-backdrop)' }} />
      )}
    </div>
  )
}

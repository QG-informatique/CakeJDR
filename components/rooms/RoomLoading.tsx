'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/useT'

/** Étapes de l'arrivée dans une salle, dans l'ordre. */
const STEPS = {
  connect: { from: 4, to: 38, label: 'roomLoadingConnect' },
  session: { from: 38, to: 66, label: 'roomLoadingSession' },
  table: { from: 66, to: 94, label: 'roomLoadingTable' },
} as const

/**
 * Écran de chargement de la salle : une barre qui monte doucement pendant
 * chaque étape et reprend où la précédente s'est arrêtée. Remplace le
 * « Loading... » de Liveblocks et la page de connexion qui apparaissait le
 * temps de vérifier la session.
 */
export default function RoomLoading({ step, done = false }: { step: keyof typeof STEPS; done?: boolean }) {
  const t = useT()
  const { from, to, label } = STEPS[step]
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-[var(--c-page)] p-6 transition-opacity duration-300 ${
        done ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <p className="text-sm text-ink/70">{t(label)}</p>
      <div className="h-1.5 w-[min(16rem,80vw)] overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--c-ink)_12%,transparent)]">
        <div
          className={`h-full rounded-full bg-[var(--c-accent)] ${done ? 'w-full transition-[width] duration-300' : 'room-loading-bar'}`}
          style={{ '--from': `${from}%`, '--to': `${to}%` } as React.CSSProperties}
        />
      </div>
    </div>
  )
}

/**
 * Rideau posé sur la table le temps que le décor arrive : il se lève quand
 * les images déjà présentes sont chargées, au plus tard après quelques
 * secondes, pour ne jamais bloquer la partie.
 */
export function RoomCurtain() {
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const started = Date.now()
    let calm = 0
    const timer = window.setInterval(() => {
      const ready = Array.from(document.images).every((img) => img.complete)
      calm = ready ? calm + 1 : 0
      const elapsed = Date.now() - started
      if ((calm >= 2 && elapsed >= 500) || elapsed >= 4000) {
        window.clearInterval(timer)
        setDone(true)
        window.setTimeout(() => setGone(true), 350)
      }
    }, 150)
    return () => window.clearInterval(timer)
  }, [])

  if (gone) return null
  return <RoomLoading step="table" done={done} />
}

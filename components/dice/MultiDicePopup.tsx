'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type Props = {
  /** Résultats tirés par le serveur, ou null quand rien n'est lancé. */
  results: number[] | null
  dice: number
  /** Intitulé sous chaque dé (montée de niveau : PV, Force…). */
  labels?: string[]
  onFinish?: () => void
}

/** Même rythme que `PopupResult` : les dés tournent, puis les chiffres apparaissent ensemble. */
const SPIN_MS = 2000
const REVEAL_MS = 300
const HOLD_MS = 2500

const NEUTRAL = { border: '#4f6eb7', text: '#e0eaff' }
const CRIT = { border: '#c9a227', text: '#fde68a' }
const FUMBLE = { border: '#b91c1c', text: '#fca5a5' }

/** Plusieurs dés lancés d'un coup, pour le joueur qui lance. */
export default function MultiDicePopup({ results, dice, labels, onFinish }: Props) {
  const [revealed, setRevealed] = useState(false)
  const finishRef = useRef(onFinish)
  useEffect(() => {
    finishRef.current = onFinish
  }, [onFinish])

  useEffect(() => {
    if (!results) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- remise à zéro de l'animation à chaque nouveau lancer
    setRevealed(false)
    const t1 = window.setTimeout(() => setRevealed(true), SPIN_MS + REVEAL_MS)
    const t2 = window.setTimeout(() => finishRef.current?.(), SPIN_MS + REVEAL_MS + HOLD_MS)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [results])

  if (!results) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-3">
      <div className="flex max-w-md flex-wrap justify-center gap-2">
        {results.map((n, i) => {
          const tone = !revealed ? NEUTRAL : n === dice ? CRIT : n === 1 ? FUMBLE : NEUTRAL
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ rotate: 0, scale: 0.6, opacity: 0 }}
                animate={{ rotate: 360 * (2 + (i % 2)) * (i % 2 ? -1 : 1), scale: 1, opacity: 1 }}
                transition={{ duration: SPIN_MS / 1000, ease: 'easeOut', delay: i * 0.05 }}
                className="flex h-12 w-12 items-center justify-center rounded-lg text-2xl font-black tabular-nums"
                style={{
                  background: 'linear-gradient(145deg, #131828, #0a0f1c)',
                  border: `2px solid ${tone.border}`,
                  boxShadow: `inset 0 0 12px rgba(0,0,0,0.6), 0 0 18px ${tone.border}66`,
                  color: tone.text,
                  transition: 'border-color .5s ease, box-shadow .5s ease',
                }}
              >
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: revealed ? 1 : 0 }} transition={{ duration: 0.4 }}>
                  {n}
                </motion.span>
              </motion.div>
              {labels?.[i] && (
                <span className="rounded bg-black/55 px-1.5 text-[11px] font-semibold text-white/85">{labels[i]}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

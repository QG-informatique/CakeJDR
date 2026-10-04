'use client'

import { FC, useRef, useState, useEffect } from 'react'
import { Dice3, ChevronDown, ChevronUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useT } from '@/lib/useT'

type Props = {
  diceType: number
  onChange: (value: number) => void
  onRoll: () => void
  disabled: boolean
  cooldown: boolean
  cooldownDuration: number
  /** À gauche de la barre (la musique). */
  leading?: React.ReactNode
  /** À droite de la barre (les joueurs en ligne). */
  children?: React.ReactNode
}

const DiceRoller: FC<Props> = ({
  diceType,
  onChange,
  onRoll,
  disabled,
  cooldown,
  cooldownDuration,
  leading,
  children
}) => {
  const t = useT()
  const clickLockRef = useRef(false)
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('dicePanelCollapsed') === '1'
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dicePanelCollapsed', collapsed ? '1' : '0')
    }
  }, [collapsed])

  const handleRollClick = () => {
    if (disabled || cooldown) return
    if (clickLockRef.current) return
    clickLockRef.current = true

    try {
      // ✅ Revert to local-only rolls: trigger UI without broadcasting to a global queue
      onRoll?.()
    } finally {
      // petit lock anti double-clic
      window.setTimeout(() => {
        clickLockRef.current = false
      }, 250)
    }
  }

  // When collapsed, show only a centered expand button
  if (collapsed) {
    return (
      <>
        <button
          onClick={() => setCollapsed(false)}
          aria-label={t('expandPanel')}
          title={t('expandPanel')}
          className="ui-btn ui-btn-icon absolute bottom-3 left-1/2 -translate-x-1/2 z-50"
        >
          <ChevronUp size={18} />
        </button>
        {leading && <div className="hidden">{leading}</div>}
        {children && <div className="hidden">{children}</div>}
      </>
    )
  }

  return (
    // Une seule ligne : musique à gauche, dé et « Lancer » au centre, joueurs à droite.
    <div className="ui-panel @container relative grid w-full flex-shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-2 @md:gap-3">
      <div className="flex min-w-0 items-center justify-start">{leading}</div>

      <div className="flex items-center gap-2">
        <select
          value={diceType}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          aria-label={t('diceType')}
          title={t('diceType')}
          className="ui-input !min-h-10 cursor-pointer font-semibold"
        >
          {[4, 6, 8, 10, 12, 20, 100].map((val) => (
            <option key={val} value={val}>
              D{val}
            </option>
          ))}
        </select>

        <button
          onClick={handleRollClick}
          className="ui-btn ui-btn-primary relative overflow-hidden !min-h-10 !px-4 !text-[15px] @md:!px-6"
          disabled={disabled || cooldown}
        >
          <Dice3 size={18} />
          {t('roll')}

          {cooldown && (
            <motion.span
              className="absolute inset-0 bg-shade/40 origin-left pointer-events-none"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: Math.max(0.1, cooldownDuration / 1000), ease: 'linear' }}
            />
          )}
        </button>
      </div>

      <div className="flex min-w-0 items-center justify-end gap-2">
        {children}
        <button
          onClick={() => setCollapsed(true)}
          aria-label={t('collapsePanel')}
          title={t('collapsePanel')}
          className="ui-btn ui-btn-ghost ui-btn-icon"
        >
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  )
}

export default DiceRoller

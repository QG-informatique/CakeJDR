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
  afterRoll?: React.ReactNode
  children?: React.ReactNode
}

const DiceRoller: FC<Props> = ({
  diceType,
  onChange,
  onRoll,
  disabled,
  cooldown,
  cooldownDuration,
  afterRoll,
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
        {afterRoll && <div className="hidden">{afterRoll}</div>}
        {children && <div className="hidden">{children}</div>}
      </>
    )
  }

  return (
    <div className="ui-panel relative w-full px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 flex-shrink-0">
      {/* Choix du dé */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="ui-label">{t('dieShort')}</span>
        <div className="ui-seg" role="group" aria-label={t('diceType')}>
          {[4, 6, 8, 10, 12, 20, 100].map((val) => (
            <button
              key={val}
              onClick={() => !disabled && onChange(val)}
              disabled={disabled}
              aria-pressed={diceType === val}
              className="!flex-none !px-2"
            >
              D{val}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleRollClick}
        className="ui-btn ui-btn-primary relative overflow-hidden !min-h-10 !px-6 !text-[15px]"
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

      {afterRoll && <div className="flex items-center">{afterRoll}</div>}

      <div className="ml-auto flex items-center gap-2">
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

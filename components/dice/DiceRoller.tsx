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
          aria-label="Expand dice panel"
          className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 text-white/80 hover:text-white bg-black/30 rounded-full p-1"
        >
          <ChevronUp size={20} />
        </button>
        {afterRoll && <div className="hidden">{afterRoll}</div>}
        {children && <div className="hidden">{children}</div>}
      </>
    )
  }

  return (
    <div
      className="
        relative w-full p-4 flex flex-wrap items-center gap-3
        rounded-xl
        border border-white/10
        bg-black/15
        backdrop-blur-[2px]
        shadow-lg shadow-black/10
        transition flex-shrink-0
      "
      style={{
        boxShadow: '0 4px 18px -8px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      {/* Center collapse toggle using flex so it remains responsive */}
      <div className="absolute -top-3 left-0 right-0 flex justify-center">
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse dice panel"
          className="z-50 text-white/80 hover:text-white bg-black/30 rounded-full p-1"
        >
          <ChevronDown size={20} />
        </button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">{t('diceType')}</span>

        <div className="flex gap-1 flex-wrap">
          {[4, 6, 8, 10, 12, 20, 100].map((val) => (
            <button
              key={val}
              onClick={() => !disabled && onChange(val)}
              disabled={disabled}
              className={`
                px-2 py-1 rounded-lg text-xs font-bold border transition-all duration-150 active:scale-90
                ${diceType === val
                  ? 'bg-indigo-600/70 border-indigo-400/60 text-white shadow-[0_0_8px_2px_rgba(99,102,241,0.3)]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white/90 hover:border-white/20'}
                ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              D{val}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleRollClick}
          className={`
            relative flex items-center gap-2
            px-8 py-2.5 rounded-2xl
            font-bold text-base tracking-wide
            text-white
            border border-white/15
            bg-gradient-to-br from-indigo-600/70 to-violet-700/60
            hover:from-indigo-500/80 hover:to-violet-600/70
            hover:border-white/25
            active:scale-95
            transition-all duration-150
            shadow-[0_2px_16px_-4px_rgba(99,102,241,0.5)]
            hover:shadow-[0_4px_24px_-4px_rgba(99,102,241,0.7)]
            ${(disabled || cooldown) ? 'opacity-50 cursor-not-allowed !shadow-none' : ''}
          `}
          disabled={disabled || cooldown}
        >
          <Dice3 className="inline -mt-0.5" size={18} />
          {t('roll')}

          {cooldown && (
            <motion.span
              className="absolute inset-0 rounded-2xl bg-black/50 origin-left pointer-events-none"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: Math.max(0.1, cooldownDuration / 1000), ease: 'linear' }}
            />
          )}
        </button>
        {afterRoll && <div className="flex items-center">{afterRoll}</div>}
      </div>

      {children && <div className="ml-auto flex items-center gap-1">{children}</div>}
    </div>
  )
}

export default DiceRoller

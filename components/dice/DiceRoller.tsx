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
  children?: React.ReactNode
}

const DiceRoller: FC<Props> = ({
  diceType,
  onChange,
  onRoll,
  disabled,
  cooldown,
  cooldownDuration,
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
      <button
        onClick={() => setCollapsed(false)}
        aria-label="Expand dice panel"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 text-white/80 hover:text-white bg-black/30 rounded-full p-1"
      >
        <ChevronUp size={20} />
      </button>
    )
  }

  return (
    <div
      className="
        relative w-full p-4 flex items-center gap-2 justify-between
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
      <label htmlFor="diceType" className="mr-2 font-semibold text-white/85">
        {t('diceType')}:
      </label>

      <select
        id="diceType"
        className="border p-1 rounded text-white bg-gray-800/70"
        value={diceType}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
      >
        {[4, 6, 8, 10, 12, 20, 100].map((val) => (
          <option key={val} value={val}>
            D{val}
          </option>
        ))}
      </select>

      <div className="ml-4">
        <button
          onClick={handleRollClick}
          className={`
            relative flex items-center gap-2
            px-7 py-2 rounded-2xl
            font-bold text-base
            text-white
            shadow
            border border-white/10
            bg-[#253053]/60
            hover:bg-[#253053]/80
            active:scale-95
            transition
            backdrop-blur-sm
            ${(disabled || cooldown) ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ boxShadow: '0 2px 12px 0 #1115' }}
          disabled={disabled || cooldown}
        >
          <Dice3 className="inline -mt-0.5 text-white/80" size={20} />
          {t('roll')}

          {cooldown && (
            <motion.span
              className="absolute inset-0 rounded-2xl bg-black/40 origin-left pointer-events-none"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: Math.max(0.1, cooldownDuration / 1000), ease: 'linear' }}
            />
          )}
        </button>
      </div>

      {children && <div className="ml-auto flex gap-1">{children}</div>}
    </div>
  )
}

export default DiceRoller

'use client'

import { FC, useRef } from 'react'
import { Dice3 } from 'lucide-react'
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

  function getProfileFromLocalStorage() {
    // Lecture robuste de jdr_profile (format { pseudo, color, loggedIn })
    try {
      const raw = localStorage.getItem('jdr_profile')
      if (raw) {
        const p = JSON.parse(raw)
        if (p && p.loggedIn && p.pseudo) {
          return {
            name: String(p.pseudo),
            color: p.color ? String(p.color) : undefined,
          }
        }
      }
    } catch {
      // ignore parse errors
    }
    // Fallbacks (si jamais)
    const legacyName = localStorage.getItem('player_name') || 'Joueur'
    const legacyColor = localStorage.getItem('player_color') || undefined
    return { name: legacyName, color: legacyColor as string | undefined }
  }

  const handleRollClick = () => {
    if (disabled || cooldown) return
    if (clickLockRef.current) return
    clickLockRef.current = true

    try {
      const { name, color } = getProfileFromLocalStorage()

      // 1) Callback local (si tu as des effets côté UI)
      onRoll?.()

      // 2) Event global consommé par <DiceHub />
      window.dispatchEvent(
        new CustomEvent('jdr:roll', {
          detail: {
            diceType,
            name,   // ex: "Gustave"
            color,  // ex: "#ff90cc"
            userId: 'anon', // si tu as un vrai id joueur, mets-le ici
          },
        })
      )
    } finally {
      // petit lock anti double-clic
      window.setTimeout(() => {
        clickLockRef.current = false
      }, 250)
    }
  }

  return (
    <div
      className="
        p-4
        flex items-center gap-2 justify-between
        rounded-xl
        border border-white/10
        bg-black/15
        backdrop-blur-[2px]
        shadow-lg shadow-black/10
        transition
      "
      style={{
        boxShadow: '0 4px 18px -8px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
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

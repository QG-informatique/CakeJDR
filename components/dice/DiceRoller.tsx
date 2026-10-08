'use client'

import { FC, useRef, useState, useEffect } from 'react'
import { Dice3, ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useT } from '@/lib/useT'
import { DICE_TYPES } from '@/lib/dicePayload'
import { POOL_MAX, poolLabel, sortDice } from '@/lib/dicePool'

type Props = {
  /** Dés choisis pour le prochain lancer. */
  dice: number[]
  onChange: (dice: number[]) => void
  /** Dés imposés par une demande du MJ : le menu les montre et ne s'ouvre pas. */
  lockedLabel?: string
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
  dice,
  onChange,
  lockedLabel,
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
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dicePanelCollapsed', collapsed ? '1' : '0')
    }
  }, [collapsed])

  // Le menu se ferme d'un clic ailleurs ou avec Échap.
  useEffect(() => {
    if (!menuOpen) return
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const handleRollClick = () => {
    if (disabled || cooldown || (!lockedLabel && dice.length === 0)) return
    if (clickLockRef.current) return
    clickLockRef.current = true
    setMenuOpen(false)

    try {
      onRoll?.()
    } finally {
      // petit lock anti double-clic
      window.setTimeout(() => {
        clickLockRef.current = false
      }, 250)
    }
  }

  const countOf = (d: number) => dice.filter((x) => x === d).length
  const add = (d: number) => {
    if (dice.length < POOL_MAX) onChange(sortDice([...dice, d]))
  }
  const remove = (d: number) => {
    const i = dice.lastIndexOf(d)
    if (i >= 0) onChange(dice.filter((_, k) => k !== i))
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
    // Une seule ligne : musique à gauche, dés et « Lancer » au centre, joueurs à droite.
    <div className="ui-panel @container relative grid w-full flex-shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-2 @md:gap-3">
      <div className="flex min-w-0 items-center justify-start">{leading}</div>

      <div className="flex items-center gap-2">
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            disabled={disabled || Boolean(lockedLabel)}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            title={t('diceMenu')}
            className="ui-btn !min-h-10 max-w-[11rem] font-semibold @md:max-w-[16rem]"
          >
            <span className="truncate">{lockedLabel ?? (dice.length ? poolLabel(dice) : t('diceNone'))}</span>
            {!lockedLabel && <ChevronUp size={16} className={menuOpen ? '' : 'rotate-180'} aria-hidden />}
          </button>

          {menuOpen && !lockedLabel && (
            <div
              role="dialog"
              aria-label={t('diceMenu')}
              className="ui-panel absolute bottom-full left-1/2 z-50 mb-2 w-[min(19rem,calc(100vw-2rem))] -translate-x-1/2 p-3 animate-fadeIn"
            >
              <p className="mb-2 text-xs opacity-75">{t('diceMenuHint')}</p>
              <div className="grid grid-cols-4 gap-2">
                {DICE_TYPES.map((d) => {
                  const n = countOf(d)
                  return (
                    <div
                      key={d}
                      className={`flex flex-col items-center rounded-lg border p-1 ${n ? 'border-accent bg-accent-soft' : 'border-line'}`}
                    >
                      <button
                        type="button"
                        onClick={() => add(d)}
                        disabled={dice.length >= POOL_MAX}
                        aria-label={t('diceAdd').replace('{die}', `D${d}`)}
                        className="w-full rounded-md py-1 text-sm font-bold hover:bg-accent-soft disabled:opacity-50"
                      >
                        D{d}
                      </button>
                      <div className="flex items-center gap-1 text-xs">
                        <button
                          type="button"
                          onClick={() => remove(d)}
                          disabled={!n}
                          aria-label={t('diceRemove').replace('{die}', `D${d}`)}
                          className="rounded p-0.5 hover:bg-accent-soft disabled:opacity-30"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-4 text-center font-semibold tabular-nums">{n}</span>
                        <button
                          type="button"
                          onClick={() => add(d)}
                          disabled={dice.length >= POOL_MAX}
                          aria-label={t('diceAdd').replace('{die}', `D${d}`)}
                          className="rounded p-0.5 hover:bg-accent-soft disabled:opacity-30"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                <span className="opacity-75">
                  {dice.length >= POOL_MAX ? t('diceMax').replace('{n}', String(POOL_MAX)) : ''}
                </span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  disabled={!dice.length}
                  className="ui-btn ui-btn-ghost !min-h-8 !px-2 text-xs"
                >
                  {t('diceClear')}
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleRollClick}
          className="ui-btn ui-btn-primary relative overflow-hidden !min-h-10 !px-4 !text-[15px] @md:!px-6"
          disabled={disabled || cooldown || (!lockedLabel && dice.length === 0)}
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

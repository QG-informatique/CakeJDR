'use client'

// Le modificateur d'une caractéristique. Au survol, au focus ou au toucher,
// une bulle dit d'où il vient : les règles de la table, l'équipement.

import { FC, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '@/lib/useT'
import { signedMod, withStat, checkStatLabel, type CheckStat } from '@/lib/checks'
import { statMod } from '@/lib/modifiers'
import type { Character } from '@/types/character'
import type { TranslationKey } from '@/lib/translations'
import { GAME_SYSTEMS, type GameSystem } from '@/lib/gameSystems'

type Props = {
  character: Character
  stat: CheckStat
  className?: string
  /** Système de la table ; hors d'une table, le narratif. */
  system?: GameSystem
}

const BUBBLE_W = 240

const ModBadge: FC<Props> = ({ character, stat, className = '', system = GAME_SYSTEMS.narratif }) => {
  const t = useT()
  const id = useId()
  const ref = useRef<HTMLButtonElement>(null)
  const [at, setAt] = useState<{ x: number; y: number; below: boolean } | null>(null)
  const { value, total, parts } = statMod(character, stat, system.id)
  const statName = t(checkStatLabel(stat) as TranslationKey)

  const show = () => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const x = Math.max(8, Math.min(window.innerWidth - BUBBLE_W - 8, r.left + r.width / 2 - BUBBLE_W / 2))
    const below = r.top < 190
    setAt({ x, y: below ? r.bottom + 6 : r.top - 6, below })
  }
  const hide = () => setAt(null)

  // La bulle est posée à l'écran : elle se ferme dès que la page défile.
  useEffect(() => {
    if (!at) return
    const close = () => setAt(null)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [at])

  const lines = parts.map((p) => ({
    value: p.value,
    label: p.kind === 'rules' ? t(p.label) : p.from || t('modEquipment'),
    note: p.kind === 'rules' ? `${statName} ${value} · ${t(p.detail)}` : p.from ? t('modEquipment') : '',
  }))

  return (
    <>
      <button
        ref={ref}
        type="button"
        onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
        onPointerLeave={(e) => e.pointerType === 'mouse' && hide()}
        onFocus={show}
        onBlur={hide}
        onClick={() => (at ? hide() : show())}
        aria-describedby={at ? id : undefined}
        className={`cursor-help rounded px-0.5 tabular-nums underline decoration-dotted decoration-from-font underline-offset-2 ${className}`}
      >
        {system.rollUnder ? `${total} %` : signedMod(total)}
      </button>
      {at && typeof document !== 'undefined' && createPortal(
        <div
          id={id}
          role="tooltip"
          style={{ left: at.x, top: at.y, width: BUBBLE_W, transform: at.below ? undefined : 'translateY(-100%)' }}
          className="ui-panel pointer-events-none fixed z-[80] flex flex-col gap-1.5 !bg-[var(--c-surface-deep)] px-3 py-2 text-xs normal-case tracking-normal shadow-xl"
        >
          <span className="font-semibold">{withStat(t('modSourcesOf'), statName)}</span>
          {lines.map((l, i) => (
            <span key={i} className="flex items-baseline gap-2">
              <span className="w-7 shrink-0 text-right font-bold tabular-nums">{signedMod(l.value)}</span>
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">{l.label}</span>
                {l.note && <span className="text-ink/60">{l.note}</span>}
              </span>
            </span>
          ))}
          {lines.length > 1 && (
            <span className="flex items-baseline gap-2 border-t border-[var(--c-panel-line)] pt-1.5">
              <span className="w-7 shrink-0 text-right font-bold tabular-nums">{signedMod(total)}</span>
              <span className="font-medium">Total</span>
            </span>
          )}
        </div>,
        document.body,
      )}
    </>
  )
}

export default ModBadge

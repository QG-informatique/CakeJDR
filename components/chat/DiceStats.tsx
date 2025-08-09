'use client'
import { useState, useRef, useEffect, FC } from 'react'
import { useT } from '@/lib/useT'

const SELECT_WIDTH = '140px'

// --- CustomSelect DA Import/Export ---
type CustomSelectProps = {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}
const CustomSelect: FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  disabled,
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [open])
  return (
    <div
      ref={ref}
      className="relative select-none"
      style={{ width: SELECT_WIDTH }}
    >
      <button
        type="button"
        disabled={disabled}
        className={`
          w-full px-3 py-1.5 rounded-xl font-semibold text-white/85 shadow
          bg-black/35 border border-white/10 transition
          hover:bg-black/50 hover:border-white/20
          disabled:opacity-60 backdrop-blur-md
          flex items-center justify-between
        `}
        style={{
          boxShadow: '0 2px 12px 0 #0007, 0 0 0 1px #fff1 inset',
          background:
            'linear-gradient(120deg,rgba(18,28,54,0.35) 60%,rgba(16,18,33,0.23) 100%)',
        }}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">
          {options.find((o) => o.value === value)?.label || ''}
        </span>
        <svg
          width="16"
          height="16"
          className="ml-2 opacity-70"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {open && (
        <div
          className="absolute z-30 left-0 w-full mt-1 rounded-xl bg-black/80 border border-white/10 shadow-2xl py-1 animate-fadeIn backdrop-blur-md"
          style={{
            background:
              'linear-gradient(120deg,rgba(18,28,54,0.91) 60%,rgba(16,18,33,0.77) 100%)',
          }}
          role="listbox"
        >
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              disabled={disabled}
              className={`
                w-full px-4 py-1.5 text-left text-sm font-semibold rounded
                text-white transition
                hover:bg-gray-800/80
                ${value === opt.value ? 'bg-gray-700/80' : ''}
              `}
              style={{
                background:
                  value === opt.value
                    ? 'linear-gradient(120deg,#23364aBB 60%,#131b2455 100%)'
                    : undefined,
              }}
              onClick={() => {
                setOpen(false)
                onChange(opt.value)
              }}
              role="option"
              aria-selected={value === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeInMenu 0.18s;
        }
        @keyframes fadeInMenu {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
// --- /CustomSelect ---

type Roll = { player: string; dice: number; result: number; ts?: number }
type Props = { history: Roll[] }

function computeStats(history: Roll[]) {
  const stats = new Map<string, {
    rolls: number
    crit: number
    fail: number
    dist: Map<number, number>
  }>()
  for (const h of history) {
    if (!stats.has(h.player)) {
      stats.set(h.player, { rolls: 0, crit: 0, fail: 0, dist: new Map() })
    }
    const s = stats.get(h.player)!
    s.rolls++
    if (h.result === 1) s.fail++
    if (h.result === h.dice) s.crit++
    s.dist.set(h.dice, (s.dist.get(h.dice) || 0) + 1)
  }
  return stats
}

export default function DiceStats({ history }: Props) {
  const t = useT()
  const STAT_OPTIONS = [
    { value: 'all', label: t('statAll') },
    { value: 'pct', label: t('statPct') },
  ]
  const TIME_OPTIONS = [
    { value: 'all', label: t('timeAll') },
    { value: '7d', label: t('time7d') },
    { value: '24h', label: t('time24h') },
  ]
  const [statType, setStatType] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<string>('all')
  let filtered = history
  if (timeRange !== 'all') {
    const now = Date.now()
    const limit = timeRange === '7d' ? 7 * 24 * 3600 * 1000 : 24 * 3600 * 1000
    filtered = history.filter((h) => !h.ts || now - h.ts <= limit)
  }
  const stats = computeStats(filtered)
  const players = Array.from(stats.keys())

  if (players.length === 0)
    return <div className="p-2 text-sm">{t('noRolls')}</div>

  let tableHead
  let tableRows

  if (statType === 'pct') {
    tableHead = (
      <tr className="bg-black/25 backdrop-blur-[1px] text-white border-b border-white/10">
        <th className="px-2 py-1">{t('player')}</th>
        <th className="px-2 py-1">% {t('crits')}</th>
        <th className="px-2 py-1">% {t('fails')}</th>
      </tr>
    )
    tableRows = players.map((player) => {
      const s = stats.get(player)!
      const critPct = s.rolls ? ((s.crit / s.rolls) * 100).toFixed(1) : '0'
      const failPct = s.rolls ? ((s.fail / s.rolls) * 100).toFixed(1) : '0'
      return (
        <tr key={player} className="border-b border-white/10">
          <td className="px-2 py-1 font-semibold">{player}</td>
          <td className="px-2 py-1 text-center">{critPct} %</td>
          <td className="px-2 py-1 text-center">{failPct} %</td>
        </tr>
      )
    })
  } else {
    // all
    tableHead = (
      <tr className="bg-black/25 backdrop-blur-[1px] text-white border-b border-white/10">
        <th className="px-2 py-1">{t('player')}</th>
        <th className="px-2 py-1">{t('rolls')}</th>
        <th className="px-2 py-1">{t('crits')}</th>
        <th className="px-2 py-1">{t('fails')}</th>
        <th className="px-2 py-1">{t('perDie')}</th>
      </tr>
    )
    tableRows = players.map((player) => {
      const s = stats.get(player)!
      return (
        <tr key={player} className="border-b border-white/10">
          <td className="px-2 py-1 font-semibold">{player}</td>
          <td className="px-2 py-1 text-center">{s.rolls}</td>
          <td className="px-2 py-1 text-center">{s.crit}</td>
          <td className="px-2 py-1 text-center">{s.fail}</td>
          <td className="px-2 py-1 text-sm">
            {Array.from(s.dist.entries())
              .map(([d, c]) => `D${d}:${c}`)
              .join(' ')}
          </td>
        </tr>
      )
    })
  }

  return (
    <div className="p-2 text-white">
      <div className="mb-2 flex items-center gap-2">
        <CustomSelect
          value={statType}
          onChange={setStatType}
          options={STAT_OPTIONS}
        />
        <CustomSelect
          value={timeRange}
          onChange={setTimeRange}
          options={TIME_OPTIONS}
        />
      </div>
      <table className="text-sm w-full text-left border-collapse">
        <thead>{tableHead}</thead>
        <tbody>{tableRows}</tbody>
      </table>
    </div>
  )
}

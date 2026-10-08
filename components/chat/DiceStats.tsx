'use client'
import { useState } from 'react'
import { Clover } from 'lucide-react'
import { useT } from '@/lib/useT'

type Roll = { player: string; dice: number; result: number; ts?: number }
type Props = { history: Roll[] }

type PlayerStats = {
  player: string
  rolls: number
  crit: number
  fail: number
  /** Chance en %, 50 = la moyenne attendue (voir `computeStats`). */
  luck: number
  favorite: number
}

const RANGES = { all: 0, '7d': 7 * 24 * 3600 * 1000, '24h': 24 * 3600 * 1000 } as const
type Range = keyof typeof RANGES

/**
 * Chaque dé compte pour sa place entre sa plus petite et sa plus grande face :
 * un 1 vaut 0 %, la face max 100 %. La moyenne de tous les dés d'un joueur dit
 * s'il tire au-dessus ou en dessous de ce que le hasard donnerait (50 %).
 */
function computeStats(history: Roll[]): PlayerStats[] {
  const byPlayer = new Map<string, { rolls: number; crit: number; fail: number; luckSum: number; luckN: number; dist: Map<number, number> }>()
  for (const h of history) {
    let s = byPlayer.get(h.player)
    if (!s) byPlayer.set(h.player, (s = { rolls: 0, crit: 0, fail: 0, luckSum: 0, luckN: 0, dist: new Map() }))
    s.rolls++
    if (h.result === 1) s.fail++
    if (h.result === h.dice) s.crit++
    if (h.dice > 1) {
      s.luckSum += (h.result - 1) / (h.dice - 1)
      s.luckN++
    }
    s.dist.set(h.dice, (s.dist.get(h.dice) || 0) + 1)
  }
  return Array.from(byPlayer, ([player, s]) => ({
    player,
    rolls: s.rolls,
    crit: s.crit,
    fail: s.fail,
    luck: s.luckN ? Math.round((s.luckSum / s.luckN) * 100) : 50,
    favorite: [...s.dist].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0,
  }))
}

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0)

export default function DiceStats({ history }: Props) {
  const t = useT()
  const [range, setRange] = useState<Range>('all')
  const [rangeNow, setRangeNow] = useState(() => Date.now())
  const filtered = range === 'all'
    ? history
    : history.filter((h) => !h.ts || rangeNow - h.ts <= RANGES[range])
  const stats = computeStats(filtered).sort((a, b) => b.luck - a.luck)
  const [first, second] = stats
  const luckiest = first && second && first.luck > second.luck ? first : null

  const ranges: { value: Range; label: string }[] = [
    { value: 'all', label: t('timeAll') },
    { value: '7d', label: t('time7d') },
    { value: '24h', label: t('time24h') },
  ]

  return (
    <div className="flex flex-col gap-2 p-2 text-ink">
      <div className="ui-seg" role="group" aria-label={t('diceStats')}>
        {ranges.map((r) => (
          <button
            key={r.value}
            aria-pressed={range === r.value}
            onClick={() => { setRange(r.value); setRangeNow(Date.now()) }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {stats.length === 0 ? (
        <p className="p-1 text-sm text-ink/60">{t('noRolls')}</p>
      ) : (
        <>
          {luckiest && (
            <p className="flex items-center gap-1.5 text-xs text-ink/75">
              <Clover size={14} className="text-emerald-400" />
              {t('statLuckiest').replace('{n}', luckiest.player)}
            </p>
          )}
          <ul className="flex flex-col gap-1.5">
            {stats.map((s) => {
              const mood = s.luck >= 55 ? 'statLucky' : s.luck <= 45 ? 'statUnlucky' : 'statAverage'
              return (
                <li key={s.player} className="ui-well flex flex-col gap-1.5 p-2 text-xs">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{s.player}</span>
                    <span className="shrink-0 text-ink/55">
                      {t('statDiceCount').replace('{n}', String(s.rolls))} · {t('statFavorite').replace('{d}', String(s.favorite))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2" title={t('statChanceHint')}>
                    <span className="w-14 shrink-0 text-ink/65">{t('statChance')}</span>
                    {/* Le trait du milieu marque la moyenne attendue (50 %). */}
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
                      <div
                        className={`h-full rounded-full ${s.luck >= 55 ? 'bg-emerald-400' : s.luck <= 45 ? 'bg-red-400' : 'bg-accent'}`}
                        style={{ width: `${s.luck}%` }}
                      />
                      <div className="absolute inset-y-0 left-1/2 w-px bg-ink/40" />
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-right font-semibold">
                      {s.luck} % <span className="font-normal text-ink/60">{t(mood)}</span>
                    </span>
                  </div>
                  <div className="flex gap-3 text-ink/70">
                    <span>{t('crits')} : <b className="text-ink">{s.crit}</b> ({pct(s.crit, s.rolls)} %)</span>
                    <span>{t('fails')} : <b className="text-ink">{s.fail}</b> ({pct(s.fail, s.rolls)} %)</span>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

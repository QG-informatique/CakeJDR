'use client'

import { useEffect, useMemo, useState } from 'react'
import { useStorage } from '@liveblocks/react'
import { useT } from '@/lib/useT'
import { checkStatLabel, withStat } from '@/lib/checks'
import type { SessionEvent } from '@/components/app/hooks/useEventLog'

/** Le bandeau suit l'apparition du chiffre sur le dé, puis reste quelques secondes. */
const DELAY_MS = 1000
const SHOW_MS = 6000

/**
 * Résultat du dernier test, annoncé à toute la table en haut du plateau.
 * La difficulté cachée n'apparaît qu'au MJ.
 */
export default function CheckBanner({ isGM }: { isGM: boolean }) {
  const t = useT()
  const events = useStorage((root) => root.events)
  const last = useMemo(() => {
    if (!events) return null
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const ev = events[i] as SessionEvent
      if (ev.kind === 'check' && ev.check) return ev
    }
    return null
  }, [events])

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!last) return
    const wait = [last.ts + DELAY_MS, last.ts + DELAY_MS + SHOW_MS].map((at) => at - Date.now()).filter((ms) => ms > 0)
    const timers = wait.map((ms) => window.setTimeout(() => setNow(Date.now()), ms + 50))
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [last])

  const from = (last?.ts ?? 0) + DELAY_MS
  if (!last?.check || now < from || now > from + SHOW_MS) return null
  const c = last.check
  const stat = t(checkStatLabel(c.stat))
  const line = withStat(t(c.success ? 'checkSuccessLine' : 'checkFailureLine').replace('{n}', last.player || '?'), stat)
  const showDc = c.showDc || isGM

  return (
    <div
      role="status"
      className={`ui-panel pointer-events-none absolute top-16 left-1/2 z-30 flex w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-col items-center gap-0.5 border-2 px-4 py-2 text-center shadow-lg animate-fadeIn ${
        c.success ? '!border-emerald-400/60' : '!border-red-400/60'
      }`}
    >
      <span className={`text-sm font-bold ${c.success ? 'text-emerald-300' : 'text-red-300'}`}>{line}</span>
      <span className="text-xs text-ink/70 tabular-nums">
        {c.total}
        {showDc && ` ${t('checkVs')} ${c.dc}`}
        {c.reason && ` · ${c.reason}`}
      </span>
    </div>
  )
}

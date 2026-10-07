'use client'

import { useSelf, useStorage } from '@liveblocks/react'
import { Target } from 'lucide-react'
import { useT } from '@/lib/useT'
import { checkStatLabel, signedMod, withStat } from '@/lib/checks'

type Props = {
  onRoll: (id: string) => void
  disabled: boolean
}

/** Carte du joueur visé par un test du MJ, au-dessus du lanceur de dés. */
export default function CheckPrompt({ onRoll, disabled }: Props) {
  const t = useT()
  const selfId = useSelf((s) => s.id)
  const checks = useStorage((root) => root.checks)
  const mine = checks && selfId
    ? Array.from(checks.values()).filter((c) => c.targetId === selfId).sort((a, b) => a.createdAt - b.createdAt)
    : []
  const check = mine[0]
  if (!check) return null
  const stat = t(checkStatLabel(check.stat))

  return (
    <div className="ui-panel absolute bottom-3 left-1/2 z-30 flex w-[min(22rem,calc(100%-1.5rem))] -translate-x-1/2 flex-col gap-2 p-3 shadow-lg animate-fadeIn">
      <div className="flex items-center gap-2">
        <Target size={16} className="shrink-0 text-gm" aria-hidden />
        <span className="text-sm font-semibold">{withStat(t('checkPromptTitle'), stat)}</span>
      </div>
      {check.reason && <p className="text-sm text-ink/80">{check.reason}</p>}
      <p className="text-xs text-ink/60">
        D20 {signedMod(check.mod)} ·{' '}
        {check.showDc && check.dc != null
          ? t('checkPromptDc').replace('{n}', String(check.dc))
          : t('checkPromptDcHidden')}
        {mine.length > 1 && ` · ${t('checkPromptMore').replace('{n}', String(mine.length - 1))}`}
      </p>
      <button onClick={() => onRoll(check.id)} disabled={disabled} className="ui-btn ui-btn-primary">
        {t('checkRoll')}
      </button>
    </div>
  )
}

'use client'

import { useMemo } from 'react'
import { Clock } from 'lucide-react'
import { useT } from '@/lib/useT'
import { estimateDuration, formatMinutes, type Adventure } from '@/lib/autoGm'

/** Durée estimée d'une aventure : la moyenne, puis l'écart selon les choix. */
export default function AdventureDuration({ adventure }: { adventure: Adventure }) {
  const t = useT()
  const d = useMemo(() => estimateDuration(adventure), [adventure])
  const min = formatMinutes(d.min)
  const max = formatMinutes(d.max)
  return (
    <p className="flex items-center gap-1.5 text-xs text-ink/60">
      <Clock size={12} className="shrink-0" aria-hidden />
      <span>
        {t('autoGmDuration').replace('{n}', formatMinutes(d.average))}
        {min !== max && ` ${t('autoGmDurationRange').replace('{a}', min).replace('{b}', max)}`}
      </span>
    </p>
  )
}

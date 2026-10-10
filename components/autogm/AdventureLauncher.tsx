'use client'

import { useState } from 'react'
import { useStorage } from '@liveblocks/react'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { ADVENTURES, adventureIn } from '@/lib/autoGm'
import type { AutoGmMode } from '@/lib/autoGm/types'
import { useStartAdventure } from './useStartAdventure'
import AdventureDuration from './AdventureDuration'

/**
 * Panneau du MJ : lancer une aventure toute prête dans la table. Le MJ la
 * mène lui-même (il tranche les égalités de vote) ou la laisse au MJ
 * automatique.
 */
export default function AdventureLauncher() {
  const t = useT()
  const { lang } = useLanguage()
  const running = useStorage((root) => root.autoGm?.adventure ?? null)
  const start = useStartAdventure()
  const ids = Object.keys(ADVENTURES)
  const [adventure, setAdventure] = useState(ids[0] ?? '')
  const [mode, setMode] = useState<AutoGmMode>('gm')
  const current = running ? adventureIn(running, lang) : undefined
  const chosen = adventureIn(adventure, lang)

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="ui-label !text-[10px]">{t('autoGmLaunchTitle')}</h3>
      {current ? (
        <p className="text-xs text-ink/65">{t('autoGmRunning').replace('{n}', current.title)}</p>
      ) : (
        <>
          <select
            value={adventure}
            onChange={(e) => setAdventure(e.target.value)}
            className="ui-input w-full min-w-0 !min-h-8 text-sm"
            aria-label={t('autoGmLaunchTitle')}
          >
            {ids.map((id) => (
              <option key={id} value={id}>{adventureIn(id, lang)!.title}</option>
            ))}
          </select>
          {chosen && (
            <>
              <p className="text-xs italic text-ink/65">{chosen.pitch}</p>
              <AdventureDuration adventure={chosen} />
            </>
          )}
          <div className="ui-seg" role="group" aria-label={t('autoGmLaunchTitle')}>
            <button aria-pressed={mode === 'gm'} onClick={() => setMode('gm')}>{t('autoGmModeGm')}</button>
            <button aria-pressed={mode === 'auto'} onClick={() => setMode('auto')}>{t('autoGmModeAuto')}</button>
          </div>
          <p className="text-xs text-ink/55">
            {t(mode === 'gm' ? 'autoGmModeGmHint' : 'autoGmModeAutoHint')} {t('autoGmBoardWarning')}
          </p>
          <button onClick={() => start(adventure, mode)} disabled={!adventure} className="ui-btn ui-btn-primary !min-h-8 text-sm">
            {t('autoGmStart')}
          </button>
        </>
      )}
    </section>
  )
}

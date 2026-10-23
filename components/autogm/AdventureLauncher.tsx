'use client'

import { useState } from 'react'
import { useMutation, useStorage } from '@liveblocks/react'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { ADVENTURES, adventureIn } from '@/lib/autoGm'
import type { Adventure, AutoGmMode } from '@/lib/autoGm/types'
import { parseCampaign } from '@/lib/autoGm/custom'
import { useMyCreations } from '@/lib/creationsApi'
import { useStartAdventure } from './useStartAdventure'
import { useRoomCampaign } from './useRoomCampaign'
import AdventureDuration from './AdventureDuration'

/** Valeur du choix pour une campagne de l'atelier (pas encore dans la salle). */
const MINE = 'mine:'

/**
 * Panneau du MJ : lancer une aventure toute prête dans la table. Le MJ la
 * mène lui-même (il tranche les égalités de vote) ou la laisse au MJ
 * automatique. Les campagnes de son atelier sont copiées dans la salle au
 * lancement (`customAdventure`), à la place de celle qui y était.
 */
export default function AdventureLauncher() {
  const t = useT()
  const { lang } = useLanguage()
  const running = useStorage((root) => root.autoGm?.adventure ?? null)
  const start = useStartAdventure()
  // La campagne du MJ copiée dans la salle passe en tête de liste.
  const custom = useRoomCampaign()
  const ids = [...(custom ? [custom.id] : []), ...Object.keys(ADVENTURES)]
  const mine = useMyCreations('campaign')
  const [picked, setAdventure] = useState('')
  const mineId = picked.startsWith(MINE) ? picked.slice(MINE.length) : ''
  const fromAtelier = mineId ? parseCampaign(mine.items.find((c) => c.id === mineId)?.data) : null
  const adventure = fromAtelier ? picked : ids.includes(picked) ? picked : (ids[0] ?? '')
  const [mode, setMode] = useState<AutoGmMode>('gm')
  const current = running ? adventureIn(running, lang, custom) : undefined
  const chosen = fromAtelier ?? adventureIn(adventure, lang, custom)
  const loadCampaign = useMutation(({ storage }, adv: Adventure) => {
    storage.set('customAdventure', adv as never)
  }, [])
  const launch = () => {
    if (!fromAtelier) return start(adventure, mode)
    loadCampaign(fromAtelier)
    start(fromAtelier.id, mode)
  }

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
              <option key={id} value={id}>{adventureIn(id, lang, custom)!.title}</option>
            ))}
            {mine.items.length > 0 && (
              <optgroup label={t('roomMyCampaigns')}>
                {mine.items.map((c) => (
                  <option key={c.id} value={MINE + c.id}>{c.name}</option>
                ))}
              </optgroup>
            )}
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
          <button onClick={launch} disabled={!adventure} className="ui-btn ui-btn-primary !min-h-8 text-sm">
            {t('autoGmStart')}
          </button>
        </>
      )}
    </section>
  )
}

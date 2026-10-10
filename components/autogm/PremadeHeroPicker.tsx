'use client'

import { useState } from 'react'
import { Dices, UserRound } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { libraryUrl } from '@/lib/library'
import { premadeHeroes, type PremadeHero } from '@/lib/premadeHeroes'
import GuidedHeroCreator from './GuidedHeroCreator'

/** Héros tout prêts, pour le joueur qui arrive sans fiche : un clic et il joue. */
export default function PremadeHeroPicker({ onPick }: { onPick: (hero: PremadeHero) => void }) {
  const t = useT()
  const { lang } = useLanguage()
  const [later, setLater] = useState(false)
  const [create, setCreate] = useState(false)
  if (later) return null
  if (create) return <GuidedHeroCreator onDone={onPick} onBack={() => setCreate(false)} />
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gm/40 p-2.5">
      <div className="flex items-center gap-2">
        <UserRound size={14} className="shrink-0 text-gm" aria-hidden />
        <b className="flex-1 text-sm">{t('autoGmPickHero')}</b>
        <button onClick={() => setLater(true)} className="ui-btn ui-btn-ghost !min-h-6 !px-1.5 text-xs text-ink/55">
          {t('autoGmPickHeroLater')}
        </button>
      </div>
      <p className="text-xs text-ink/70">{t('autoGmPickHeroHint')}</p>
      <ul className="grid grid-cols-2 gap-1.5">
        {premadeHeroes(lang).map((hero) => (
          <li key={hero.image}>
            <button
              onClick={() => onPick(hero)}
              title={hero.hook}
              className="flex w-full items-center gap-2 rounded-lg border border-[var(--c-panel-line)] p-1.5 text-left transition hover:border-gm/60"
            >
              <img
                src={libraryUrl('portraits', hero.image, true)}
                alt=""
                className="h-10 w-10 shrink-0 rounded-md object-cover"
              />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{hero.nom}</span>
                <span className="block truncate text-[11px] text-ink/60">
                  {hero.race} · {hero.classe}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => setCreate(true)} className="ui-btn">
        <Dices size={14} aria-hidden /> {t('createOffer')}
      </button>
    </div>
  )
}

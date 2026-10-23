'use client'

import { useState } from 'react'
import { Dices, UserRound } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { libraryUrl } from '@/lib/library'
import type { Character } from '@/types/character'
import { premadeHeroes, type PremadeHero } from '@/lib/premadeHeroes'
import { backgroundOf } from '@/lib/backgrounds'
import GuidedHeroCreator from './GuidedHeroCreator'

/** Héros tout prêts, pour le joueur qui arrive sans fiche : un clic et il joue. */
export default function PremadeHeroPicker({
  onPick,
  onRoll,
  onLater,
  own = [],
  onOwn,
}: {
  onPick: (hero: PremadeHero) => void
  /** Mes fiches déjà faites, quand la salle les accepte. */
  own?: Character[]
  onOwn?: (char: Character) => void
  onRoll: () => void
  /** « Plus tard » : le joueur regarde d'abord, sans héros. */
  onLater: () => void
}) {
  const t = useT()
  const { lang } = useLanguage()
  const [create, setCreate] = useState(false)
  if (create) return <GuidedHeroCreator onDone={onPick} onBack={() => setCreate(false)} onRoll={onRoll} />
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gm/40 p-2.5">
      <div className="flex items-center gap-2">
        <UserRound size={14} className="shrink-0 text-gm" aria-hidden />
        <b className="flex-1 text-sm">{t('autoGmPickHero')}</b>
        <button onClick={onLater} className="ui-btn ui-btn-ghost !min-h-6 !px-1.5 text-xs text-ink/55">
          {t('autoGmPickHeroLater')}
        </button>
      </div>
      <p className="text-xs text-ink/70">{t(own.length && onOwn ? 'autoGmPickHeroOwnHint' : 'autoGmPickHeroHint')}</p>
      <ul className="grid grid-cols-2 gap-1.5">
        {premadeHeroes(lang).map((hero) => (
          <li key={hero.image}>
            <button
              onClick={() => onPick(hero)}
              title={[hero.hook, backgroundOf(hero.historique, lang)?.nom].filter(Boolean).join(' · ')}
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
      {own.length > 0 && onOwn && (
        <>
          <b className="mt-1 text-xs text-ink/70">{t('autoGmOwnHeroes')}</b>
          <ul className="flex flex-col gap-1">
            {own.map((char) => (
              <li key={`${char.owner ?? ''}:${char.id}`}>
                <button
                  onClick={() => onOwn(char)}
                  className="flex w-full items-center gap-2 rounded-lg border border-[var(--c-panel-line)] p-1.5 text-left transition hover:border-gm/60"
                >
                  {char.portrait ? (
                    <img src={char.portrait} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
                  ) : (
                    <UserRound size={18} className="mx-1.5 shrink-0 text-ink/50" aria-hidden />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{char.nom}</span>
                    <span className="block truncate text-[11px] text-ink/60">
                      {[char.race, char.classe, t('autoGmOwnLevel').replace('{n}', String(char.niveau))].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

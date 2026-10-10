'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSelf, useStorage } from '@liveblocks/react'
import { ArrowLeft, Dices } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { libraryUrl } from '@/lib/library'
import { useGameSystem } from '@/lib/roomSettings'
import { postCheck } from '@/components/checks/postCheck'
import {
  HERO_PORTRAITS,
  createdHero,
  heroClasses,
  peoples,
  startingHp,
  statDice,
  statValue,
  type HeroClass,
  type People,
} from '@/lib/heroCreation'
import type { PremadeHero } from '@/lib/premadeHeroes'

type Step = 'name' | 'people' | 'class' | 'stats' | 'portrait' | 'ready'

/**
 * Création d'un héros avec le MJ automatique : il pose les questions, puis
 * fait lancer sur la table les dés de chaque caractéristique, un jet signé
 * comme ceux qu'il demande en jeu (`app/api/check`).
 */
export default function GuidedHeroCreator({ onDone, onBack }: { onDone: (hero: PremadeHero) => void; onBack: () => void }) {
  const t = useT()
  const { lang } = useLanguage()
  const system = useGameSystem()
  const { id: roomId } = useParams<{ id: string }>()
  const selfId = useSelf((me) => me.id)
  const events = useStorage((root) => root.events)
  const pending = useStorage((root) => root.checks)

  const [step, setStep] = useState<Step>('name')
  const [nom, setNom] = useState('')
  const [people, setPeople] = useState<People | null>(null)
  const [heroClass, setHeroClass] = useState<HeroClass | null>(null)
  const [image, setImage] = useState<string | null>(null)
  // Faces posées pour chaque caractéristique, dans l'ordre du système.
  const [faces, setFaces] = useState<Record<string, number[]>>({})
  const [asking, setAsking] = useState<{ stat: string; id: string } | null>(null)
  const [askFailed, setAskFailed] = useState(false)

  const current = step === 'stats' ? system.stats.find((s) => !faces[s.key]) : undefined
  const stats = Object.fromEntries(
    Object.entries(faces).map(([key, f]) => [key, statValue(statDice(system.id, key), f)]),
  )

  // Le MJ demande le jet de la caractéristique suivante, une seule fois.
  const asked = useRef('')
  useEffect(() => {
    if (!current || asking || askFailed || !selfId || asked.current === current.key) return
    asked.current = current.key
    const dice = statDice(system.id, current.key)
    postCheck(roomId, {
      action: 'ask',
      type: 'rolls',
      creation: true,
      targetId: selfId,
      targetName: nom,
      dice: 6,
      count: dice.count,
      levelUp: false,
      reason: t('createRollReason').replace('{name}', nom).replace('{stat}', t(current.label)),
    })
      .then((d) => {
        if (d?.id) setAsking({ stat: current.key, id: d.id })
        else throw new Error('no id')
      })
      .catch(() => {
        asked.current = ''
        setAskFailed(true)
      })
  }, [current, asking, askFailed, selfId, system.id, roomId, nom, t])

  // Les dés posés : la valeur entre dans la fiche, on passe à la suivante.
  const seen = useRef(false)
  useEffect(() => {
    if (!asking) return
    const result = events?.find((e) => e.kind === 'rolls' && e.requestId === asking.id)
    if (result?.rolls) {
      const rolled = result.rolls.results
      const wait = Math.max(0, result.ts - Date.now())
      const timer = setTimeout(() => {
        setFaces((f) => ({ ...f, [asking.stat]: rolled }))
        setAsking(null)
        seen.current = false
      }, wait)
      return () => clearTimeout(timer)
    }
    // Demande retirée sans résultat (annulée par le MJ) : on la redemande.
    if (pending?.has(asking.id)) seen.current = true
    else if (seen.current) {
      seen.current = false
      asked.current = ''
      setAsking(null)
    }
  }, [asking, events, pending])

  const mjLine = (key: Parameters<typeof t>[0]) => <p className="text-sm italic text-ink/85">{t(key)}</p>
  const choice = (active: boolean) =>
    `flex w-full flex-col rounded-lg border px-2.5 py-1.5 text-left transition ${
      active ? 'border-gm bg-[color-mix(in_srgb,var(--c-panel)_80%,var(--c-gm))]' : 'border-[var(--c-panel-line)] hover:border-gm/60'
    }`
  const diceRule = (key: string) => {
    const d = statDice(system.id, key)
    return `${d.count} D6${d.keep < d.count ? t('createKeepBest').replace('{n}', String(d.keep)) : ''}${d.bonus ? ` + ${d.bonus}` : ''}`
  }
  const statList = (
    <ul className="grid grid-cols-2 gap-1 text-xs">
      {system.stats.map((s) => (
        <li key={s.key} className={`flex justify-between rounded-md px-2 py-1 ${current?.key === s.key ? 'bg-[color-mix(in_srgb,var(--c-panel)_80%,var(--c-gm))]' : ''}`}>
          <span className="text-ink/70">{t(s.label)}</span>
          <b>{faces[s.key] ? stats[s.key] : '–'}</b>
        </li>
      ))}
    </ul>
  )

  let content
  if (step === 'name') {
    content = (
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (nom.trim()) {
            setNom(nom.trim())
            setStep('people')
          }
        }}
      >
        {mjLine('createAskName')}
        <input
          value={nom}
          onChange={(e) => setNom(e.target.value.slice(0, 60))}
          placeholder={t('createNamePlaceholder')}
          className="ui-input"
        />
        <button type="submit" disabled={!nom.trim()} className="ui-btn ui-btn-primary">
          {t('createNext')}
        </button>
      </form>
    )
  } else if (step === 'people') {
    content = (
      <div className="flex flex-col gap-2">
        {mjLine('createAskPeople')}
        <ul className="flex flex-col gap-1">
          {peoples(lang).map((p) => (
            <li key={p.id}>
              <button
                onClick={() => {
                  setPeople(p)
                  setStep('class')
                }}
                className={choice(people?.id === p.id)}
              >
                <span className="text-sm font-semibold">{p.nom}</span>
                <span className="text-xs text-ink/65">{p.capacite}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  } else if (step === 'class') {
    content = (
      <div className="flex flex-col gap-2">
        {mjLine('createAskClass')}
        <ul className="flex flex-col gap-1">
          {heroClasses(lang).map((c) => (
            <li key={c.id}>
              <button
                onClick={() => {
                  setHeroClass(c)
                  setStep('stats')
                }}
                className={choice(heroClass?.id === c.id)}
              >
                <span className="text-sm font-semibold">{c.nom}</span>
                <span className="text-xs text-ink/65">{c.hook}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  } else if (step === 'stats') {
    content = (
      <div className="flex flex-col gap-2">
        {mjLine('createAskStats')}
        {statList}
        {current ? (
          <p className="flex items-center gap-1.5 text-xs text-ink/70">
            <Dices size={13} className="shrink-0 text-gm" aria-hidden />
            <span>
              <b>{t(current.label)}</b> · {diceRule(current.key)} · {t('createRollNow')}
            </span>
          </p>
        ) : (
          <button onClick={() => setStep('portrait')} className="ui-btn ui-btn-primary">
            {t('createNext')}
          </button>
        )}
        {askFailed && (
          <p className="flex items-center gap-2 text-xs text-amber-300">
            {t('createAskFailed')}
            <button onClick={() => setAskFailed(false)} className="ui-btn ui-btn-ghost !min-h-6 !px-1.5 text-xs">
              {t('createRetry')}
            </button>
          </p>
        )}
      </div>
    )
  } else if (step === 'portrait') {
    // Les portraits de la classe d'abord.
    const first = heroClass?.portraits ?? []
    const ordered = [...first, ...HERO_PORTRAITS.filter((p) => !first.includes(p))]
    content = (
      <div className="flex flex-col gap-2">
        {mjLine('createAskPortrait')}
        <ul className="grid grid-cols-5 gap-1.5">
          {ordered.map((p) => (
            <li key={p}>
              <button
                onClick={() => {
                  setImage(p)
                  setStep('ready')
                }}
                className={`block overflow-hidden rounded-md border-2 transition ${image === p ? 'border-gm' : 'border-transparent hover:border-gm/60'}`}
              >
                <img src={libraryUrl('portraits', p, true)} alt="" className="aspect-square w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  } else if (people && heroClass && image) {
    content = (
      <div className="flex flex-col gap-2">
        {mjLine('createReady')}
        <div className="flex items-center gap-2.5">
          <img src={libraryUrl('portraits', image, true)} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{nom}</p>
            <p className="text-xs text-ink/65">
              {people.nom} · {heroClass.nom} · {t('hp')} {startingHp(system.id, heroClass, stats)}
            </p>
          </div>
        </div>
        {statList}
        <button
          onClick={() => onDone(createdHero(system.id, { nom, people, heroClass, image, stats }))}
          className="ui-btn ui-btn-primary"
        >
          {t('createEnter')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gm/40 p-2.5">
      <div className="flex items-center gap-2">
        <b className="flex-1 text-sm">{t('createTitle')}</b>
        {!asking && (
          <button onClick={onBack} className="ui-btn ui-btn-ghost !min-h-6 !px-1.5 text-xs text-ink/55">
            <ArrowLeft size={12} /> {t('createBack')}
          </button>
        )}
      </div>
      {content}
    </div>
  )
}

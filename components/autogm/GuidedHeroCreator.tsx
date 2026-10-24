'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSelf, useStorage } from '@liveblocks/react'
import { ArrowLeft, Dices, Upload } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { useGameSystem } from '@/lib/roomSettings'
import { postCheck } from '@/components/checks/postCheck'
import { extractUploadErrorInfo, uploadImageToCloudinary } from '@/lib/uploadImage'
import { BACKGROUND_BONUS, backgrounds, type Background } from '@/lib/backgrounds'
import {
  assignRolls,
  classPriorities,
  createdHero,
  heroClasses,
  peoples,
  pooledStats,
  portraitSrc,
  portraitsFor,
  startStats,
  startingHp,
  statDice,
  statValue,
  type Gender,
  type HeroClass,
  type People,
  type StatDice,
} from '@/lib/heroCreation'
import type { PremadeHero } from '@/lib/premadeHeroes'

type Step = 'name' | 'people' | 'gender' | 'class' | 'background' | 'stats' | 'portrait' | 'ready'

/** Jets mis en commun (narratif et Fantasy 5E) : un par caractéristique. */

/** Les dés d'un jet, du plus fort au plus faible ; ceux qui ne comptent pas sont barrés. */
function Faces({ dice, faces }: { dice: StatDice; faces: readonly number[] }) {
  const sorted = [...faces].sort((a, b) => b - a)
  return (
    <span className="inline-flex gap-0.5 font-mono text-[0.7rem] text-ink/55">
      {sorted.map((f, i) => (
        <span key={i} className={i >= dice.keep ? 'line-through opacity-60' : ''}>{f}</span>
      ))}
      {dice.bonus ? <span>+{dice.bonus}</span> : null}
    </span>
  )
}

/**
 * Création d'un héros avec le MJ automatique : il pose les questions, puis
 * fait lancer sur la table les dés des caractéristiques, un jet signé comme
 * ceux qu'il demande en jeu (`app/api/check`).
 */
export default function GuidedHeroCreator({
  onDone,
  onBack,
  onRoll,
}: {
  onDone: (hero: PremadeHero) => void
  onBack: () => void
  /** Lance les dés de la table, verrouillés sur la demande qui m'attend. */
  onRoll: () => void
}) {
  const t = useT()
  const { lang } = useLanguage()
  const system = useGameSystem()
  const { id: roomId } = useParams<{ id: string }>()
  const selfId = useSelf((me) => me.id)
  const events = useStorage((root) => root.events)
  const pending = useStorage((root) => root.checks)
  const pooled = pooledStats(system)
  // « Valeur de départ » : rien à lancer, la fiche part des valeurs du système.
  const fixed = startStats(system)

  const [step, setStep] = useState<Step>('name')
  const [nom, setNom] = useState('')
  const [people, setPeople] = useState<People | null>(null)
  const [gender, setGender] = useState<Gender | null>(null)
  const [heroClass, setHeroClass] = useState<HeroClass | null>(null)
  const [background, setBackground] = useState<Background | null>(null)
  const [image, setImage] = useState<string | null>(null)
  // d100 : faces posées pour chaque caractéristique.
  const [faces, setFaces] = useState<Record<string, number[]>>({})
  // Narratif et 5E : les six jets, dans l'ordre où ils sont tombés, et la
  // caractéristique de chacun quand le joueur en a échangé.
  const [rolls, setRolls] = useState<number[][]>([])
  const [swapped, setSwapped] = useState<string[] | null>(null)
  const [swapFrom, setSwapFrom] = useState<string | null>(null)
  const [asking, setAsking] = useState<{ key: string; id: string } | null>(null)
  const [askFailed, setAskFailed] = useState(false)
  // La demande dont les dés viennent d'être lancés : un second clic pendant
  // que les dés roulent relancerait, et un seul des deux jets compterait.
  const [thrown, setThrown] = useState('')
  const [allPortraits, setAllPortraits] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const poolDice = statDice(system, system.stats[0]?.key ?? 'force')
  // Un jet par caractéristique du système (six au narratif).
  const POOL_SIZE = system.stats.length
  // Le jet attendu : le prochain des six, ou la prochaine caractéristique.
  const current: { key: string; label: string; dice: StatDice } | undefined =
    step !== 'stats' || fixed
      ? undefined
      : pooled
        ? rolls.length < POOL_SIZE
          ? { key: `#${rolls.length}`, label: t('createRollN').replace('{n}', String(rolls.length + 1)).replace('{m}', String(POOL_SIZE)), dice: poolDice }
          : undefined
        : (() => {
            const s = system.stats.find((x) => !faces[x.key])
            return s ? { key: s.key, label: t(s.label), dice: statDice(system, s.key) } : undefined
          })()

  // Les six jets placés : par le MJ selon la classe, ou par le joueur.
  const order = pooled && rolls.length === POOL_SIZE
    ? swapped ?? assignRolls(rolls.map((f) => statValue(poolDice, f)), classPriorities(system, heroClass?.priorites))
    : null
  const statFaces: Record<string, number[]> = order ? Object.fromEntries(order.map((k, i) => [k, rolls[i] ?? []])) : faces
  const stats = fixed ?? Object.fromEntries(
    Object.entries(statFaces).map(([key, f]) => [key, statValue(statDice(system, key), f)]),
  )

  // La demande est arrivée dans la liste partagée, et c'est la première qui
  // m'attend : les dés de la table sont alors les siens.
  const listed = !!asking && !!pending?.has(asking.id)
  const mine = pending && selfId
    ? Array.from(pending.values()).filter((c) => c.targetId === selfId).sort((a, b) => a.createdAt - b.createdAt)
    : []
  const myTurn = listed && mine[0]?.id === asking?.id
  const rolling = !!asking && (thrown === asking.id || !!events?.some((e) => e.kind === 'rolls' && e.requestId === asking.id))

  // Le MJ demande le jet suivant, une seule fois.
  const asked = useRef('')
  const askKey = current?.key
  const askLabel = current?.label ?? ''
  const askCount = current?.dice.count ?? 0
  useEffect(() => {
    if (!askKey || asking || askFailed || !selfId || asked.current === askKey) return
    asked.current = askKey
    postCheck(roomId, {
      action: 'ask',
      type: 'rolls',
      creation: true,
      targetId: selfId,
      targetName: nom,
      dice: 6,
      count: askCount,
      levelUp: false,
      reason: t('createRollReason').replace('{name}', nom).replace('{stat}', askLabel),
    })
      .then((d) => {
        if (d?.id) setAsking({ key: askKey, id: d.id })
        else throw new Error('no id')
      })
      .catch(() => {
        asked.current = ''
        setAskFailed(true)
      })
  }, [askKey, askLabel, askCount, asking, askFailed, selfId, roomId, nom, t])

  // Les dés posés : le jet est gardé, on passe au suivant.
  const seen = useRef(false)
  useEffect(() => {
    if (!asking) return
    const result = events?.find((e) => e.kind === 'rolls' && e.requestId === asking.id)
    if (result?.rolls) {
      const rolled = result.rolls.results
      const wait = Math.max(0, result.ts - Date.now())
      const timer = setTimeout(() => {
        if (pooled) setRolls((r) => [...r, rolled])
        else setFaces((f) => ({ ...f, [asking.key]: rolled }))
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
  }, [asking, events, pending, pooled])

  // Des dés qui n'ont jamais roulé (lancer raté) : le bouton revient.
  useEffect(() => {
    if (!thrown) return
    const timer = setTimeout(() => setThrown(''), 10_000)
    return () => clearTimeout(timer)
  }, [thrown])

  // Deux caractéristiques touchées l'une après l'autre échangent leurs jets.
  const swap = (key: string) => {
    if (!order) return
    if (!swapFrom || swapFrom === key) {
      setSwapFrom(swapFrom === key ? null : key)
      return
    }
    const next = [...order]
    const a = next.indexOf(swapFrom)
    const b = next.indexOf(key)
    next[a] = key
    next[b] = swapFrom
    setSwapped(next)
    setSwapFrom(null)
  }

  const upload = async (file: File) => {
    setUploadError('')
    setUploading(true)
    try {
      const res = await uploadImageToCloudinary(file)
      setImage(res.deliveryUrl || res.url)
      setStep('ready')
    } catch (e) {
      const info = extractUploadErrorInfo(e)
      setUploadError(info.code === 'SIGN_IN_REQUIRED' ? t('portraitUploadSignIn') : info.userMessage)
    } finally {
      setUploading(false)
    }
  }

  const mjLine = (key: Parameters<typeof t>[0]) => <p className="text-sm italic text-ink/85">{t(key)}</p>
  const choice = (active: boolean) =>
    `flex w-full flex-col rounded-lg border px-2.5 py-1.5 text-left transition ${
      active ? 'border-gm bg-[color-mix(in_srgb,var(--c-panel)_80%,var(--c-gm))]' : 'border-[var(--c-panel-line)] hover:border-gm/60'
    }`
  const highlight = 'bg-[color-mix(in_srgb,var(--c-panel)_80%,var(--c-gm))]'
  const diceRule = (d: StatDice) =>
    `${d.count} D6${d.keep < d.count ? t('createKeepBest').replace('{n}', String(d.keep)) : ''}${d.bonus ? ` + ${d.bonus}` : ''}${d.times ? ` × ${d.times}` : ''}`
  const statList = (canSwap: boolean) => (
    <ul className="grid grid-cols-2 gap-1 text-xs">
      {system.stats.map((s) => {
        const f = statFaces[s.key]
        const inner = (
          <>
            <span className="text-ink/70">{t(s.label)}</span>
            <span className="flex items-baseline gap-1.5">
              {f && <Faces dice={statDice(system, s.key)} faces={f} />}
              <b>{stats[s.key] ?? '–'}</b>
            </span>
          </>
        )
        const active = swapFrom === s.key || current?.key === s.key
        return (
          <li key={s.key}>
            {canSwap ? (
              <button
                onClick={() => swap(s.key)}
                aria-pressed={swapFrom === s.key}
                className={`flex w-full justify-between rounded-md border px-2 py-1 ${swapFrom === s.key ? 'border-gm' : 'border-[var(--c-panel-line)] hover:border-gm/60'} ${active ? highlight : ''}`}
              >
                {inner}
              </button>
            ) : (
              <div className={`flex justify-between rounded-md px-2 py-1 ${active ? highlight : ''}`}>{inner}</div>
            )}
          </li>
        )
      })}
    </ul>
  )

  const rollButton = current && (
    <>
      <p className="flex items-center gap-1.5 text-xs text-ink/70">
        <Dices size={13} className="shrink-0 text-gm" aria-hidden />
        <span>
          <b>{current.label}</b> · {diceRule(current.dice)}
        </span>
      </p>
      {/* Toujours un bouton ou une consigne : on sait quels dés lancer, même après un raté. */}
      {askFailed ? (
        <>
          <p className="text-xs text-amber-300">{t('createAskFailed')}</p>
          <button onClick={() => setAskFailed(false)} className="ui-btn ui-btn-primary">
            {t('createRetry')}
          </button>
        </>
      ) : myTurn && !rolling ? (
        <button
          onClick={() => {
            if (asking) setThrown(asking.id)
            onRoll()
          }}
          className="ui-btn ui-btn-primary"
        >
          <Dices size={15} aria-hidden />
          {t('createRollButton').replace('{dice}', `${current.dice.count} D6`)}
        </button>
      ) : listed && !rolling ? (
        <p className="text-xs text-amber-300">{t('createOtherRollFirst')}</p>
      ) : (
        <button disabled className="ui-btn ui-btn-primary">
          {t(rolling ? 'createRolling' : 'createPreparing')}
        </button>
      )}
    </>
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
                  setStep('gender')
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
  } else if (step === 'gender') {
    content = (
      <div className="flex flex-col gap-2">
        {mjLine('createAskGender')}
        <div className="grid grid-cols-2 gap-1.5">
          {(['homme', 'femme'] as const).map((g) => (
            <button
              key={g}
              onClick={() => {
                setGender(g)
                setStep('class')
              }}
              className={choice(gender === g)}
            >
              <span className="text-sm font-semibold">{t(g === 'homme' ? 'createMan' : 'createWoman')}</span>
            </button>
          ))}
        </div>
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
                  setStep('background')
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
  } else if (step === 'background') {
    content = (
      <div className="flex flex-col gap-2">
        {mjLine('createAskBackground')}
        <ul className="flex flex-col gap-1">
          {backgrounds(lang).map((b) => (
            <li key={b.id}>
              <button
                onClick={() => {
                  setBackground(b)
                  setStep('stats')
                }}
                className={choice(background?.id === b.id)}
              >
                <span className="text-sm font-semibold">{b.nom}</span>
                <span className="text-xs text-ink/65">{b.passe}</span>
                <span className="text-xs text-gm">
                  {t('createBackgroundBonus').replace('{n}', String(BACKGROUND_BONUS)).replace('{what}', b.domaine)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  } else if (step === 'stats') {
    content = (
      <div className="flex flex-col gap-2">
        {mjLine(fixed ? 'createAskStatsFixed' : pooled ? 'createAskStatsPool' : 'createAskStats')}
        {pooled && !order ? (
          // Les jets déjà tombés, avec leurs dés : rien ne se perd en route.
          <ul className="flex flex-col gap-0.5 text-xs">
            {rolls.map((f, i) => (
              <li key={i} className="flex justify-between rounded-md px-2 py-0.5">
                <span className="text-ink/70">{t('createRollN').replace('{n}', String(i + 1)).replace('{m}', String(POOL_SIZE))}</span>
                <span className="flex items-baseline gap-1.5">
                  <Faces dice={poolDice} faces={f} />
                  <b>{statValue(poolDice, f)}</b>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          statList(!!order)
        )}
        {order && <p className="text-xs text-ink/60">{t('createSwapHint')}</p>}
        {current ? (
          rollButton
        ) : (
          <button onClick={() => setStep('portrait')} className="ui-btn ui-btn-primary">
            {t('createNext')}
          </button>
        )}
      </div>
    )
  } else if (step === 'portrait') {
    const list = portraitsFor(heroClass?.id ?? '', gender, people?.id ?? '', allPortraits)
    content = (
      <div className="flex flex-col gap-2">
        {mjLine('createAskPortrait')}
        <ul className="grid grid-cols-5 gap-1.5">
          {list.map((p) => (
            <li key={p}>
              <button
                onClick={() => {
                  setImage(p)
                  setStep('ready')
                }}
                className={`block overflow-hidden rounded-md border-2 transition ${image === p ? 'border-gm' : 'border-transparent hover:border-gm/60'}`}
              >
                <img src={portraitSrc(p, true)} alt="" className="aspect-square w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="ui-btn ui-btn-ghost text-xs">
            <Upload size={13} aria-hidden /> {t(uploading ? 'createUploading' : 'createUpload')}
          </button>
          {!allPortraits && (
            <button onClick={() => setAllPortraits(true)} className="ui-btn ui-btn-ghost text-xs">
              {t('createAllPortraits')}
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void upload(file)
          }}
        />
        {uploadError && <p className="text-xs text-amber-300">{uploadError}</p>}
      </div>
    )
  } else if (people && heroClass && image) {
    content = (
      <div className="flex flex-col gap-2">
        {mjLine('createReady')}
        <div className="flex items-center gap-2.5">
          <img src={portraitSrc(image, true)} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{nom}</p>
            <p className="text-xs text-ink/65">
              {people.nom} · {heroClass.nom}
              {background && ` · ${background.nom}`} · {t('hp')} {startingHp(system, heroClass, stats)}
            </p>
          </div>
        </div>
        {statList(false)}
        <button
          onClick={() =>
            onDone(
              createdHero(system, {
                nom,
                people,
                heroClass,
                sexe: gender ? t(gender === 'homme' ? 'createMan' : 'createWoman') : '',
                historique: background ?? undefined,
                image,
                stats,
              }),
            )
          }
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

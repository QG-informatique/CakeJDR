'use client'

import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Flag, ImageUp, Plus } from 'lucide-react'
import type { TranslationKey } from '@/lib/translations'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { ALL_STATS } from '@/lib/gameSystems'
import { CHECK_THRESHOLD_MAX, type CheckStat } from '@/lib/checks'
import { BOARD_LIBRARY, LIBRARY, libraryUrl } from '@/lib/library'
import { uploadImageToCloudinary } from '@/lib/uploadImage'
import { CAMPAIGN_LIMITS as C, MUSIC_MOODS, nextScenes, parseCampaign } from '@/lib/autoGm/custom'
import type { MusicMood } from '@/lib/autoGm/music'
import type { Adventure, Scene, SceneSetup, SceneStep } from '@/lib/autoGm/types'
import { Field, RemoveButton, Section } from './fields'

type Props = {
  value: Adventure
  onChange: (next: Adventure) => void
  confirm: (message: string) => Promise<boolean>
}

const NEW_SCENE = '__new__'
const MAPS = LIBRARY.find((c) => c.id === 'cartes')!
/** Catégorie rangée avec une image envoyée par le MJ, montrée en grand. */
const UPLOAD_CATEGORY = 'perso'

const MOOD_KEYS: Record<MusicMood, TranslationKey> = {
  voyage: 'atelierMoodVoyage',
  taverne: 'atelierMoodTaverne',
  village: 'atelierMoodVillage',
  foret: 'atelierMoodForet',
  donjon: 'atelierMoodDonjon',
  combat: 'atelierMoodCombat',
  boss: 'atelierMoodBoss',
  victoire: 'atelierMoodVictoire',
  triste: 'atelierMoodTriste',
}

const shortId = () => crypto.randomUUID().slice(0, 6)

/** Ajoute une scène vide ; renvoie la campagne et l'identifiant de la scène. */
function addScene(adv: Adventure): [Adventure, string] {
  let n = Object.keys(adv.scenes).length + 1
  while (adv.scenes[`scene-${n}`]) n += 1
  const id = `scene-${n}`
  const scene: Scene = { id, title: '', narration: [''], step: { kind: 'end', title: '' } }
  return [{ ...adv, scenes: { ...adv.scenes, [id]: scene } }, id]
}

/** Scènes qu'on n'atteint jamais en partant de la première. */
function unreachable(adv: Adventure): Set<string> {
  const seen = new Set<string>()
  const queue = [adv.start]
  while (queue.length > 0) {
    const id = queue.pop()!
    const scene = adv.scenes[id]
    if (!scene || seen.has(id)) continue
    seen.add(id)
    queue.push(...nextScenes(scene.step))
  }
  return new Set(Object.keys(adv.scenes).filter((id) => !seen.has(id)))
}

/**
 * Éditeur d'une campagne perso : des scènes reliées entre elles, chacune
 * avec son récit, ce que voit le MJ, ses indices, son image et ce qu'elle
 * attend pour avancer. Le MJ automatique la déroule comme une aventure toute prête.
 */
export default function CampaignEditor({ value, onChange, confirm }: Props) {
  const t = useT()
  const [open, setOpen] = useState<string | null>(value.start)
  const ids = Object.keys(value.scenes)
  const lost = useMemo(() => unreachable(value), [value])

  const sceneName = (id: string) => value.scenes[id]?.title || t('atelierCampUntitled').replace('{n}', String(ids.indexOf(id) + 1))
  const setScene = (id: string, patch: Partial<Scene>) => onChange({ ...value, scenes: { ...value.scenes, [id]: { ...value.scenes[id]!, ...patch } } })

  /** Change l'étape d'une scène ; une suite « nouvelle scène » crée la scène au passage. */
  const setStep = (id: string, step: SceneStep, created?: Adventure) => {
    const adv = created ?? value
    onChange({ ...adv, scenes: { ...adv.scenes, [id]: { ...adv.scenes[id]!, step } } })
  }
  /** Valeur d'un menu de suite : une scène, ou une scène créée pour l'occasion. */
  const pickNext = (raw: string): [string, Adventure | undefined] => {
    if (raw !== NEW_SCENE) return [raw, undefined]
    const [adv, id] = addScene(value)
    return [id, adv]
  }

  const removeScene = async (id: string) => {
    if (ids.length <= 1 || !(await confirm(t('atelierCampSceneDeleteConfirm').replace('{n}', sceneName(id))))) return
    const scenes = { ...value.scenes }
    delete scenes[id]
    // Les suites qui menaient à la scène retirée terminent l'aventure.
    onChange(parseCampaign({ ...value, scenes, start: value.start === id ? Object.keys(scenes)[0] : value.start }) ?? value)
  }

  return (
    <div className="space-y-4">
      <Section title={t('atelierCampAbout')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t('atelierCampTitle')}>
            <input className="ui-input" value={value.title} maxLength={C.title} onChange={(e) => onChange({ ...value, title: e.target.value })} />
          </Field>
          <Field label={t('atelierCampStart')}>
            <select className="ui-input" value={value.start} onChange={(e) => onChange({ ...value, start: e.target.value })}>
              {ids.map((sid) => (
                <option key={sid} value={sid}>
                  {sceneName(sid)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t('atelierCampPitch')}>
          <input className="ui-input" value={value.pitch} maxLength={C.pitch} onChange={(e) => onChange({ ...value, pitch: e.target.value })} />
        </Field>
      </Section>

      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">
          {t('atelierCampScenes')} <span className="text-ink/50">({ids.length})</span>
        </h3>
        <button
          type="button"
          className="ui-btn"
          disabled={ids.length >= C.scenes}
          onClick={() => {
            const [adv, id] = addScene(value)
            onChange(adv)
            setOpen(id)
          }}
        >
          <Plus size={14} />
          {t('atelierCampAddScene')}
        </button>
      </div>

      <ol className="space-y-2">
        {ids.map((sid, index) => {
          const scene = value.scenes[sid]!
          const isOpen = open === sid
          const leads = [...new Set(nextScenes(scene.step))]
          return (
            <li key={sid} className="ui-well">
              <button type="button" className="flex w-full items-center gap-2 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : sid)} aria-expanded={isOpen}>
                <span className="text-xs font-bold text-ink/50">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {sceneName(sid)}
                    {value.start === sid && (
                      <span className="ml-2 rounded-full bg-[var(--c-accent)] px-2 py-0.5 text-[10px] text-[var(--c-on-accent)]">{t('atelierCampStartBadge')}</span>
                    )}
                    {lost.has(sid) && <span className="ml-2 text-[11px] font-normal text-amber-500">{t('atelierCampUnreachable')}</span>}
                  </span>
                  <span className="block truncate text-xs text-ink/55">
                    {scene.step.kind === 'end' ? (
                      <>
                        <Flag size={11} className="mr-1 inline" />
                        {scene.step.title || t('atelierCampEnd')}
                      </>
                    ) : (
                      `→ ${leads.map(sceneName).join(' · ')}`
                    )}
                  </span>
                </span>
                <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <SceneForm
                  scene={scene}
                  onScene={(patch) => setScene(sid, patch)}
                  onStep={(step, created) => setStep(sid, step, created)}
                  pickNext={pickNext}
                  scenes={ids.map((id) => ({ id, name: sceneName(id) }))}
                  otherScene={ids.find((x) => x !== sid) ?? sid}
                  onRemove={ids.length > 1 ? () => removeScene(sid) : undefined}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

type SceneRef = { id: string; name: string }

/** Menu de la scène suivante, avec de quoi en créer une au passage. */
function NextSelect({ scenes, value, onPick, label }: { scenes: SceneRef[]; value: string; onPick: (raw: string) => void; label: string }) {
  const t = useT()
  return (
    <Field label={label}>
      <select className="ui-input" value={value} onChange={(e) => onPick(e.target.value)}>
        {scenes.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
        <option value={NEW_SCENE}>{t('atelierCampNewSceneOption')}</option>
      </select>
    </Field>
  )
}

function SceneForm({
  scene,
  onScene,
  onStep,
  pickNext,
  scenes,
  otherScene,
  onRemove,
}: {
  scene: Scene
  onScene: (patch: Partial<Scene>) => void
  onStep: (step: SceneStep, created?: Adventure) => void
  pickNext: (raw: string) => [string, Adventure | undefined]
  scenes: SceneRef[]
  otherScene: string
  onRemove?: () => void
}) {
  const t = useT()
  const step = scene.step
  const setSetup = (patch: Partial<SceneSetup>) => {
    const setup = { ...scene.setup, ...patch }
    for (const k of Object.keys(setup) as (keyof SceneSetup)[]) if (setup[k] === undefined) delete setup[k]
    onScene({ setup: Object.keys(setup).length > 0 ? setup : undefined })
  }

  const changeKind = (kind: SceneStep['kind']) => {
    if (kind === step.kind) return
    const next = nextScenes(step)[0] ?? otherScene
    if (kind === 'continue') onStep({ kind: 'continue', next })
    if (kind === 'vote') onStep({ kind: 'vote', prompt: '', options: [{ id: `o-${shortId()}`, label: '', next }] })
    if (kind === 'check') onStep({ kind: 'check', prompt: '', stat: ALL_STATS[0]!.key as CheckStat, dc: 10, reason: '', success: next, failure: next })
    if (kind === 'end') onStep({ kind: 'end', title: '' })
  }

  return (
    <div className="space-y-4 border-t border-[var(--c-panel-line)] px-4 pb-4 pt-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('atelierCampSceneTitle')}>
          <input className="ui-input" value={scene.title} maxLength={C.label} onChange={(e) => onScene({ title: e.target.value })} />
        </Field>
        <Field label={t('atelierCampChapter')} hint={t('atelierCampChapterHint')}>
          <input className="ui-input" value={scene.chapter ?? ''} maxLength={C.label} onChange={(e) => onScene({ chapter: e.target.value || undefined })} />
        </Field>
      </div>

      <div className="space-y-2">
        <span className="ui-label">{t('atelierCampNarration')}</span>
        {scene.narration.map((p, i) => (
          <div key={i} className="flex items-start gap-2">
            <textarea
              className="ui-input min-h-20 flex-1 py-2"
              value={p}
              maxLength={C.paragraph}
              placeholder={t('atelierCampNarrationPlaceholder')}
              onChange={(e) => onScene({ narration: scene.narration.map((x, j) => (j === i ? e.target.value : x)) })}
            />
            {scene.narration.length > 1 && <RemoveButton label={t('atelierRemove')} onClick={() => onScene({ narration: scene.narration.filter((_, j) => j !== i) })} />}
          </div>
        ))}
        <button type="button" className="ui-btn ui-btn-ghost" disabled={scene.narration.length >= C.paragraphs} onClick={() => onScene({ narration: [...scene.narration, ''] })}>
          <Plus size={14} />
          {t('atelierCampAddParagraph')}
        </button>
      </div>

      <Field label={t('atelierCampGmNotes')} hint={t('atelierCampGmNotesHint')}>
        <textarea className="ui-input min-h-16 py-2" value={scene.gmNotes ?? ''} maxLength={C.gmNotes} onChange={(e) => onScene({ gmNotes: e.target.value || undefined })} />
      </Field>

      <div className="space-y-2">
        <span className="ui-label">{t('atelierCampClues')}</span>
        <p className="text-xs text-ink/50">{t('atelierCampCluesHint')}</p>
        {(scene.clues ?? []).map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <input
              className="ui-input min-w-0 flex-1"
              value={c.text}
              maxLength={C.clue}
              onChange={(e) => onScene({ clues: scene.clues!.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)) })}
            />
            <RemoveButton
              label={t('atelierRemove')}
              onClick={() => {
                const clues = scene.clues!.filter((x) => x.id !== c.id)
                onScene({ clues: clues.length > 0 ? clues : undefined })
              }}
            />
          </div>
        ))}
        <button
          type="button"
          className="ui-btn ui-btn-ghost"
          disabled={(scene.clues?.length ?? 0) >= C.clues}
          onClick={() => onScene({ clues: [...(scene.clues ?? []), { id: `indice-${shortId()}`, text: '' }] })}
        >
          <Plus size={14} />
          {t('atelierCampAddClue')}
        </button>
      </div>

      <SceneMedia setup={scene.setup} onSetup={setSetup} />

      <div className="space-y-3 rounded-lg border border-[var(--c-panel-line)] p-3">
        <Field label={t('atelierCampStep')}>
          <select className="ui-input" value={step.kind} onChange={(e) => changeKind(e.target.value as SceneStep['kind'])}>
            <option value="continue">{t('atelierCampStepContinue')}</option>
            <option value="vote">{t('atelierCampStepVote')}</option>
            <option value="check">{t('atelierCampStepCheck')}</option>
            <option value="end">{t('atelierCampStepEnd')}</option>
            {!['continue', 'vote', 'check', 'end'].includes(step.kind) && <option value={step.kind}>{t('atelierCampStepImported')}</option>}
          </select>
        </Field>

        {step.kind === 'continue' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <NextSelect
              scenes={scenes}
              label={t('atelierCampNext')}
              value={step.next}
              onPick={(raw) => {
                const [next, created] = pickNext(raw)
                onStep({ ...step, next }, created)
              }}
            />
            <Field label={t('atelierCampButton')} hint={t('atelierCampButtonHint')}>
              <input className="ui-input" value={step.label ?? ''} maxLength={C.label} onChange={(e) => onStep({ ...step, label: e.target.value || undefined })} />
            </Field>
          </div>
        )}

        {step.kind === 'vote' && (
          <>
            <Field label={t('atelierCampQuestion')}>
              <input className="ui-input" value={step.prompt} maxLength={C.label} onChange={(e) => onStep({ ...step, prompt: e.target.value })} />
            </Field>
            <ul className="space-y-2">
              {step.options.map((o) => (
                <li key={o.id} className="flex items-end gap-2">
                  <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                    <Field label={t('atelierCampChoice')}>
                      <input
                        className="ui-input"
                        value={o.label}
                        maxLength={C.label}
                        onChange={(e) => onStep({ ...step, options: step.options.map((x) => (x.id === o.id ? { ...x, label: e.target.value } : x)) })}
                      />
                    </Field>
                    <NextSelect
                      scenes={scenes}
                      label={t('atelierCampLeadsTo')}
                      value={o.next}
                      onPick={(raw) => {
                        const [next, created] = pickNext(raw)
                        onStep({ ...step, options: step.options.map((x) => (x.id === o.id ? { ...x, next } : x)) }, created)
                      }}
                    />
                  </div>
                  {step.options.length > 1 && (
                    <RemoveButton label={t('atelierRemove')} onClick={() => onStep({ ...step, options: step.options.filter((x) => x.id !== o.id) })} />
                  )}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="ui-btn ui-btn-ghost"
              disabled={step.options.length >= C.options}
              onClick={() => onStep({ ...step, options: [...step.options, { id: `o-${shortId()}`, label: '', next: step.options.at(-1)?.next ?? otherScene }] })}
            >
              <Plus size={14} />
              {t('atelierCampAddChoice')}
            </button>
          </>
        )}

        {step.kind === 'check' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('atelierCampQuestion')}>
                <input className="ui-input" value={step.prompt} maxLength={C.label} onChange={(e) => onStep({ ...step, prompt: e.target.value })} />
              </Field>
              <Field label={t('atelierCampReason')} hint={t('atelierCampReasonHint')}>
                <input className="ui-input" value={step.reason} maxLength={C.label} onChange={(e) => onStep({ ...step, reason: e.target.value })} />
              </Field>
              <Field label={t('atelierCampStat')}>
                <select className="ui-input" value={step.stat} onChange={(e) => onStep({ ...step, stat: e.target.value as CheckStat })}>
                  {ALL_STATS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {t(s.label)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('atelierCampDc')} hint={t('atelierCampDcHint')}>
                <input
                  type="number"
                  min={1}
                  max={CHECK_THRESHOLD_MAX}
                  className="ui-input"
                  value={step.dc}
                  onChange={(e) => onStep({ ...step, dc: Math.max(1, Math.min(CHECK_THRESHOLD_MAX, Math.round(Number(e.target.value) || 1))) })}
                />
              </Field>
              <NextSelect
                scenes={scenes}
                label={t('atelierCampSuccess')}
                value={step.success}
                onPick={(raw) => {
                  const [next, created] = pickNext(raw)
                  onStep({ ...step, success: next }, created)
                }}
              />
              <NextSelect
                scenes={scenes}
                label={t('atelierCampFailure')}
                value={step.failure}
                onPick={(raw) => {
                  const [next, created] = pickNext(raw)
                  onStep({ ...step, failure: next }, created)
                }}
              />
            </div>
          </>
        )}

        {step.kind === 'end' && (
          <Field label={t('atelierCampEndTitle')} hint={t('atelierCampEndTitleHint')}>
            <input className="ui-input" value={step.title} maxLength={C.label} onChange={(e) => onStep({ ...step, title: e.target.value })} />
          </Field>
        )}
      </div>

      {onRemove && (
        <div className="flex justify-end">
          <button type="button" className="ui-btn ui-btn-danger" onClick={onRemove}>
            {t('atelierCampDeleteScene')}
          </button>
        </div>
      )}
    </div>
  )
}

/** Carte du plateau, image montrée en grand et musique de la scène. */
function SceneMedia({ setup, onSetup }: { setup: SceneSetup | undefined; onSetup: (patch: Partial<SceneSetup>) => void }) {
  const t = useT()
  const { lang } = useLanguage()
  const [uploading, setUploading] = useState<'map' | 'show' | null>(null)
  const [error, setError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const target = useRef<'map' | 'show'>('map')
  const show = setup?.show
  const showCategory = BOARD_LIBRARY.find((c) => c.id === show?.category)

  const upload = async (file: File) => {
    const which = target.current
    setUploading(which)
    setError(false)
    try {
      const { url } = await uploadImageToCloudinary(file)
      if (which === 'map') onSetup({ map: url })
      else onSetup({ show: { category: UPLOAD_CATEGORY, item: url, label: show?.label ?? '' } })
    } catch {
      setError(true)
    } finally {
      setUploading(null)
    }
  }
  const pickFile = (which: 'map' | 'show') => {
    target.current = which
    fileRef.current?.click()
  }

  return (
    <div className="space-y-3">
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
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label={t('atelierCampMap')} hint={t('atelierCampMapHint')}>
          <select className="ui-input" value={setup?.map ?? ''} onChange={(e) => onSetup({ map: e.target.value || undefined })}>
            <option value="">{t('atelierCampNone')}</option>
            {setup?.map?.startsWith('https://') && <option value={setup.map}>{t('atelierCampMyImage')}</option>}
            {MAPS.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label[lang]}
              </option>
            ))}
          </select>
        </Field>
        <button type="button" className="ui-btn self-end" onClick={() => pickFile('map')} disabled={uploading !== null}>
          <ImageUp size={14} />
          {uploading === 'map' ? t('atelierUploading') : t('atelierUpload')}
        </button>
      </div>
      {setup?.map && (
        <img src={libraryUrl('cartes', setup.map, true)} alt="" className="h-24 rounded-md object-cover" />
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <Field label={t('atelierCampShow')} hint={t('atelierCampShowHint')}>
          <select
            className="ui-input"
            value={show?.category === UPLOAD_CATEGORY ? UPLOAD_CATEGORY : (show?.category ?? '')}
            onChange={(e) => {
              const cat = BOARD_LIBRARY.find((c) => c.id === e.target.value)
              onSetup({ show: cat?.items[0] ? { category: cat.id, item: cat.items[0].id, label: show?.label ?? '' } : undefined })
            }}
          >
            <option value="">{t('atelierCampNone')}</option>
            {show?.category === UPLOAD_CATEGORY && <option value={UPLOAD_CATEGORY}>{t('atelierCampMyImage')}</option>}
            {BOARD_LIBRARY.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label[lang]}
              </option>
            ))}
          </select>
        </Field>
        {showCategory && show ? (
          <Field label={t('atelierCampImage')}>
            <select className="ui-input" value={show.item} onChange={(e) => onSetup({ show: { ...show, item: e.target.value } })}>
              {showCategory.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label[lang]}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <span />
        )}
        <button type="button" className="ui-btn self-end" onClick={() => pickFile('show')} disabled={uploading !== null}>
          <ImageUp size={14} />
          {uploading === 'show' ? t('atelierUploading') : t('atelierUpload')}
        </button>
      </div>
      {show && (
        <div className="flex items-start gap-3">
          <img src={libraryUrl(show.category, show.item, true)} alt="" className="h-24 rounded-md object-cover" />
          <Field label={t('atelierCampShowLabel')}>
            <input className="ui-input" value={show.label} maxLength={C.label} onChange={(e) => onSetup({ show: { ...show, label: e.target.value } })} />
          </Field>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{t('atelierUploadError')}</p>}

      <Field label={t('atelierCampMusic')}>
        <select className="ui-input" value={setup?.music ?? ''} onChange={(e) => onSetup({ music: (e.target.value || undefined) as MusicMood | undefined })}>
          <option value="">{t('atelierCampMusicAuto')}</option>
          {MUSIC_MOODS.map((m) => (
            <option key={m} value={m}>
              {t(MOOD_KEYS[m])}
            </option>
          ))}
        </select>
      </Field>
    </div>
  )
}

'use client'

import { useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Flag, ImageUp, Plus } from 'lucide-react'
import type { TranslationKey } from '@/lib/translations'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { GAME_SYSTEMS, GAME_SYSTEM_IDS, NARRATIF, isGameSystemId, type GameSystem } from '@/lib/gameSystems'
import { checkStatLabel, type CheckStat } from '@/lib/checks'
import { backgrounds, type ActionKind } from '@/lib/backgrounds'
import { buildSystem, type CustomSystemData } from '@/lib/customSystem'
import { BOARD_LIBRARY, LIBRARY, libraryUrl } from '@/lib/library'
import { uploadImageToCloudinary } from '@/lib/uploadImage'
import { ACTION_KINDS, CAMPAIGN_LIMITS as C, FLAG, MUSIC_MOODS, campaignFlags, nextScenes, parseCampaign } from '@/lib/autoGm/custom'
import { isDice } from '@/lib/autoGm/combat'
import type { MusicMood } from '@/lib/autoGm/music'
import type { Adventure, Foe, Scene, ScenePiece, SceneSetup, SceneStep } from '@/lib/autoGm/types'
import { Field, RemoveButton, Section } from './fields'

type Props = {
  value: Adventure
  onChange: (next: Adventure) => void
  confirm: (message: string) => Promise<boolean>
  /** Systèmes de l'atelier du MJ, pour y relier la campagne. */
  systems: { id: string; name: string; data: CustomSystemData }[]
}

const NEW_SCENE = '__new__'
const MAPS = LIBRARY.find((c) => c.id === 'cartes')!
/** Images qu'on pose en pion : tout sauf les cartes. */
const PIECE_LIBRARY = BOARD_LIBRARY.filter((c) => c.id !== 'cartes')
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

const STEP_KINDS: { kind: SceneStep['kind']; label: TranslationKey }[] = [
  { kind: 'continue', label: 'atelierCampStepContinue' },
  { kind: 'vote', label: 'atelierCampStepVote' },
  { kind: 'check', label: 'atelierCampStepCheck' },
  { kind: 'random', label: 'atelierCampStepRandom' },
  { kind: 'trial', label: 'atelierCampStepTrial' },
  { kind: 'combat', label: 'atelierCampStepCombat' },
  { kind: 'end', label: 'atelierCampStepEnd' },
]

const shortId = () => crypto.randomUUID().slice(0, 6)
const clamp = (v: string, lo: number, hi: number, fallback = lo) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) && v !== '' ? Math.max(lo, Math.min(hi, n)) : fallback
}

/** Une marque tapée en clair (« Sel bénit ») devient `sel-benit`. */
const toFlag = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

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

type SceneRef = { id: string; name: string }
type StatOption = { key: string; label: string }

/** Ce que toutes les scènes partagent : les autres scènes, les caractéristiques et les marques. */
type Ctx = {
  scenes: SceneRef[]
  pickNext: (raw: string) => [string, Adventure | undefined]
  otherScene: string
  stats: StatOption[]
  flags: string[]
  /** Pions posés dans toute la campagne : ils restent sur le plateau d'une scène à l'autre. */
  pieces: { piece: ScenePiece; scene: string }[]
}

/**
 * Éditeur d'une campagne perso : des scènes reliées entre elles, chacune
 * avec son récit, ce que voit le MJ, ses indices, son plateau, ce qui arrive
 * en y entrant et ce qu'elle attend pour avancer (vote, jet, tirage,
 * épreuve, combat). Le MJ automatique la déroule comme une aventure toute prête.
 */
export default function CampaignEditor({ value, onChange, confirm, systems }: Props) {
  const t = useT()
  const [open, setOpen] = useState<string | null>(value.start)
  const ids = Object.keys(value.scenes)
  const lost = useMemo(() => unreachable(value), [value])
  const flags = useMemo(() => campaignFlags(value), [value])
  const pieces = useMemo(() => Object.values(value.scenes).flatMap((s) => (s.setup?.pieces ?? []).map((piece) => ({ piece, scene: s.id }))), [value])

  // Le système relié donne ses caractéristiques et ses compétences ; sans
  // système, les six rôles que chaque table sait traduire.
  const linked: GameSystem | null = useMemo(() => {
    if (!value.system) return null
    if (isGameSystemId(value.system)) return GAME_SYSTEMS[value.system]
    const mine = systems.find((s) => s.id === value.system)
    return mine ? buildSystem(mine.data) : null
  }, [value.system, systems])
  const stats: StatOption[] = useMemo(() => {
    const sys: GameSystem = linked ?? NARRATIF
    return [...sys.stats, ...(sys.skills ?? [])].map((s) => ({ key: s.key, label: t(s.label) }))
  }, [linked, t])

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

  const knownSystem = !value.system || isGameSystemId(value.system) || systems.some((s) => s.id === value.system)

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
        <Field label={t('atelierCampSystem')} hint={t('atelierCampSystemHint')}>
          <select
            className="ui-input"
            value={value.system ?? ''}
            onChange={(e) => {
              const next: Adventure = { ...value, system: e.target.value }
              if (!e.target.value) delete next.system
              onChange(next)
            }}
          >
            <option value="">{t('atelierCampSystemAny')}</option>
            {GAME_SYSTEM_IDS.map((id) => (
              <option key={id} value={id}>
                {GAME_SYSTEMS[id].name}
              </option>
            ))}
            {systems.length > 0 && (
              <optgroup label={t('roomMySystems')}>
                {systems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            )}
            {!knownSystem && <option value={value.system}>{t('atelierCampSystemOther')}</option>}
          </select>
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
                      `${t(STEP_KINDS.find((k) => k.kind === scene.step.kind)!.label)} → ${leads.map(sceneName).join(' · ')}`
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
                  ctx={{ scenes: ids.map((id) => ({ id, name: sceneName(id) })), pickNext, otherScene: ids.find((x) => x !== sid) ?? sid, stats, flags, pieces }}
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

/** Menu de la scène suivante, avec de quoi en créer une au passage. */
function NextSelect({ ctx, value, onPick, label }: { ctx: Ctx; value: string; onPick: (next: string, created?: Adventure) => void; label: string }) {
  const t = useT()
  return (
    <Field label={label}>
      <select
        className="ui-input"
        value={value}
        onChange={(e) => {
          const [next, created] = ctx.pickNext(e.target.value)
          onPick(next, created)
        }}
      >
        {ctx.scenes.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
        <option value={NEW_SCENE}>{t('atelierCampNewSceneOption')}</option>
      </select>
    </Field>
  )
}

/** Caractéristique testée : celles du système relié, plus celle déjà choisie si elle n'y est pas. */
function StatSelect({ ctx, value, onChange, label }: { ctx: Ctx; value: string; onChange: (stat: CheckStat) => void; label?: string }) {
  const t = useT()
  const extra = ctx.stats.some((s) => s.key === value) ? [] : [{ key: value, label: t(checkStatLabel(value)) }]
  return (
    <Field label={label ?? t('atelierCampStat')}>
      <select className="ui-input" value={value} onChange={(e) => onChange(e.target.value as CheckStat)}>
        {[...ctx.stats, ...extra].map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

/** Difficulté, toujours écrite pour le d20 : la table la traduit dans son système. */
function DcInput({ value, onChange, label }: { value: number; onChange: (dc: number) => void; label?: string }) {
  const t = useT()
  return (
    <Field label={label ?? t('atelierCampDc')} hint={t('atelierCampDcHint')}>
      <input type="number" min={1} max={C.dc} className="ui-input" value={value} onChange={(e) => onChange(clamp(e.target.value, 1, C.dc, 10))} />
    </Field>
  )
}

/** Genre d'action : le héros dont l'historique y correspond a un bonus. */
function ActionSelect({ value, onChange }: { value: ActionKind | undefined; onChange: (action: ActionKind | undefined) => void }) {
  const t = useT()
  const { lang } = useLanguage()
  const list = backgrounds(lang)
  return (
    <Field label={t('atelierCampAction')} hint={t('atelierCampActionHint')}>
      <select className="ui-input" value={value ?? ''} onChange={(e) => onChange((e.target.value || undefined) as ActionKind | undefined)}>
        <option value="">{t('atelierCampNone')}</option>
        {ACTION_KINDS.map((k) => {
          const b = list.find((x) => x.action === k)
          return (
            <option key={k} value={k}>
              {b ? `${b.nom} : ${b.domaine}` : k}
            </option>
          )
        })}
      </select>
    </Field>
  )
}

/** Choix proposé seulement avec une marque, ou caché par une autre. */
function FlagConds({ ctx, needs, unless, onChange }: { ctx: Ctx; needs?: string; unless?: string; onChange: (c: { needs?: string; unless?: string }) => void }) {
  const t = useT()
  const options = (current?: string) => [...new Set([...ctx.flags, ...(current ? [current] : [])])]
  return (
    <>
      <Field label={t('atelierCampNeeds')}>
        <select className="ui-input" value={needs ?? ''} onChange={(e) => onChange({ needs: e.target.value || undefined, unless })}>
          <option value="">{t('atelierCampAlways')}</option>
          {options(needs).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('atelierCampUnless')}>
        <select className="ui-input" value={unless ?? ''} onChange={(e) => onChange({ needs, unless: e.target.value || undefined })}>
          <option value="">{t('atelierCampNever')}</option>
          {options(unless).map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </Field>
    </>
  )
}

/** Retire les clés vides d'un objet (une condition retirée ne reste pas en `undefined`). */
function compact<T extends object>(o: T): T {
  const out = { ...o }
  for (const k of Object.keys(out) as (keyof T)[]) if (out[k] === undefined || out[k] === '') delete out[k]
  return out
}

function Box({ children }: { children: ReactNode }) {
  return <div className="space-y-3 rounded-lg border border-[var(--c-panel-line)] p-3">{children}</div>
}

function SceneForm({
  scene,
  onScene,
  onStep,
  ctx,
  onRemove,
}: {
  scene: Scene
  onScene: (patch: Partial<Scene>) => void
  onStep: (step: SceneStep, created?: Adventure) => void
  ctx: Ctx
  onRemove?: () => void
}) {
  const t = useT()
  const step = scene.step
  const setSetup = (patch: Partial<SceneSetup>) => {
    const setup = compact({ ...scene.setup, ...patch })
    onScene({ setup: Object.keys(setup).length > 0 ? setup : undefined })
  }

  const changeKind = (kind: SceneStep['kind']) => {
    if (kind === step.kind) return
    const next = nextScenes(step)[0] ?? ctx.otherScene
    const stat = (ctx.stats[0]?.key ?? 'force') as CheckStat
    if (kind === 'continue') onStep({ kind: 'continue', next })
    if (kind === 'vote') onStep({ kind: 'vote', prompt: '', options: [{ id: `o-${shortId()}`, label: '', next }] })
    if (kind === 'check') onStep({ kind: 'check', prompt: '', stat, dc: 10, reason: '', success: next, failure: next })
    if (kind === 'random') onStep({ kind: 'random', outcomes: [{ next }, { next: ctx.otherScene }] })
    if (kind === 'trial') onStep({ kind: 'trial', prompt: '', stat, dc: 10, reason: '', need: 2, tries: 3, best: next, fail: next })
    if (kind === 'combat')
      onStep({ kind: 'combat', prompt: '', foes: [{ id: `e-${shortId()}`, name: '', hp: 6, defense: 10, attack: 2, damage: '1d6' }], victory: next, defeat: next })
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
      <SceneArrival scene={scene} onScene={onScene} />

      <Box>
        <Field label={t('atelierCampStep')}>
          <select className="ui-input" value={step.kind} onChange={(e) => changeKind(e.target.value as SceneStep['kind'])}>
            {STEP_KINDS.map((k) => (
              <option key={k.kind} value={k.kind}>
                {t(k.label)}
              </option>
            ))}
          </select>
        </Field>

        {step.kind === 'continue' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <NextSelect ctx={ctx} label={t('atelierCampNext')} value={step.next} onPick={(next, created) => onStep({ ...step, next }, created)} />
            <Field label={t('atelierCampButton')} hint={t('atelierCampButtonHint')}>
              <input className="ui-input" value={step.label ?? ''} maxLength={C.label} onChange={(e) => onStep(compact({ ...step, label: e.target.value || undefined }))} />
            </Field>
          </div>
        )}

        {step.kind === 'vote' && (
          <>
            <Field label={t('atelierCampQuestion')}>
              <input className="ui-input" value={step.prompt} maxLength={C.label} onChange={(e) => onStep({ ...step, prompt: e.target.value })} />
            </Field>
            <ul className="space-y-3">
              {step.options.map((o) => {
                const setOption = (patch: Partial<typeof o>, created?: Adventure) =>
                  onStep({ ...step, options: step.options.map((x) => (x.id === o.id ? compact({ ...x, ...patch }) : x)) }, created)
                return (
                  <li key={o.id} className="flex items-start gap-2 rounded-md border border-[var(--c-panel-line)] p-2">
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                      <Field label={t('atelierCampChoice')}>
                        <input className="ui-input" value={o.label} maxLength={C.label} onChange={(e) => setOption({ label: e.target.value })} />
                      </Field>
                      <NextSelect ctx={ctx} label={t('atelierCampLeadsTo')} value={o.next} onPick={(next, created) => setOption({ next }, created)} />
                      <FlagConds ctx={ctx} needs={o.needs} unless={o.unless} onChange={(c) => setOption(c)} />
                      <div className="sm:col-span-2">
                        <Field label={t('atelierCampNote')} hint={t('atelierCampNoteHint')}>
                          <input className="ui-input" value={o.note ?? ''} maxLength={C.label} onChange={(e) => setOption({ note: e.target.value || undefined })} />
                        </Field>
                      </div>
                    </div>
                    {step.options.length > 1 && (
                      <RemoveButton label={t('atelierRemove')} onClick={() => onStep({ ...step, options: step.options.filter((x) => x.id !== o.id) })} />
                    )}
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              className="ui-btn ui-btn-ghost"
              disabled={step.options.length >= C.options}
              onClick={() => onStep({ ...step, options: [...step.options, { id: `o-${shortId()}`, label: '', next: step.options.at(-1)?.next ?? ctx.otherScene }] })}
            >
              <Plus size={14} />
              {t('atelierCampAddChoice')}
            </button>
          </>
        )}

        {step.kind === 'check' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('atelierCampQuestion')}>
              <input className="ui-input" value={step.prompt} maxLength={C.label} onChange={(e) => onStep({ ...step, prompt: e.target.value })} />
            </Field>
            <Field label={t('atelierCampReason')} hint={t('atelierCampReasonHint')}>
              <input className="ui-input" value={step.reason} maxLength={C.label} onChange={(e) => onStep({ ...step, reason: e.target.value })} />
            </Field>
            <StatSelect ctx={ctx} value={step.stat} onChange={(stat) => onStep({ ...step, stat })} />
            <DcInput value={step.dc} onChange={(dc) => onStep({ ...step, dc })} />
            <ActionSelect value={step.action} onChange={(action) => onStep(compact({ ...step, action }))} />
            <span />
            <NextSelect ctx={ctx} label={t('atelierCampSuccess')} value={step.success} onPick={(success, created) => onStep({ ...step, success }, created)} />
            <NextSelect ctx={ctx} label={t('atelierCampFailure')} value={step.failure} onPick={(failure, created) => onStep({ ...step, failure }, created)} />
          </div>
        )}

        {step.kind === 'random' && (
          <>
            <p className="text-xs text-ink/55">{t('atelierCampRandomHint')}</p>
            <Field label={t('atelierCampButton')} hint={t('atelierCampButtonHint')}>
              <input className="ui-input" value={step.label ?? ''} maxLength={C.label} onChange={(e) => onStep(compact({ ...step, label: e.target.value || undefined }))} />
            </Field>
            <ul className="space-y-3">
              {step.outcomes.map((o, i) => {
                const setOutcome = (patch: Partial<typeof o>, created?: Adventure) =>
                  onStep({ ...step, outcomes: step.outcomes.map((x, j) => (j === i ? compact({ ...x, ...patch }) : x)) }, created)
                return (
                  <li key={i} className="flex items-start gap-2 rounded-md border border-[var(--c-panel-line)] p-2">
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                      <NextSelect ctx={ctx} label={t('atelierCampLeadsTo')} value={o.next} onPick={(next, created) => setOutcome({ next }, created)} />
                      <Field label={t('atelierCampWeight')} hint={t('atelierCampWeightHint')}>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          className="ui-input"
                          value={o.weight ?? 1}
                          onChange={(e) => {
                            const weight = clamp(e.target.value, 1, 100, 1)
                            setOutcome({ weight: weight > 1 ? weight : undefined })
                          }}
                        />
                      </Field>
                      <FlagConds ctx={ctx} needs={o.needs} unless={o.unless} onChange={(c) => setOutcome(c)} />
                    </div>
                    {step.outcomes.length > 1 && (
                      <RemoveButton label={t('atelierRemove')} onClick={() => onStep({ ...step, outcomes: step.outcomes.filter((_, j) => j !== i) })} />
                    )}
                  </li>
                )
              })}
            </ul>
            <button
              type="button"
              className="ui-btn ui-btn-ghost"
              disabled={step.outcomes.length >= C.options}
              onClick={() => onStep({ ...step, outcomes: [...step.outcomes, { next: ctx.otherScene }] })}
            >
              <Plus size={14} />
              {t('atelierCampAddOutcome')}
            </button>
          </>
        )}

        {step.kind === 'trial' && (
          <>
            <p className="text-xs text-ink/55">{t('atelierCampTrialHint')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('atelierCampQuestion')}>
                <input className="ui-input" value={step.prompt} maxLength={C.label} onChange={(e) => onStep({ ...step, prompt: e.target.value })} />
              </Field>
              <Field label={t('atelierCampReason')} hint={t('atelierCampReasonHint')}>
                <input className="ui-input" value={step.reason} maxLength={C.label} onChange={(e) => onStep({ ...step, reason: e.target.value })} />
              </Field>
              <StatSelect ctx={ctx} value={step.stat} onChange={(stat) => onStep({ ...step, stat })} />
              <DcInput value={step.dc} onChange={(dc) => onStep({ ...step, dc })} />
              <ActionSelect value={step.action} onChange={(action) => onStep(compact({ ...step, action }))} />
              <span />
              <Field label={t('atelierCampTries')}>
                <input
                  type="number"
                  min={1}
                  max={C.tries}
                  className="ui-input"
                  value={step.tries}
                  onChange={(e) => {
                    const tries = clamp(e.target.value, 1, C.tries, 3)
                    const need = Math.min(step.need, tries)
                    onStep({ ...step, tries, need, ...(step.middleAt ? { middleAt: Math.min(step.middleAt, need) } : {}) })
                  }}
                />
              </Field>
              <Field label={t('atelierCampNeed')}>
                <input
                  type="number"
                  min={1}
                  max={step.tries}
                  className="ui-input"
                  value={step.need}
                  onChange={(e) => {
                    const need = clamp(e.target.value, 1, step.tries, 1)
                    onStep({ ...step, need, ...(step.middleAt ? { middleAt: Math.min(step.middleAt, need) } : {}) })
                  }}
                />
              </Field>
              <NextSelect ctx={ctx} label={t('atelierCampTrialBest')} value={step.best} onPick={(best, created) => onStep({ ...step, best }, created)} />
              <NextSelect ctx={ctx} label={t('atelierCampTrialFail')} value={step.fail} onPick={(fail, created) => onStep({ ...step, fail }, created)} />
              <Field label={t('atelierCampTrialMiddle')} hint={t('atelierCampTrialMiddleHint')}>
                <select
                  className="ui-input"
                  value={step.middle ?? ''}
                  onChange={(e) => {
                    if (!e.target.value) {
                      const rest = { ...step }
                      delete rest.middle
                      delete rest.middleAt
                      return onStep(rest)
                    }
                    const [middle, created] = ctx.pickNext(e.target.value)
                    onStep({ ...step, middle, middleAt: step.middleAt ?? Math.max(1, step.need - 1) }, created)
                  }}
                >
                  <option value="">{t('atelierCampTrialNoMiddle')}</option>
                  {ctx.scenes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  <option value={NEW_SCENE}>{t('atelierCampNewSceneOption')}</option>
                </select>
              </Field>
              {step.middle && (
                <Field label={t('atelierCampTrialMiddleAt')}>
                  <input
                    type="number"
                    min={1}
                    max={step.need}
                    className="ui-input"
                    value={step.middleAt ?? 1}
                    onChange={(e) => onStep({ ...step, middleAt: clamp(e.target.value, 1, step.need, 1) })}
                  />
                </Field>
              )}
            </div>
          </>
        )}

        {step.kind === 'combat' && <CombatForm step={step} onStep={onStep} ctx={ctx} />}

        {step.kind === 'end' && (
          <Field label={t('atelierCampEndTitle')} hint={t('atelierCampEndTitleHint')}>
            <input className="ui-input" value={step.title} maxLength={C.label} onChange={(e) => onStep({ ...step, title: e.target.value })} />
          </Field>
        )}
      </Box>

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

type CombatStep = Extract<SceneStep, { kind: 'combat' }>

/** Les ennemis d'un combat, ses deux issues et la fuite. */
function CombatForm({ step, onStep, ctx }: { step: CombatStep; onStep: (step: SceneStep, created?: Adventure) => void; ctx: Ctx }) {
  const t = useT()
  const { lang } = useLanguage()
  const setFoe = (id: string, patch: Partial<Foe>) => onStep({ ...step, foes: step.foes.map((f) => (f.id === id ? compact({ ...f, ...patch }) : f)) })
  const pieceName = (p: ScenePiece) => PIECE_LIBRARY.find((c) => c.id === p.category)?.items.find((i) => i.id === p.item)?.label[lang] ?? p.item
  return (
    <>
      <p className="text-xs text-ink/55">{t('atelierCampCombatHint')}</p>
      <Field label={t('atelierCampQuestion')}>
        <input className="ui-input" value={step.prompt} maxLength={C.label} onChange={(e) => onStep({ ...step, prompt: e.target.value })} />
      </Field>
      <ul className="space-y-3">
        {step.foes.map((f) => (
          <li key={f.id} className="flex items-start gap-2 rounded-md border border-[var(--c-panel-line)] p-2">
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="col-span-2">
                <Field label={t('atelierCampFoeName')}>
                  <input className="ui-input" value={f.name} maxLength={C.label} onChange={(e) => setFoe(f.id, { name: e.target.value })} />
                </Field>
              </div>
              <Field label={t('atelierCampFoeHp')}>
                <input type="number" min={1} max={C.foeHp} className="ui-input" value={f.hp} onChange={(e) => setFoe(f.id, { hp: clamp(e.target.value, 1, C.foeHp, 1) })} />
              </Field>
              <Field label={t('atelierCampFoeDefense')}>
                <input type="number" min={1} max={C.foeDefense} className="ui-input" value={f.defense} onChange={(e) => setFoe(f.id, { defense: clamp(e.target.value, 1, C.foeDefense, 10) })} />
              </Field>
              <Field label={t('atelierCampFoeAttack')}>
                <input type="number" min={-5} max={C.foeAttack} className="ui-input" value={f.attack} onChange={(e) => setFoe(f.id, { attack: clamp(e.target.value, -5, C.foeAttack, 0) })} />
              </Field>
              <Field label={t('atelierCampFoeDamage')} hint={isDice(f.damage) ? undefined : t('atelierCampFoeDamageBad')}>
                <input className="ui-input" value={f.damage} maxLength={20} placeholder="1d6+1" onChange={(e) => setFoe(f.id, { damage: e.target.value })} />
              </Field>
              <Field label={t('atelierCampFoeAttacks')}>
                <input
                  type="number"
                  min={1}
                  max={C.foeAttacks}
                  className="ui-input"
                  value={f.attacks ?? 1}
                  onChange={(e) => {
                    const attacks = clamp(e.target.value, 1, C.foeAttacks, 1)
                    setFoe(f.id, { attacks: attacks > 1 ? attacks : undefined })
                  }}
                />
              </Field>
              <Field label={t('atelierCampFoePiece')}>
                <select className="ui-input" value={f.piece ?? ''} onChange={(e) => setFoe(f.id, { piece: e.target.value || undefined })}>
                  <option value="">{t('atelierCampNone')}</option>
                  {ctx.pieces.map(({ piece, scene }) => (
                    <option key={piece.id} value={piece.id}>
                      {pieceName(piece)} · {ctx.scenes.find((s) => s.id === scene)?.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            {step.foes.length > 1 && <RemoveButton label={t('atelierRemove')} onClick={() => onStep({ ...step, foes: step.foes.filter((x) => x.id !== f.id) })} />}
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="ui-btn ui-btn-ghost"
        disabled={step.foes.length >= C.foes}
        onClick={() => onStep({ ...step, foes: [...step.foes, { id: `e-${shortId()}`, name: '', hp: 6, defense: 10, attack: 2, damage: '1d6' }] })}
      >
        <Plus size={14} />
        {t('atelierCampAddFoe')}
      </button>
      <p className="text-xs text-ink/50">{t('atelierCampFoeHint')}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <NextSelect ctx={ctx} label={t('atelierCampVictory')} value={step.victory} onPick={(victory, created) => onStep({ ...step, victory }, created)} />
        <NextSelect ctx={ctx} label={t('atelierCampDefeat')} value={step.defeat} onPick={(defeat, created) => onStep({ ...step, defeat }, created)} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={!!step.flee}
          onChange={(e) => {
            if (e.target.checked) return onStep({ ...step, flee: { next: ctx.otherScene, stat: (ctx.stats[0]?.key ?? 'dexterite') as CheckStat, dc: 12 } })
            const rest = { ...step }
            delete rest.flee
            onStep(rest)
          }}
        />
        {t('atelierCampFlee')}
      </label>
      {step.flee && (
        <div className="grid gap-3 sm:grid-cols-3">
          <NextSelect ctx={ctx} label={t('atelierCampFleeTo')} value={step.flee.next} onPick={(next, created) => onStep({ ...step, flee: { ...step.flee!, next } }, created)} />
          <StatSelect ctx={ctx} value={step.flee.stat} onChange={(stat) => onStep({ ...step, flee: { ...step.flee!, stat } })} />
          <DcInput value={step.flee.dc} onChange={(dc) => onStep({ ...step, flee: { ...step.flee!, dc } })} />
        </div>
      )}
    </>
  )
}

/** Ce qui arrive en entrant dans la scène : marques, dégâts, soins, butin. */
function SceneArrival({ scene, onScene }: { scene: Scene; onScene: (patch: Partial<Scene>) => void }) {
  const t = useT()
  const [gainsText, setGainsText] = useState((scene.gains ?? []).join(', '))
  const commitGains = () => {
    const gains = [...new Set(gainsText.split(',').map(toFlag).filter((f) => FLAG.test(f)))].slice(0, C.gains)
    setGainsText(gains.join(', '))
    onScene({ gains: gains.length > 0 ? gains : undefined })
  }
  const healMode = scene.heal === true ? 'full' : scene.heal ? 'some' : ''
  const loot = scene.loot ?? []
  const setLoot = (next: typeof loot) => onScene({ loot: next.length > 0 ? next : undefined })
  return (
    <Box>
      <div>
        <span className="ui-label">{t('atelierCampArrival')}</span>
        <p className="text-xs text-ink/50">{t('atelierCampArrivalHint')}</p>
      </div>
      <Field label={t('atelierCampGains')} hint={t('atelierCampGainsHint')}>
        <input className="ui-input" value={gainsText} placeholder={t('atelierCampGainsPlaceholder')} onChange={(e) => setGainsText(e.target.value)} onBlur={commitGains} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={t('atelierCampDamage')} hint={t('atelierCampDamageHint')}>
          <input
            type="number"
            min={0}
            max={C.damage}
            className="ui-input"
            value={scene.damage ?? 0}
            onChange={(e) => onScene({ damage: clamp(e.target.value, 0, C.damage, 0) || undefined })}
          />
        </Field>
        <Field label={t('atelierCampHeal')}>
          <select
            className="ui-input"
            value={healMode}
            onChange={(e) => onScene({ heal: e.target.value === 'full' ? true : e.target.value === 'some' ? 4 : undefined })}
          >
            <option value="">{t('atelierCampNone')}</option>
            <option value="full">{t('atelierCampHealFull')}</option>
            <option value="some">{t('atelierCampHealSome')}</option>
          </select>
        </Field>
        {healMode === 'some' && (
          <Field label={t('atelierCampHealAmount')}>
            <input
              type="number"
              min={1}
              max={C.heal}
              className="ui-input"
              value={typeof scene.heal === 'number' ? scene.heal : 4}
              onChange={(e) => onScene({ heal: clamp(e.target.value, 1, C.heal, 1) })}
            />
          </Field>
        )}
      </div>
      <div className="space-y-2">
        <span className="ui-label">{t('atelierCampLoot')}</span>
        {loot.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="ui-input min-w-0 flex-1"
              value={l.fr}
              maxLength={C.label}
              placeholder={t('atelierCampLootPlaceholder')}
              onChange={(e) => setLoot(loot.map((x, j) => (j === i ? { ...x, fr: e.target.value, en: e.target.value } : x)))}
            />
            <input
              type="number"
              min={1}
              max={C.lootCount}
              className="ui-input w-20"
              aria-label={t('atelierCampLootCount')}
              value={l.n ?? 1}
              onChange={(e) => {
                const n = clamp(e.target.value, 1, C.lootCount, 1)
                setLoot(loot.map((x, j) => (j === i ? compact({ ...x, n: n > 1 ? n : undefined }) : x)))
              }}
            />
            <RemoveButton label={t('atelierRemove')} onClick={() => setLoot(loot.filter((_, j) => j !== i))} />
          </div>
        ))}
        <button type="button" className="ui-btn ui-btn-ghost" disabled={loot.length >= C.loot} onClick={() => setLoot([...loot, { fr: '', en: '' }])}>
          <Plus size={14} />
          {t('atelierCampAddLoot')}
        </button>
      </div>
    </Box>
  )
}

/** Carte du plateau, pions, image montrée en grand et musique de la scène. */
function SceneMedia({ setup, onSetup }: { setup: SceneSetup | undefined; onSetup: (patch: Partial<SceneSetup>) => void }) {
  const t = useT()
  const { lang } = useLanguage()
  const [uploading, setUploading] = useState<'map' | 'show' | null>(null)
  const [error, setError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const target = useRef<'map' | 'show'>('map')
  const show = setup?.show
  const showCategory = BOARD_LIBRARY.find((c) => c.id === show?.category)
  const pieces = setup?.pieces ?? []
  const setPieces = (next: ScenePiece[]) => onSetup({ pieces: next.length > 0 ? next : undefined })
  const setPiece = (id: string, patch: Partial<ScenePiece>) => setPieces(pieces.map((p) => (p.id === id ? { ...p, ...patch } : p)))

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

      <div className="space-y-2">
        <span className="ui-label">{t('atelierCampPieces')}</span>
        <p className="text-xs text-ink/50">{t('atelierCampPiecesHint')}</p>
        {pieces.map((p) => {
          const cat = PIECE_LIBRARY.find((c) => c.id === p.category)
          return (
            <div key={p.id} className="flex items-end gap-2 rounded-md border border-[var(--c-panel-line)] p-2">
              <img src={libraryUrl(p.category, p.item, true)} alt="" className="h-12 w-12 shrink-0 rounded object-contain" />
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:grid-cols-5">
                <Field label={t('atelierCampPieceCategory')}>
                  <select
                    className="ui-input"
                    value={p.category}
                    onChange={(e) => {
                      const c = PIECE_LIBRARY.find((x) => x.id === e.target.value)
                      if (c?.items[0]) setPiece(p.id, { category: c.id, item: c.items[0].id })
                    }}
                  >
                    {PIECE_LIBRARY.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label[lang]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('atelierCampImage')}>
                  <select className="ui-input" value={p.item} onChange={(e) => setPiece(p.id, { item: e.target.value })}>
                    {cat?.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label[lang]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t('atelierCampPieceX')}>
                  <input type="number" min={0} max={100} className="ui-input" value={Math.round(p.x * 100)} onChange={(e) => setPiece(p.id, { x: clamp(e.target.value, 0, 100) / 100 })} />
                </Field>
                <Field label={t('atelierCampPieceY')}>
                  <input type="number" min={0} max={100} className="ui-input" value={Math.round(p.y * 100)} onChange={(e) => setPiece(p.id, { y: clamp(e.target.value, 0, 100) / 100 })} />
                </Field>
                <Field label={t('atelierCampPieceSize')}>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    className="ui-input"
                    value={Math.round(p.width * 100)}
                    onChange={(e) => {
                      const size = clamp(e.target.value, 3, 60, 15) / 100
                      setPiece(p.id, { width: size, height: size })
                    }}
                  />
                </Field>
              </div>
              <RemoveButton label={t('atelierRemove')} onClick={() => setPieces(pieces.filter((x) => x.id !== p.id))} />
            </div>
          )
        })}
        <button
          type="button"
          className="ui-btn ui-btn-ghost"
          disabled={pieces.length >= C.pieces || !PIECE_LIBRARY[0]?.items[0]}
          onClick={() => {
            const cat = PIECE_LIBRARY[0]!
            const n = pieces.length
            setPieces([...pieces, { id: `pion-${shortId()}`, category: cat.id, item: cat.items[0]!.id, x: 0.2 + (n % 4) * 0.18, y: 0.3 + Math.floor(n / 4) * 0.2, width: 0.15, height: 0.15 }])
          }}
        >
          <Plus size={14} />
          {t('atelierCampAddPiece')}
        </button>
      </div>

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

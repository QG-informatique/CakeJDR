'use client'

// L'écran qui crée et modifie une fiche, depuis la page des salles comme depuis
// la table. Il travaille sur une copie : rien ne change tant qu'on n'a pas
// cliqué « Enregistrer ».

import { FC, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, Pencil, Plus, Trash2, UserRound, X } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useConfirm } from '@/lib/useConfirm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { GAME_SYSTEMS, type GameSystem } from '@/lib/gameSystems'
import type { CheckStat } from '@/lib/checks'
import ModBadge from './ModBadge'
import type { TranslationKey } from '@/lib/translations'
import {
  type Character,
  type CharacterChangeHandler,
  type Competence,
  normalizeCharacter,
} from '@/types/character'

type Props = {
  open: boolean
  /** La fiche de départ. */
  character: Character
  /** Vrai pour une nouvelle fiche : change le titre. */
  isNew?: boolean
  /** Système de la table ; hors d'une table, le narratif. */
  system?: GameSystem
  onSave: (character: Character) => void
  onClose: () => void
}

type Section = 'stats' | 'combat' | 'skills' | 'equip' | 'story'

const SECTIONS: { key: Section; label: TranslationKey }[] = [
  { key: 'stats', label: 'attributes' },
  { key: 'combat', label: 'combat' },
  { key: 'skills', label: 'skills' },
  { key: 'equip', label: 'equipment' },
  { key: 'story', label: 'story' },
]


const STORY_FIELDS = [
  { key: 'traits', label: 'traits' },
  { key: 'ideal', label: 'ideal' },
  { key: 'obligations', label: 'bonds' },
  { key: 'failles', label: 'flaws' },
  { key: 'avantages', label: 'features' },
  { key: 'background', label: 'background' },
  { key: 'notes', label: 'notes' },
] as const

const inputClass = 'ui-input w-full min-w-0'
const areaClass = 'ui-input w-full min-w-0 min-h-[4.5rem] py-1.5 resize-y'

const str = (v: unknown) => (v === undefined || v === null ? '' : String(v))

/** Un intitulé au-dessus de son champ. */
const Field: FC<{ label: string; children: ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
    <span className="ui-label">{label}</span>
    {children}
  </label>
)

const SectionTitle: FC<{ children: ReactNode }> = ({ children }) => (
  <h3 className="ui-label mb-2 mt-5 first:mt-0 !text-xs">{children}</h3>
)

export default function CharacterEditor(props: Props) {
  if (!props.open || typeof document === 'undefined') return null
  // Porté sous <body> : un panneau flouté parent piégerait sinon le « fixed ».
  return createPortal(<EditorDialog {...props} />, document.body)
}

function EditorDialog({ character, isNew = false, system = GAME_SYSTEMS.narratif, onSave, onClose }: Props) {
  const t = useT()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  const [initial] = useState(() => normalizeCharacter(character))
  const [draft, setDraft] = useState<Character>(initial)
  const [section, setSection] = useState<Section>('stats')
  const nameRef = useRef<HTMLInputElement>(null)

  const set: CharacterChangeHandler = (field, value) =>
    setDraft((d) => ({ ...d, [field]: value }))

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)

  const requestClose = async () => {
    if (dirty) {
      const ok = await confirm(t('discardChanges'), {
        danger: true,
        confirmLabel: t('discard'),
        cancelLabel: t('keepEditing'),
      })
      if (!ok) return
    }
    onClose()
  }

  // Seuls les champs modifiés ici remplacent la fiche du moment : un changement
  // arrivé pendant l'édition (le MJ qui retire des PV) n'est pas écrasé.
  const save = () => {
    const latest = normalizeCharacter(character)
    const merged = { ...latest } as Record<string, unknown>
    const before = initial as Record<string, unknown>
    for (const [key, value] of Object.entries(draft)) {
      if (JSON.stringify(value) !== JSON.stringify(before[key])) merged[key] = value
    }
    onSave(normalizeCharacter(merged as Character))
  }

  // Échap ferme l'écran, en demandant d'abord si des modifications seraient perdues.
  const requestCloseRef = useRef(requestClose)
  const askingRef = useRef(false)
  const keepEditingRef = useRef(handleCancel)
  useEffect(() => {
    requestCloseRef.current = requestClose
    askingRef.current = !!confirmState
    keepEditingRef.current = handleCancel
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      // Pendant la question « Abandonner ? », Échap revient à l'édition.
      if (askingRef.current) keepEditingRef.current()
      else void requestCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // La page derrière ne défile plus tant que l'écran est ouvert.
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (isNew) nameRef.current?.focus()
    return () => { document.body.style.overflow = previous }
  }, [isNew])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-shade/70 p-0 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="character-editor-title"
    >
      <div
        className="ui-panel flex h-full w-full max-w-5xl flex-col overflow-hidden !rounded-none shadow-2xl sm:max-h-[54rem] sm:!rounded-[14px]"
        style={{ background: 'var(--c-panel-head)' }}
      >
        {/* En-tête */}
        <header className="flex shrink-0 items-center gap-3 border-b border-[var(--c-panel-line)] px-4 py-3">
          <h2 id="character-editor-title" className="min-w-0 flex-1 truncate text-lg font-bold">
            {isNew ? t('newSheet') : t('editSheet')}
            {draft.nom && <span className="font-normal text-ink/60"> — {draft.nom}</span>}
          </h2>
          <button onClick={() => void requestClose()} className="ui-btn ui-btn-ghost ui-btn-icon" aria-label={t('close')} title={t('close')}>
            <X size={18} />
          </button>
        </header>

        {/* Corps : sur téléphone tout défile d'un bloc ; sur grand écran chaque
            colonne a sa propre barre de défilement. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          {/* Colonne de gauche : portrait et identité */}
          <aside className="shrink-0 border-b border-[var(--c-panel-line)] p-4 lg:w-72 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <div className="mx-auto mb-4 flex aspect-[3/4] w-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-[var(--c-line-strong)] bg-ink/5 lg:w-40">
              {draft.portrait
                ? <img src={draft.portrait} alt={t('portrait')} className="h-full w-full object-cover" />
                : <UserRound size={48} className="text-ink/25" aria-label={t('emptyPortrait')} />}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('name')} className="col-span-2">
                <input ref={nameRef} value={draft.nom} onChange={(e) => set('nom', e.target.value)} className={inputClass} placeholder={t('unnamed')} />
              </Field>
              <Field label={t('race')}>
                <input value={str(draft.race)} onChange={(e) => set('race', e.target.value)} className={inputClass} />
              </Field>
              <Field label={t('class')}>
                <input value={str(draft.classe)} onChange={(e) => set('classe', e.target.value)} className={inputClass} />
              </Field>
              <Field label={t('level')}>
                <input inputMode="numeric" value={str(draft.niveau)} onChange={(e) => set('niveau', e.target.value)} className={inputClass} />
              </Field>
              <Field label={t('gender')}>
                <input value={str(draft.sexe)} onChange={(e) => set('sexe', e.target.value)} className={inputClass} />
              </Field>
              <Field label={t('age')}>
                <input value={str(draft.age)} onChange={(e) => set('age', e.target.value)} className={inputClass} />
              </Field>
              <Field label={t('height')}>
                <input value={str(draft.taille)} onChange={(e) => set('taille', e.target.value)} className={inputClass} />
              </Field>
              <Field label={t('weight')} className="col-span-2 sm:col-span-1">
                <input value={str(draft.poids)} onChange={(e) => set('poids', e.target.value)} className={inputClass} />
              </Field>
            </div>
          </aside>

          {/* Sections à droite */}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="sticky top-0 z-10 shrink-0 border-b border-[var(--c-panel-line)] px-4 py-2" style={{ background: 'var(--c-panel-head)' }}>
              <nav className="ui-seg flex-wrap sm:flex-nowrap" role="tablist">
                {SECTIONS.map((s) => (
                  <button
                    key={s.key}
                    role="tab"
                    aria-selected={section === s.key}
                    onClick={() => setSection(s.key)}
                    className="!flex-auto sm:!flex-1"
                  >
                    {t(s.label)}
                    {s.key === 'skills' && draft.competences.length > 0 && ` (${draft.competences.length})`}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 p-4 lg:overflow-y-auto" role="tabpanel">
              {section === 'stats' && <StatsSection draft={draft} set={set} system={system} />}
              {section === 'combat' && <CombatSection draft={draft} set={set} system={system} />}
              {section === 'skills' && <SkillsSection draft={draft} set={set} system={system} />}
              {section === 'equip' && <EquipSection draft={draft} set={set} system={system} />}
              {section === 'story' && <StorySection draft={draft} set={set} system={system} />}
            </div>
          </div>
        </div>

        {/* Boutons toujours visibles */}
        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--c-panel-line)] px-4 py-3">
          <button onClick={() => void requestClose()} className="ui-btn">{t('cancelBtn')}</button>
          <button onClick={save} className="ui-btn ui-btn-primary">
            <Check size={14} /> {t('save')}
          </button>
        </footer>
      </div>

      <ConfirmDialog
        open={!!confirmState}
        message={confirmState?.message ?? ''}
        title={confirmState?.title}
        danger={confirmState?.danger}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </div>
  )
}

type SectionProps = { draft: Character; set: CharacterChangeHandler; system: GameSystem }

/** Un champ de la fiche que le système nomme : on l'écrit sans passer par le type. */
const fieldOf = (draft: Character, key: string) => Reflect.get(draft, key) as unknown
const setField = (set: CharacterChangeHandler, key: string, value: string) =>
  set(key as keyof Character, value as never)

const StatsSection: FC<SectionProps> = ({ draft, set, system }) => {
  const t = useT()
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {system.stats.map((s) => (
        <div key={s.key} className="ui-well flex flex-col gap-2 p-3">
          <span className="flex items-baseline justify-between gap-2 text-sm font-semibold">
            {t(s.label)}
            <ModBadge character={draft} stat={s.key as CheckStat} system={system} className="text-sm" />
          </span>
          <div className="flex gap-2">
            <Field label={t('value')} className="flex-1">
              <input inputMode="numeric" value={str(fieldOf(draft, s.key))} onChange={(e) => setField(set, s.key, e.target.value)} className={`${inputClass} text-center`} />
            </Field>
            <Field label={t('equipBonus')} className="flex-1">
              <input inputMode="numeric" value={str(fieldOf(draft, `${s.key}_bonus`))} onChange={(e) => setField(set, `${s.key}_bonus`, e.target.value)} className={`${inputClass} text-center`} placeholder="0" />
            </Field>
          </div>
          <Field label={t('equipBonusFrom')}>
            <input value={str(fieldOf(draft, `${s.key}_bonus_from`))} onChange={(e) => setField(set, `${s.key}_bonus_from`, e.target.value)} className={inputClass} placeholder={t('equipBonusFromHint')} maxLength={40} />
          </Field>
        </div>
      ))}
    </div>
  )
}

const CombatSection: FC<SectionProps> = ({ draft, set, system }) => {
  const t = useT()
  return (
    <>
      <SectionTitle>{t('hp')}</SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <Field label={t('hp')}>
          <input inputMode="numeric" value={str(draft.pv)} onChange={(e) => set('pv', e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('hpMax')}>
          <input inputMode="numeric" value={str(draft.pv_max)} onChange={(e) => set('pv_max', e.target.value)} className={inputClass} />
        </Field>
      </div>

      <SectionTitle>{system.basics.map((b) => t(b.label)).join(' · ')}</SectionTitle>
      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
        {system.basics.map((b) => (
          <Field key={b.key} label={t(b.label)}>
            <input inputMode="numeric" value={str(fieldOf(draft, b.key))} onChange={(e) => setField(set, b.key, e.target.value)} className={inputClass} />
          </Field>
        ))}
      </div>

      <SectionTitle>{t('attackMods')}</SectionTitle>
      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
        <Field label={t('melee')}>
          <input inputMode="numeric" value={str(draft.mod_contact)} onChange={(e) => set('mod_contact', e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('ranged')}>
          <input inputMode="numeric" value={str(draft.mod_distance)} onChange={(e) => set('mod_distance', e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('magic')}>
          <input inputMode="numeric" value={str(draft.mod_magique)} onChange={(e) => set('mod_magique', e.target.value)} className={inputClass} />
        </Field>
      </div>
    </>
  )
}

type SkillDraft = { nom: string; type: string; effets: string; degats: string }
const emptySkill = (system: GameSystem): SkillDraft => ({ nom: '', type: system.skillTypes[0]!, effets: '', degats: '' })

/** Formulaire d'une compétence, dans la liste : pour en ajouter ou en modifier une. */
const SkillForm: FC<{
  initial: SkillDraft
  skillTypes: readonly string[]
  onSubmit: (s: SkillDraft) => void
  onCancel: () => void
}> = ({ initial, skillTypes, onSubmit, onCancel }) => {
  const t = useT()
  const [s, setS] = useState(initial)
  const nomRef = useRef<HTMLInputElement>(null)
  // Le formulaire s'ouvre sur un clic : on place le curseur dans le nom.
  useEffect(() => { nomRef.current?.focus() }, [])
  const types = skillTypes.includes(s.type) || !s.type ? skillTypes : [s.type, ...skillTypes]
  return (
    <div className="ui-well flex flex-col gap-3 p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <Field label={t('name')}>
          <input ref={nomRef} value={s.nom} onChange={(e) => setS({ ...s, nom: e.target.value })} className={inputClass} placeholder={t('skillName')} />
        </Field>
        <Field label={t('type')}>
          <select value={s.type} onChange={(e) => setS({ ...s, type: e.target.value })} className={inputClass}>
            {types.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
          </select>
        </Field>
      </div>
      <Field label={t('effects')}>
        <textarea value={s.effets} onChange={(e) => setS({ ...s, effets: e.target.value })} className={areaClass} placeholder={t('effectDesc')} />
      </Field>
      <Field label={t('damageOptional')} className="sm:max-w-[12rem]">
        <input value={s.degats} onChange={(e) => setS({ ...s, degats: e.target.value })} className={inputClass} placeholder="2d6+3" />
      </Field>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="ui-btn ui-btn-ghost">{t('cancelBtn')}</button>
        <button onClick={() => onSubmit(s)} disabled={!s.nom.trim()} className="ui-btn ui-btn-primary">
          <Check size={14} /> {t('validate')}
        </button>
      </div>
    </div>
  )
}

const SkillsSection: FC<SectionProps> = ({ draft, set, system }) => {
  const t = useT()
  // L'identifiant de la compétence en cours de modification, 'new' pour un ajout.
  const [editing, setEditing] = useState<string | null>(null)
  const skills = draft.competences

  const toSkill = (s: SkillDraft, id: string): Competence => ({
    id,
    nom: s.nom.trim(),
    type: s.type,
    effets: s.effets.trim(),
    degats: s.degats.trim() || undefined,
  })

  return (
    <>
      <Field label={t('racialAbility')}>
        <textarea value={str(draft.capacite_raciale)} onChange={(e) => set('capacite_raciale', e.target.value)} className={areaClass} />
      </Field>

      <SectionTitle>{t('skills')}</SectionTitle>
      <ul className="flex flex-col gap-2">
        {skills.map((c) => (
          <li key={c.id}>
            {editing === c.id ? (
              <SkillForm
                initial={{ nom: c.nom, type: c.type, effets: c.effets, degats: c.degats ?? '' }}
                skillTypes={system.skillTypes}
                onCancel={() => setEditing(null)}
                onSubmit={(s) => {
                  set('competences', skills.map((x) => (x.id === c.id ? toSkill(s, c.id) : x)))
                  setEditing(null)
                }}
              />
            ) : (
              <div className="ui-well flex items-start gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 font-semibold leading-snug">
                    <span className="break-words">{c.nom}</span>
                    {c.type && <span className="rounded-full border border-[var(--c-panel-line)] px-1.5 py-px text-[10px] font-medium text-ink/60">{c.type}</span>}
                    {c.degats && <span className="text-xs font-normal text-ink/60">{c.degats}</span>}
                  </div>
                  {c.effets && <p className="mt-0.5 whitespace-pre-line break-words text-xs leading-relaxed text-ink/70">{c.effets}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => setEditing(c.id)} className="ui-btn ui-btn-ghost ui-btn-icon" aria-label={`${t('edit')} ${c.nom}`} title={t('edit')}>
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => set('competences', skills.filter((x) => x.id !== c.id))}
                    className="ui-btn ui-btn-ghost ui-btn-icon ui-btn-danger"
                    aria-label={`${t('delete')} ${c.nom}`}
                    title={t('delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {skills.length === 0 && editing !== 'new' && <p className="text-sm text-ink/55">{t('noSkill')}</p>}

      <div className="mt-3">
        {editing === 'new' ? (
          <SkillForm
            initial={emptySkill(system)}
            skillTypes={system.skillTypes}
            onCancel={() => setEditing(null)}
            onSubmit={(s) => {
              set('competences', [...skills, toSkill(s, crypto.randomUUID())])
              setEditing(null)
            }}
          />
        ) : (
          <button onClick={() => setEditing('new')} className="ui-btn">
            <Plus size={14} /> {t('addSkill')}
          </button>
        )}
      </div>
    </>
  )
}

const EquipSection: FC<SectionProps> = ({ draft, set }) => {
  const t = useT()
  const [item, setItem] = useState({ nom: '', quantite: '1' })
  const objets = draft.objets

  const addItem = () => {
    const nom = item.nom.trim()
    if (!nom) return
    const quantite = Math.max(1, parseInt(item.quantite, 10) || 1)
    set('objets', [...objets, { id: crypto.randomUUID(), nom, quantite }])
    setItem({ nom: '', quantite: '1' })
  }

  return (
    <>
      <SectionTitle>{t('weaponsArmor')}</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('weapons')}>
          <input value={str(draft.armes)} onChange={(e) => set('armes', e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('weaponDamage')}>
          <input value={str(draft.degats_armes)} onChange={(e) => set('degats_armes', e.target.value)} className={inputClass} placeholder="1d8" />
        </Field>
        <Field label={t('armor')}>
          <input value={str(draft.armure)} onChange={(e) => set('armure', e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('armorMod')}>
          <input inputMode="numeric" value={str(draft.modif_armure)} onChange={(e) => set('modif_armure', e.target.value)} className={inputClass} />
        </Field>
        <Field label={t('purse')}>
          <input inputMode="numeric" value={str(draft.bourse)} onChange={(e) => set('bourse', e.target.value)} className={inputClass} />
        </Field>
      </div>

      <SectionTitle>{t('items')}</SectionTitle>
      <ul className="flex flex-col gap-1.5">
        {objets.map((o) => (
          <li key={o.id} className="ui-well flex items-center gap-2 px-3 py-1.5">
            <input
              value={o.nom}
              onChange={(e) => set('objets', objets.map((x) => (x.id === o.id ? { ...x, nom: e.target.value } : x)))}
              className={`${inputClass} flex-1`}
              aria-label={t('itemName')}
            />
            <input
              type="number"
              min={0}
              value={o.quantite}
              onChange={(e) => set('objets', objets.map((x) => (x.id === o.id ? { ...x, quantite: Number(e.target.value) || 0 } : x)))}
              className={`${inputClass} !w-20 text-center`}
              aria-label={t('qty')}
            />
            <button
              onClick={() => set('objets', objets.filter((x) => x.id !== o.id))}
              className="ui-btn ui-btn-ghost ui-btn-icon ui-btn-danger shrink-0"
              aria-label={`${t('delete')} ${o.nom}`}
              title={t('delete')}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      {objets.length === 0 && <p className="text-sm text-ink/55">{t('noItems')}</p>}
      <form
        className="mt-3 flex items-end gap-2"
        onSubmit={(e) => { e.preventDefault(); addItem() }}
      >
        <Field label={t('itemName')} className="flex-1">
          <input value={item.nom} onChange={(e) => setItem({ ...item, nom: e.target.value })} className={inputClass} />
        </Field>
        <Field label={t('qty')} className="w-20">
          <input type="number" min={1} value={item.quantite} onChange={(e) => setItem({ ...item, quantite: e.target.value })} className={`${inputClass} text-center`} />
        </Field>
        <button type="submit" disabled={!item.nom.trim()} className="ui-btn shrink-0">
          <Plus size={14} /> {t('add')}
        </button>
      </form>
    </>
  )
}

const StorySection: FC<SectionProps> = ({ draft, set }) => {
  const t = useT()
  const [field, setField] = useState({ label: '', value: '' })
  const champs = draft.champs_perso

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {STORY_FIELDS.map((f) => (
          <Field key={f.key} label={t(f.label)} className={f.key === 'background' || f.key === 'notes' ? 'sm:col-span-2' : ''}>
            <textarea value={str(draft[f.key])} onChange={(e) => set(f.key, e.target.value)} className={areaClass} />
          </Field>
        ))}
      </div>

      <SectionTitle>{t('customFields')}</SectionTitle>
      <ul className="flex flex-col gap-1.5">
        {champs.map((c) => (
          <li key={c.id} className="ui-well flex items-start gap-2 px-3 py-2">
            <input
              value={c.label}
              onChange={(e) => set('champs_perso', champs.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)))}
              className={`${inputClass} !w-36 shrink-0 font-semibold`}
              aria-label={t('fieldName')}
            />
            <textarea
              value={c.value}
              onChange={(e) => set('champs_perso', champs.map((x) => (x.id === c.id ? { ...x, value: e.target.value } : x)))}
              className={`${areaClass} !min-h-[2rem] flex-1`}
              aria-label={t('value')}
            />
            <button
              onClick={() => set('champs_perso', champs.filter((x) => x.id !== c.id))}
              className="ui-btn ui-btn-ghost ui-btn-icon ui-btn-danger shrink-0"
              aria-label={`${t('delete')} ${c.label}`}
              title={t('delete')}
            >
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
      {champs.length === 0 && <p className="text-sm text-ink/55">{t('noCustomField')}</p>}
      <form
        className="mt-3 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!field.label.trim()) return
          set('champs_perso', [...champs, { id: crypto.randomUUID(), label: field.label.trim(), value: field.value }])
          setField({ label: '', value: '' })
        }}
      >
        <Field label={t('fieldName')} className="w-36">
          <input value={field.label} onChange={(e) => setField({ ...field, label: e.target.value })} className={inputClass} />
        </Field>
        <Field label={t('value')} className="min-w-[10rem] flex-1">
          <input value={field.value} onChange={(e) => setField({ ...field, value: e.target.value })} className={inputClass} />
        </Field>
        <button type="submit" disabled={!field.label.trim()} className="ui-btn shrink-0">
          <Plus size={14} /> {t('add')}
        </button>
      </form>
    </>
  )
}

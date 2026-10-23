'use client'

import type { TranslationKey } from '@/lib/translations'
import { useT } from '@/lib/useT'
import { DICE_TYPES } from '@/lib/dicePayload'
import { GAME_SYSTEMS, GAME_SYSTEM_IDS, isGameSystemId, type GameSystemId } from '@/lib/gameSystems'
import { CUSTOM_LIMITS, RESOURCE_COLORS, customFromPreset, newFieldKey, type CustomSystemData } from '@/lib/customSystem'
import { AddRow, Field, RemoveButton, Section } from './fields'

type Props = {
  value: CustomSystemData
  onChange: (next: CustomSystemData) => void
  confirm: (message: string) => Promise<boolean>
}

const L = CUSTOM_LIMITS.label

/**
 * Éditeur d'un système de jeu perso : ce que montre la fiche. Les règles
 * (dé des tests, bonus, montée de niveau) restent celles du système de départ.
 */
export default function SystemEditor({ value, onChange, confirm }: Props) {
  const t = useT()
  const base = GAME_SYSTEMS[value.base]
  const set = (patch: Partial<CustomSystemData>) => onChange({ ...value, ...patch })
  const takenKeys = [...value.basics.map((b) => b.key), ...value.resources.map((r) => r.key)]

  const changeBase = async (id: GameSystemId) => {
    if (id === value.base) return
    if (!(await confirm(t('atelierBaseConfirm')))) return
    onChange({ ...customFromPreset(id, t), name: value.name, pitch: value.pitch })
  }

  const toggleStat = (key: string, on: boolean) => {
    if (!on && value.stats.length <= 1) return
    const stats = base.stats
      .filter((s) => (s.key === key ? on : value.stats.some((k) => k.key === s.key)))
      .map((s) => value.stats.find((k) => k.key === s.key) ?? { key: s.key, label: t(s.label) })
    set({ stats })
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]">
      <div className="min-w-0 space-y-4">
        <Section title={t('atelierSysAbout')}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('atelierSysName')}>
              <input className="ui-input" value={value.name} maxLength={CUSTOM_LIMITS.name} onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label={t('atelierSysBase')} hint={t('atelierSysBaseHint')}>
              <select className="ui-input" value={value.base} onChange={(e) => isGameSystemId(e.target.value) && changeBase(e.target.value)}>
                {GAME_SYSTEM_IDS.map((id) => (
                  <option key={id} value={id}>
                    {GAME_SYSTEMS[id].name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={t('atelierSysPitch')}>
            <input className="ui-input" value={value.pitch} maxLength={CUSTOM_LIMITS.pitch} onChange={(e) => set({ pitch: e.target.value })} />
          </Field>
        </Section>

        <Section title={t('atelierSysStats')} hint={t('atelierSysStatsHint')}>
          <ul className="grid gap-2 sm:grid-cols-2">
            {base.stats.map((s) => {
              const kept = value.stats.find((k) => k.key === s.key)
              return (
                <li key={s.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!kept}
                    disabled={!!kept && value.stats.length <= 1}
                    onChange={(e) => toggleStat(s.key, e.target.checked)}
                    aria-label={t(s.label)}
                  />
                  <input
                    className="ui-input min-w-0 flex-1"
                    value={kept?.label ?? t(s.label)}
                    disabled={!kept}
                    maxLength={L}
                    onChange={(e) => set({ stats: value.stats.map((k) => (k.key === s.key ? { ...k, label: e.target.value } : k)) })}
                  />
                </li>
              )
            })}
          </ul>
        </Section>

        <Section title={t('atelierSysBasics')} hint={t('atelierSysBasicsHint')}>
          <ul className="space-y-2">
            {value.basics.map((b) => (
              <li key={b.key} className="flex items-center gap-2">
                <input
                  className="ui-input min-w-0 flex-1"
                  value={b.label}
                  maxLength={L}
                  onChange={(e) => set({ basics: value.basics.map((x) => (x.key === b.key ? { ...x, label: e.target.value } : x)) })}
                />
                <RemoveButton label={t('atelierRemove')} onClick={() => set({ basics: value.basics.filter((x) => x.key !== b.key) })} />
              </li>
            ))}
          </ul>
          <AddRow
            placeholder={t('atelierSysBasicNew')}
            max={L}
            disabled={value.basics.length >= CUSTOM_LIMITS.basics}
            onAdd={(label) => set({ basics: [...value.basics, { key: newFieldKey('x_', label, takenKeys), label }] })}
          />
        </Section>

        <Section title={t('atelierSysResources')} hint={t('atelierSysResourcesHint')}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t('atelierSysHp')}>
              <input className="ui-input" value={value.hp.label} maxLength={L} onChange={(e) => set({ hp: { ...value.hp, label: e.target.value } })} />
            </Field>
            <Field label={t('atelierSysHpMax')}>
              <input className="ui-input" value={value.hp.maxLabel} maxLength={L} onChange={(e) => set({ hp: { ...value.hp, maxLabel: e.target.value } })} />
            </Field>
          </div>
          <ul className="space-y-3">
            {value.resources.map((r) => {
              const update = (patch: Partial<typeof r>) => set({ resources: value.resources.map((x) => (x.key === r.key ? { ...x, ...patch } : x)) })
              const fromPreset = base.resources.some((p) => p.key === r.key)
              return (
                <li key={r.key} className="space-y-2 rounded-lg border border-[var(--c-panel-line)] p-2">
                  <div className="flex items-end gap-2">
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_1fr_6rem]">
                      <Field label={t('atelierSysResName')}>
                        <input className="ui-input" value={r.label} maxLength={L} onChange={(e) => update({ label: e.target.value })} />
                      </Field>
                      <Field label={t('atelierSysResMax')}>
                        <input className="ui-input" value={r.maxLabel} maxLength={L} onChange={(e) => update({ maxLabel: e.target.value })} />
                      </Field>
                      <Field label={t('atelierSysResStart')}>
                        <input
                          type="number"
                          min={0}
                          max={9999}
                          className="ui-input"
                          value={r.start}
                          title={fromPreset ? t('atelierSysResStartPreset') : undefined}
                          onChange={(e) => update({ start: Math.max(0, Math.min(9999, Math.round(Number(e.target.value) || 0))) })}
                        />
                      </Field>
                    </div>
                    <RemoveButton label={t('atelierRemove')} onClick={() => set({ resources: value.resources.filter((x) => x.key !== r.key) })} />
                  </div>
                  <div className="flex items-center gap-1.5" role="radiogroup" aria-label={t('atelierSysResColor')}>
                    <span className="ui-label mr-1">{t('atelierSysResColor')}</span>
                    {RESOURCE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        role="radio"
                        aria-checked={r.color === c}
                        aria-label={c.replace('bg-', '').replace('-500', '')}
                        onClick={() => update({ color: c })}
                        className={`h-5 w-5 rounded-full ${c} ${r.color === c ? 'ring-2 ring-[var(--c-ink)] ring-offset-1 ring-offset-transparent' : 'opacity-70'}`}
                      />
                    ))}
                    {fromPreset && <span className="ml-2 text-xs text-ink/50">{t('atelierSysResStartPreset')}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
          <AddRow
            placeholder={t('atelierSysResNew')}
            max={L}
            disabled={value.resources.length >= CUSTOM_LIMITS.resources}
            onAdd={(label) =>
              set({
                resources: [
                  ...value.resources,
                  {
                    key: newFieldKey('r_', label, takenKeys),
                    label,
                    maxLabel: `${label} max`.slice(0, L),
                    start: 10,
                    color: RESOURCE_COLORS[value.resources.length % RESOURCE_COLORS.length]!,
                  },
                ],
              })
            }
          />
        </Section>

        <Section title={t('atelierSysIdentity')} hint={t('atelierSysIdentityHint')}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label={t('atelierSysRace')}>
              <input className="ui-input" value={value.identity.race} maxLength={L} onChange={(e) => set({ identity: { ...value.identity, race: e.target.value } })} />
            </Field>
            <Field label={t('atelierSysClass')}>
              <input className="ui-input" value={value.identity.classe} maxLength={L} onChange={(e) => set({ identity: { ...value.identity, classe: e.target.value } })} />
            </Field>
          </div>
        </Section>

        <Section title={t('atelierSysSkillTypes')} hint={t('atelierSysSkillTypesHint')}>
          <ul className="flex flex-wrap gap-1.5">
            {value.skillTypes.map((s, i) => (
              <li key={`${s}-${i}`} className="flex items-center gap-1 rounded-full border border-[var(--c-line-strong)] py-0.5 pl-3 pr-1 text-xs">
                {s}
                <RemoveButton label={t('atelierRemove')} onClick={() => set({ skillTypes: value.skillTypes.filter((_, j) => j !== i) })} />
              </li>
            ))}
          </ul>
          <AddRow
            placeholder={t('atelierSysSkillTypeNew')}
            max={L}
            disabled={value.skillTypes.length >= CUSTOM_LIMITS.skillTypes}
            onAdd={(label) => !value.skillTypes.includes(label) && set({ skillTypes: [...value.skillTypes, label] })}
          />
        </Section>

        <Section title={t('atelierSysDice')} hint={t('atelierSysDiceHint').replace('{d}', `d${base.checkDie}`)}>
          <div className="flex flex-wrap gap-1.5">
            {DICE_TYPES.map((d) => {
              const on = value.dice.includes(d)
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  disabled={on && value.dice.length <= 1}
                  onClick={() => set({ dice: on ? value.dice.filter((x) => x !== d) : [...value.dice, d].sort((a, b) => a - b) })}
                  className={`ui-btn !min-h-8 ${on ? 'ui-btn-primary' : ''}`}
                >
                  d{d}
                </button>
              )
            })}
          </div>
        </Section>
      </div>

      <SheetPreview value={value} />
    </div>
  )
}

/** Aperçu de la fiche telle que les joueurs la verront. */
function SheetPreview({ value }: { value: CustomSystemData }) {
  const t = useT()
  const tx = (label: string) => t(label as TranslationKey)
  return (
    <aside className="ui-well h-fit space-y-3 p-4 text-sm xl:sticky xl:top-4">
      <p className="ui-label">{t('atelierPreview')}</p>
      <div>
        <p className="font-bold">{value.name || '—'}</p>
        {value.pitch && <p className="text-xs text-ink/60">{value.pitch}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <span className="rounded border border-[var(--c-panel-line)] px-2 py-1 text-ink/60">{tx(value.identity.race)}</span>
        <span className="rounded border border-[var(--c-panel-line)] px-2 py-1 text-ink/60">{tx(value.identity.classe)}</span>
      </div>
      <ul className="space-y-1.5">
        {[{ key: 'pv', label: value.hp.label, color: 'bg-emerald-500' }, ...value.resources].map((r) => (
          <li key={r.key}>
            <div className="flex justify-between text-xs">
              <span>{tx(r.label)}</span>
              <span className="text-ink/50">10 / 10</span>
            </div>
            <div className={`mt-0.5 h-1.5 rounded-full ${r.color}`} />
          </li>
        ))}
      </ul>
      <ul className="grid grid-cols-3 gap-1.5">
        {value.stats.map((s) => (
          <li key={s.key} className="rounded border border-[var(--c-panel-line)] px-1 py-1 text-center">
            <span className="block truncate text-[10px] uppercase text-ink/60">{tx(s.label)}</span>
            <span className="font-bold">10</span>
          </li>
        ))}
      </ul>
      {value.basics.length > 0 && (
        <ul className="space-y-1 text-xs">
          {value.basics.map((b) => (
            <li key={b.key} className="flex justify-between border-b border-[var(--c-panel-line)] pb-0.5">
              <span>{tx(b.label)}</span>
              <span className="text-ink/40">—</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink/60">{value.dice.map((d) => `d${d}`).join(' · ')}</p>
    </aside>
  )
}

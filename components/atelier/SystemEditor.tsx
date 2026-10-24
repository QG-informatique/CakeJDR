'use client'

import type { TranslationKey } from '@/lib/translations'
import { useT } from '@/lib/useT'
import { DICE_TYPES } from '@/lib/dicePayload'
import { GAME_SYSTEMS, GAME_SYSTEM_IDS, MOD_RULES, isGameSystemId, type GameSystemId, type ModRuleId } from '@/lib/gameSystems'
import {
  CONDITION_MOD_RANGE,
  CREATION_METHODS,
  CUSTOM_LIMITS,
  MARGIN_MAX,
  PARTIAL_MAX,
  RESOURCE_COLORS,
  STAT_VALUE_RANGE,
  buildSystem,
  customFromPreset,
  newFieldKey,
  type CustomRules,
  type CustomStat,
  type CustomSystemData,
} from '@/lib/customSystem'
import { CHECK_COUNT_MAX, type CheckExtras } from '@/lib/checkRules'
import { STAT_ROLES, isStatRole, roleOf, type StatRole } from '@/lib/statRoles'
import { AddRow, Field, RemoveButton, Section } from './fields'

type Props = {
  value: CustomSystemData
  onChange: (next: CustomSystemData) => void
  confirm: (message: string) => Promise<boolean>
}

const L = CUSTOM_LIMITS.label
const MOD_RULE_IDS = Object.keys(MOD_RULES) as ModRuleId[]

/** Intitulé d'un rôle : celui de la caractéristique du narratif qui le tient. */
const ROLE_LABEL = Object.fromEntries(GAME_SYSTEMS.narratif.stats.map((s) => [s.key, s.label])) as Record<StatRole, TranslationKey>

const CREATION_LABEL: Record<(typeof CREATION_METHODS)[number], TranslationKey> = {
  '4d6': 'atelierSysCreation4d6',
  '3d6': 'atelierSysCreation3d6',
  '2d6+6': 'atelierSysCreation2d6',
  '3d6x5': 'atelierSysCreation3d6x5',
  start: 'atelierSysCreationStart',
}

/** Champ de nombre qu'on peut laisser vide. */
function NumberInput({ value, onChange, min, max, placeholder }: {
  value: number | undefined
  onChange: (next: number | undefined) => void
  min: number
  max: number
  placeholder?: string
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      className="ui-input w-full min-w-0"
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => {
        const n = Math.round(Number(e.target.value))
        onChange(e.target.value === '' || !Number.isFinite(n) ? undefined : Math.max(min, Math.min(max, n)))
      }}
    />
  )
}

/** Case à cocher avec son texte, dans un champ de l'atelier. */
function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (on: boolean) => void; children: string }) {
  return (
    <label className="flex min-h-9 items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  )
}

/**
 * Éditeur d'un système de jeu perso : ce que montre la fiche, et les règles
 * des tests (dé, réussite, modificateur, niveaux, et les règles en plus).
 * Chaque liste s'allonge et se raccourcit, celles du système de départ
 * comprises.
 */
export default function SystemEditor({ value, onChange, confirm }: Props) {
  const t = useT()
  const base = GAME_SYSTEMS[value.base]
  const set = (patch: Partial<CustomSystemData>) => onChange({ ...value, ...patch })
  const setRules = (patch: Partial<CustomRules>) => set({ rules: { ...value.rules, ...patch } })
  const check = value.check ?? {}
  // Une règle retirée l'est pour de bon : pas de `false` ni de 0 rangé.
  const cleanCheck = (patch: Partial<CheckExtras>): CheckExtras => {
    const next: Record<string, unknown> = { ...check, ...patch }
    for (const k of Object.keys(next)) if (!next[k]) delete next[k]
    return next as CheckExtras
  }
  const setCheck = (patch: Partial<CheckExtras>) => set({ check: cleanCheck(patch) })
  const skills = value.skills ?? []
  const conditions = value.conditions ?? []
  const takenKeys = [
    ...value.basics.map((b) => b.key),
    ...value.attacks.map((a) => a.key),
    ...value.resources.map((r) => r.key),
    ...skills.map((k) => k.key),
    ...conditions.map((c) => c.key),
  ]
  const built = buildSystem(value)
  const pool = !!check.pool
  const mode = pool ? 'pool' : value.rules.under ? 'under' : 'over'
  const setMode = (next: string) => {
    // Une réserve courante : sur un d6, un 5 ou un 6 réussit ; sur un d10, 8 ou plus.
    const poolFace = next === 'pool' ? Math.max(2, Math.ceil(value.rules.die * 0.75)) : undefined
    set({
      rules: { ...value.rules, under: next === 'under' },
      check: cleanCheck(poolFace ? { pool: poolFace, count: undefined, statDie: undefined, wild: undefined, partial: undefined, degrees: undefined, advantage: undefined } : { pool: undefined }),
    })
  }
  const [lo, hi] = STAT_VALUE_RANGE

  const changeBase = async (id: GameSystemId) => {
    if (id === value.base) return
    if (!(await confirm(t('atelierBaseConfirm')))) return
    onChange({ ...customFromPreset(id, t), name: value.name, pitch: value.pitch })
  }

  // Une caractéristique du preset retirée puis remise par son nom reprend sa
  // clé : les classes et les armes du MJ automatique la reconnaissent.
  const addStat = (label: string) => {
    const same = (a: string) => a.trim().toLowerCase() === label.trim().toLowerCase()
    const preset = base.stats.find((b) => same(t(b.label)) && !value.stats.some((k) => k.key === b.key))
    const key = preset?.key ?? newFieldKey('s_', label, value.stats.map((k) => k.key))
    set({ stats: [...value.stats, { key, label }] })
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
          <p className="text-xs text-ink/60">{t('atelierSysStatsRoleHint')}</p>
          <ul className="grid gap-2 lg:grid-cols-2">
            {value.stats.map((s) => {
              const update = (patch: Partial<CustomStat>) => set({ stats: value.stats.map((k) => (k.key === s.key ? { ...k, ...patch } : k)) })
              const guessed = roleOf({ key: s.key, label: s.label })
              return (
                <li key={s.key} className="space-y-2 rounded-lg border border-[var(--c-panel-line)] p-2">
                  <div className="flex items-center gap-2">
                    <input className="ui-input min-w-0 flex-1" value={s.label} maxLength={L} onChange={(e) => update({ label: e.target.value })} />
                    {/* Il reste toujours une caractéristique à tester. */}
                    {value.stats.length > 1 && (
                      <RemoveButton label={t('atelierRemove')} onClick={() => set({ stats: value.stats.filter((k) => k.key !== s.key) })} />
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-[minmax(0,1fr)_4.5rem_4.5rem_4.5rem]">
                    <div className="col-span-3 sm:col-span-1">
                      <Field label={t('atelierSysStatRole')}>
                        <select className="ui-input" value={s.role ?? ''} onChange={(e) => update({ role: isStatRole(e.target.value) ? e.target.value : undefined })}>
                          <option value="">{t('atelierSysStatRoleAuto').replace('{role}', guessed ? t(ROLE_LABEL[guessed]) : t('atelierSysStatRoleNone'))}</option>
                          {STAT_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {t(ROLE_LABEL[r])}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label={t('atelierSysStatStart')}>
                      <NumberInput value={s.start} min={s.min ?? lo} max={s.max ?? hi} onChange={(start) => update({ start })} />
                    </Field>
                    <Field label={t('atelierSysStatMin')}>
                      <NumberInput value={s.min} min={lo} max={hi} onChange={(min) => update({ min })} />
                    </Field>
                    <Field label={t('atelierSysStatMax')}>
                      <NumberInput value={s.max} min={lo} max={hi} onChange={(max) => update({ max })} />
                    </Field>
                  </div>
                </li>
              )
            })}
          </ul>
          <AddRow placeholder={t('atelierSysStatNew')} max={L} disabled={value.stats.length >= CUSTOM_LIMITS.stats} onAdd={addStat} />
        </Section>

        <Section title={t('atelierSysSkills')} hint={t('atelierSysSkillsHint')}>
          {skills.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {skills.map((k) => {
                const update = (patch: Partial<typeof k>) => set({ skills: skills.map((x) => (x.key === k.key ? { ...x, ...patch } : x)) })
                return (
                  <li key={k.key} className="flex items-end gap-2">
                    <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                      <Field label={t('atelierSysSkillName')}>
                        <input className="ui-input" value={k.label} maxLength={L} onChange={(e) => update({ label: e.target.value })} />
                      </Field>
                      <Field label={t('atelierSysSkillStat')}>
                        <select className="ui-input" value={k.stat ?? ''} onChange={(e) => update({ stat: e.target.value || undefined })}>
                          <option value="">{t('atelierSysSkillNoStat')}</option>
                          {value.stats.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <RemoveButton label={t('atelierRemove')} onClick={() => set({ skills: skills.filter((x) => x.key !== k.key) })} />
                  </li>
                )
              })}
            </ul>
          )}
          <AddRow
            placeholder={t('atelierSysSkillNew')}
            max={L}
            disabled={skills.length >= CUSTOM_LIMITS.skills}
            onAdd={(label) => set({ skills: [...skills, { key: newFieldKey('k_', label, takenKeys), label }] })}
          />
        </Section>

        <Section title={t('atelierSysConditions')} hint={t('atelierSysConditionsHint')}>
          {conditions.length > 0 && (
            <ul className="grid gap-2 sm:grid-cols-2">
              {conditions.map((c) => {
                const update = (patch: Partial<typeof c>) => set({ conditions: conditions.map((x) => (x.key === c.key ? { ...x, ...patch } : x)) })
                return (
                  <li key={c.key} className="flex items-end gap-2">
                    <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
                      <Field label={t('atelierSysConditionName')}>
                        <input className="ui-input" value={c.label} maxLength={L} onChange={(e) => update({ label: e.target.value })} />
                      </Field>
                      <Field label={t('atelierSysConditionMod')}>
                        <NumberInput value={c.mod} min={-CONDITION_MOD_RANGE} max={CONDITION_MOD_RANGE} onChange={(mod) => update({ mod: mod ?? 0 })} />
                      </Field>
                    </div>
                    <RemoveButton label={t('atelierRemove')} onClick={() => set({ conditions: conditions.filter((x) => x.key !== c.key) })} />
                  </li>
                )
              })}
            </ul>
          )}
          <AddRow
            placeholder={t('atelierSysConditionNew')}
            max={L}
            disabled={conditions.length >= CUSTOM_LIMITS.conditions}
            onAdd={(label) => set({ conditions: [...conditions, { key: newFieldKey('c_', label, takenKeys), label, mod: value.rules.under ? -20 : -2 }] })}
          />
        </Section>

        <Section title={t('atelierSysCreation')} hint={t('atelierSysCreationHint')}>
          <Field label={t('atelierSysCreationMethod')} hint={t('atelierSysCreationBounds')}>
            <select
              className="ui-input"
              value={value.creation ?? ''}
              onChange={(e) => {
                const creation = CREATION_METHODS.find((m) => m === e.target.value)
                const rest = { ...value }
                delete rest.creation
                onChange(creation ? { ...rest, creation } : rest)
              }}
            >
              <option value="">{t('atelierSysCreationDefault')}</option>
              {CREATION_METHODS.map((m) => (
                <option key={m} value={m}>
                  {t(CREATION_LABEL[m])}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title={t('atelierSysRules')} hint={t('atelierSysRulesHint')}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('atelierSysRuleDie')}>
              <select
                className="ui-input"
                value={value.rules.die}
                onChange={(e) => {
                  const die = Number(e.target.value)
                  // La face qui réussit une réserve reste sur le dé.
                  set({ rules: { ...value.rules, die }, check: pool ? cleanCheck({ pool: Math.min(die, Math.max(2, check.pool ?? 2)) }) : check })
                }}
              >
                {DICE_TYPES.map((d) => (
                  <option key={d} value={d}>
                    d{d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('atelierSysRuleMode')}>
              <select className="ui-input" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="over">{t('atelierSysRuleOver')}</option>
                <option value="under">{t('atelierSysRuleUnder')}</option>
                <option value="pool">{t('atelierSysRulePool')}</option>
              </select>
            </Field>
            <Field label={t('atelierSysRuleMod')} hint={t(MOD_RULES[value.rules.mod].detail)}>
              <select className="ui-input" value={value.rules.mod} onChange={(e) => setRules({ mod: e.target.value as ModRuleId })}>
                {MOD_RULE_IDS.map((id) => (
                  <option key={id} value={id}>
                    {t(MOD_RULES[id].label)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={t('atelierSysRuleLevels')}
              hint={
                value.rules.levels
                  ? built.levelUpStats
                    ? t('atelierSysRuleLevelsStats').replace('{n}', String(built.levelUpStats))
                    : t('atelierSysRuleLevelsHp')
                  : undefined
              }
            >
              <label className="flex min-h-9 items-center gap-2">
                <input type="checkbox" checked={value.rules.levels} onChange={(e) => setRules({ levels: e.target.checked })} />
                {t('atelierSysRuleLevelsOn')}
              </label>
            </Field>
          </div>

          {/* Les règles en plus, seulement celles qui vont avec la réussite choisie. */}
          <div className="space-y-3 border-t border-[var(--c-panel-line)] pt-3">
            <p className="ui-label">{t('atelierSysRuleMore')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {pool && (
                <Field label={t('atelierSysRulePoolFace')} hint={t('atelierSysRulePoolHint')}>
                  <NumberInput value={check.pool} min={2} max={value.rules.die} onChange={(n) => setCheck({ pool: n ?? 2 })} />
                </Field>
              )}
              {!pool && !check.statDie && (
                <Field label={t('atelierSysRuleCount')} hint={t('atelierSysRuleCountHint')}>
                  <NumberInput value={check.count ?? 1} min={1} max={CHECK_COUNT_MAX} onChange={(n) => setCheck({ count: n && n > 1 ? n : undefined })} />
                </Field>
              )}
              {mode === 'over' && (
                <Field label={t('atelierSysRuleStatDieTitle')}>
                  <Toggle checked={!!check.statDie} onChange={(on) => setCheck({ statDie: on, count: undefined })}>
                    {t('atelierSysRuleStatDie')}
                  </Toggle>
                </Field>
              )}
              {!pool && (
                <Field label={t('atelierSysRuleWild')} hint={t('atelierSysRuleWildHint')}>
                  <select className="ui-input" value={check.wild ?? ''} onChange={(e) => setCheck({ wild: Number(e.target.value) || undefined })}>
                    <option value="">{t('atelierSysRuleWildNone')}</option>
                    {DICE_TYPES.filter((d) => d <= 20).map((d) => (
                      <option key={d} value={d}>
                        d{d}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <Field label={t('atelierSysRuleExplodeTitle')}>
                <Toggle checked={!!check.explode} onChange={(on) => setCheck({ explode: on })}>
                  {t('atelierSysRuleExplode')}
                </Toggle>
              </Field>
              {!pool && (
                <Field label={t('atelierSysRuleAdvantageTitle')}>
                  <Toggle checked={!!check.advantage} onChange={(on) => setCheck({ advantage: on })}>
                    {t('atelierSysRuleAdvantage')}
                  </Toggle>
                </Field>
              )}
              {mode === 'over' && (
                <Field label={t('atelierSysRulePartial')} hint={t('atelierSysRulePartialHint')}>
                  <NumberInput value={check.partial ?? 0} min={0} max={PARTIAL_MAX} onChange={(n) => setCheck({ partial: n })} />
                </Field>
              )}
              {mode === 'under' && (
                <Field label={t('atelierSysRuleDegreesTitle')} hint={t('atelierSysRuleDegreesHint')}>
                  <Toggle checked={!!check.degrees} onChange={(on) => setCheck({ degrees: on })}>
                    {t('atelierSysRuleDegrees')}
                  </Toggle>
                </Field>
              )}
              <Field label={t('atelierSysRuleMargin')} hint={t(pool ? 'atelierSysRuleMarginPoolHint' : 'atelierSysRuleMarginHint')}>
                <NumberInput value={check.margin ?? 0} min={0} max={MARGIN_MAX} onChange={(n) => setCheck({ margin: n })} />
              </Field>
            </div>
          </div>
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

        <Section title={t('atelierSysAttacks')} hint={t('atelierSysAttacksHint')}>
          <ul className="space-y-2">
            {value.attacks.map((a) => (
              <li key={a.key} className="flex items-center gap-2">
                <input
                  className="ui-input min-w-0 flex-1"
                  value={t(a.label as TranslationKey)}
                  maxLength={L}
                  onChange={(e) => set({ attacks: value.attacks.map((x) => (x.key === a.key ? { ...x, label: e.target.value } : x)) })}
                />
                <RemoveButton label={t('atelierRemove')} onClick={() => set({ attacks: value.attacks.filter((x) => x.key !== a.key) })} />
              </li>
            ))}
          </ul>
          <AddRow
            placeholder={t('atelierSysAttackNew')}
            max={L}
            disabled={value.attacks.length >= CUSTOM_LIMITS.attacks}
            onAdd={(label) => set({ attacks: [...value.attacks, { key: newFieldKey('x_', label, takenKeys), label }] })}
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

        <Section title={t('atelierSysDice')} hint={t('atelierSysDiceHint')}>
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
            <span className="font-bold">{s.start ?? (s.min !== undefined && s.max !== undefined ? Math.round((s.min + s.max) / 2) : 10)}</span>
          </li>
        ))}
      </ul>
      {(value.skills ?? []).length > 0 && (
        <ul className="space-y-1 text-xs">
          {(value.skills ?? []).map((k) => (
            <li key={k.key} className="flex justify-between border-b border-[var(--c-panel-line)] pb-0.5">
              <span>{k.label}</span>
              <span className="text-ink/40">{value.stats.find((s) => s.key === k.stat)?.label ?? '—'}</span>
            </li>
          ))}
        </ul>
      )}
      {(value.conditions ?? []).length > 0 && (
        <ul className="flex flex-wrap gap-1 text-xs">
          {(value.conditions ?? []).map((c) => (
            <li key={c.key} className="rounded-full border border-[var(--c-panel-line)] px-2 py-0.5">
              ☐ {c.label} <span className="text-ink/50">{c.mod > 0 ? `+${c.mod}` : c.mod}</span>
            </li>
          ))}
        </ul>
      )}
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
      {value.attacks.length > 0 && (
        <ul className="space-y-1 text-xs">
          {value.attacks.map((a) => (
            <li key={a.key} className="flex justify-between border-b border-[var(--c-panel-line)] pb-0.5">
              <span>{tx(a.label)}</span>
              <span className="text-ink/40">+0</span>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink/60">
        {t('atelierSysRuleDie')} : {value.check?.count ? value.check.count : ''}d{value.rules.die}
        {value.check?.wild ? ` + d${value.check.wild}` : ''} ·{' '}
        {t(value.check?.pool ? 'atelierSysRulePool' : value.rules.under ? 'atelierSysRuleUnder' : 'atelierSysRuleOver')}
      </p>
      <p className="text-xs text-ink/60">{value.dice.map((d) => `d${d}`).join(' · ')}</p>
    </aside>
  )
}

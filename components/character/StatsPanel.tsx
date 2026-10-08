import { FC } from 'react'
import { useT } from '@/lib/useT'
import { type Character } from '@/types/character'
import type { TranslationKey } from '@/lib/translations'
import { NARRATIF } from '@/lib/gameSystems'
import ModBadge from './ModBadge'

const { stats: STATS, attacks: ATTACKS, basics: BASICS } = NARRATIF

// Couleur de la valeur d'une caractéristique : on lit d'un coup d'œil les
// points forts (vert, or) et les faiblesses (orange, rouge).
const getStatColor = (value: number) => {
  if (value >= 18) return 'text-yellow-300'
  if (value >= 14) return 'text-emerald-300'
  if (value >= 10) return 'text-ink'
  if (value >= 6) return 'text-amber-300'
  return 'text-red-400'
}

/** Case d'une valeur : petit intitulé, grand chiffre. */
const Tile: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="ui-well flex min-w-0 flex-col items-center gap-0.5 px-1.5 py-2">
    <span className="ui-label !text-[10px] w-full truncate text-center" title={label}>{label}</span>
    {children}
  </div>
)

/** Ligne de l'affichage compact : intitulé à gauche, valeur à droite. */
const Row: FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex min-w-0 items-baseline justify-between gap-2 px-2.5 py-1 text-sm">
    <span className="truncate text-ink/65">{label}</span>
    <span className="shrink-0 tabular-nums font-semibold">{children}</span>
  </div>
)

type Props = {
  perso: Character
  compact?: boolean
}

const StatsPanel: FC<Props> = ({ perso, compact = false }) => {
  const t = useT()
  const statValue = (key: string) => Number(Reflect.get(perso, key) ?? 0)

  if (compact) {
    return (
      <div className="flex flex-col gap-3">
        <div className="ui-well grid grid-cols-3 divide-x divide-[var(--c-panel-line)]">
          {BASICS.map(b => (
            <div key={b.key} className="flex flex-col items-center py-1.5">
              <span className="ui-label !text-[10px]">{t(b.label as TranslationKey)}</span>
              <span className="font-bold tabular-nums">{perso[b.key] || '—'}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="ui-label mb-1">{t('attributes')}</div>
          <div className="ui-well grid grid-cols-2 py-1">
            {STATS.map(stat => (
              <Row key={stat.key} label={t(stat.label as TranslationKey)}>
                <span className={getStatColor(statValue(stat.key))}>{statValue(stat.key)}</span>
                <ModBadge character={perso} stat={stat.key} className="ml-1 text-xs font-medium text-ink/55" />
              </Row>
            ))}
          </div>
        </div>
        <div>
          <div className="ui-label mb-1">{t('attackMods')}</div>
          <div className="ui-well grid grid-cols-3 py-1">
            {ATTACKS.map(att => (
              <Row key={att.key} label={t(att.label as TranslationKey)}>
                {perso[att.key] ?? 0}
              </Row>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Défense, chance, initiative */}
      <div className="grid grid-cols-3 gap-2">
        {BASICS.map(b => (
          <Tile key={b.key} label={t(b.label as TranslationKey)}>
            <span className="text-lg font-bold tabular-nums">{perso[b.key] || '—'}</span>
          </Tile>
        ))}
      </div>

      {/* Caractéristiques et modificateurs */}
      <div>
        <div className="ui-label mb-1.5">{t('attributes')}</div>
        <div className="grid grid-cols-3 gap-2">
          {STATS.map(stat => (
            <Tile key={stat.key} label={t(stat.label as TranslationKey)}>
              <span className="flex items-baseline gap-1.5 tabular-nums">
                <span className={`text-xl font-bold ${getStatColor(statValue(stat.key))}`}>{statValue(stat.key)}</span>
                <ModBadge character={perso} stat={stat.key} className="text-xs font-semibold text-ink/55" />
              </span>
            </Tile>
          ))}
        </div>
      </div>

      {/* Modificateurs d'attaque */}
      <div>
        <div className="ui-label mb-1.5">{t('attackMods')}</div>
        <div className="grid grid-cols-3 gap-2">
          {ATTACKS.map(att => (
            <Tile key={att.key} label={t(att.label as TranslationKey)}>
              <span className="text-lg font-bold tabular-nums">{perso[att.key] ?? 0}</span>
            </Tile>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StatsPanel

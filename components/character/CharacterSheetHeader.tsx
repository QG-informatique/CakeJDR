import { FC } from 'react'
import { ArrowLeft, ChevronLeft, ImagePlus, LayoutGrid, Pencil, Rows3 } from 'lucide-react'
import { useT } from '@/lib/useT'
import Link from 'next/link'
import ThemeSwitcher from '../ui/ThemeSwitcher'
import type { Character } from '@/types/character'

type Tab = { key: string, label: string }

export type SheetDensity = 'compact' | 'full'

type Props = {
  perso: Character
  /** Ouvre l'écran de modification de la fiche. */
  onEdit: () => void
  /** Ouvre le choix du portrait. */
  onPortrait: () => void
  tab: string
  setTab: (tabKey: string) => void
  TABS: Tab[]
  density: SheetDensity
  setDensity: (d: SheetDensity) => void
  /** Replie la fiche ; absent quand elle ne peut pas l'être (téléphone). */
  onCollapse?: () => void
}

const getPvColor = (pv: number, pvMax: number) => {
  if (!pvMax) return 'bg-ink/30'
  const ratio = pv / pvMax
  if (ratio > 0.7) return 'bg-emerald-500'
  if (ratio > 0.3) return 'bg-amber-500'
  return 'bg-red-500'
}

/**
 * Haut de la fiche : portrait, nom, classe et niveau, bouton « Modifier »,
 * barre de PV, puis les onglets et le choix de l'affichage, qui restent
 * visibles quand la fiche défile.
 */
const CharacterSheetHeader: FC<Props> = ({
  perso,
  onEdit,
  onPortrait,
  tab,
  setTab,
  TABS,
  density,
  setDensity,
  onCollapse,
}) => {
  const t = useT()
  const pv = Number(perso.pv) || 0
  const pvMax = Number(perso.pv_max ?? perso.pvMax ?? perso.pv) || pv
  const pvRatio = pvMax ? Math.max(0, Math.min(1, pv / pvMax)) : 0
  const subtitle = [perso.classe, perso.race].filter(Boolean).join(' · ')

  return (
    <>
      {/* Retour aux salles et réglages */}
      <div className="-mx-3 flex items-center gap-1.5 px-3 pt-3">
        <Link href="/salles" className="ui-btn ui-btn-ghost" title={t('backToMenu')}>
          <ArrowLeft size={14} aria-hidden="true" />
          {t('rooms')}
        </Link>
        <span className="ml-auto flex items-center gap-1">
          <ThemeSwitcher compact />
          {onCollapse && (
            <button
              onClick={onCollapse}
              aria-label={t('collapsePanel')}
              title={t('collapsePanel')}
              className="max-lg:hidden ui-btn ui-btn-ghost ui-btn-icon"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </span>
      </div>

      {/* Identité */}
      <div className="mt-3 flex gap-3">
        <button
          onClick={onPortrait}
          title={perso.portrait ? t('portraitChange') : t('choosePortrait')}
          aria-label={perso.portrait ? t('portraitChange') : t('choosePortrait')}
          className={`group relative flex h-24 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl transition ${perso.portrait ? 'border border-[var(--c-panel-line)] hover:border-accent' : 'border border-dashed border-[var(--c-line-strong)] bg-ink/5 hover:border-accent'}`}
        >
          {perso.portrait
            ? <img src={perso.portrait} alt={t('portrait')} className="h-full w-full object-cover" />
            : (
              <span className="flex flex-col items-center gap-1 px-1 text-center text-[10px] leading-tight text-ink/50 group-hover:text-ink">
                <ImagePlus size={20} />
                {t('choosePortrait')}
              </span>
            )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="truncate text-xl font-bold leading-tight" title={perso.nom}>
            {perso.nom || t('unnamed')}
          </div>
          {subtitle && <div className="truncate text-sm text-ink/60">{subtitle}</div>}
          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <span className="text-sm text-ink/70">
              {t('level')} <span className="text-lg font-bold tabular-nums text-ink">{perso.niveau || 1}</span>
            </span>
            <button onClick={onEdit} className="ui-btn">
              <Pencil size={14} />
              {t('edit')}
            </button>
          </div>
        </div>
      </div>

      {/* Points de vie */}
      <div className="mt-3">
        <div className="flex items-baseline justify-between text-sm">
          <span className="ui-label">{t('hp')}</span>
          <span className="tabular-nums">
            <span className="text-lg font-bold">{pv}</span>
            <span className="text-ink/55"> / {pvMax}</span>
          </span>
        </div>
        <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-ink/10">
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${getPvColor(pv, pvMax)}`}
            style={{ width: `${pvRatio * 100}%` }}
          />
        </div>
      </div>

      {/* Onglets et affichage, collés en haut quand la fiche défile */}
      <div
        className="sticky top-0 z-40 -mx-3 mb-3 mt-3 flex items-center gap-2 border-b border-[var(--c-panel-line)] px-3 py-2 backdrop-blur-md"
        style={{ background: 'var(--c-panel-head)' }}
      >
        <nav className="ui-seg min-w-0 flex-1" role="tablist">
          {TABS.map(tItem => (
            <button
              key={tItem.key}
              role="tab"
              aria-selected={tab === tItem.key}
              onClick={() => setTab(tItem.key)}
              className="truncate"
            >
              {tItem.label}
            </button>
          ))}
        </nav>
        <div className="ui-seg shrink-0" role="group" aria-label={t('sheetDensity')}>
          <button
            aria-pressed={density === 'compact'}
            onClick={() => setDensity('compact')}
            title={t('sheetCompact')}
            aria-label={t('sheetCompact')}
            className="!px-2"
          >
            <Rows3 size={14} />
          </button>
          <button
            aria-pressed={density === 'full'}
            onClick={() => setDensity('full')}
            title={t('sheetFull')}
            aria-label={t('sheetFull')}
            className="!px-2"
          >
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>
    </>
  )
}

export default CharacterSheetHeader

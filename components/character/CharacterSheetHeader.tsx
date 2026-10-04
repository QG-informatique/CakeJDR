import { FC, ReactElement } from 'react'
import { ArrowLeft, ChevronLeft, Pencil } from 'lucide-react'
import { useT } from '@/lib/useT'
import Link from 'next/link'
import ThemeSwitcher from '../ui/ThemeSwitcher'

type Tab = { key: string, label: string }

type Props = {
  /** Ouvre l'écran de modification de la fiche. */
  onEdit: () => void,
  tab: string,
  setTab: (tabKey: string) => void,
  TABS: Tab[],
  children?: React.ReactNode,
  logoOnly?: boolean
  /** Replie la fiche ; absent quand elle ne peut pas l'être (téléphone, création). */
  onCollapse?: () => void
}

const CharacterSheetHeader: FC<Props> = ({
  onEdit,
  tab,
  setTab,
  TABS,
  children,
  onCollapse,
}) => {

  const childrenArray = children ? (Array.isArray(children) ? children : [children]) : []
  const t = useT()

  return (
    <div
      className="sticky top-0 z-40 -mx-3 px-3 pt-3 pb-3 mb-3 flex flex-col gap-3 border-b border-[var(--c-panel-line)] backdrop-blur-md"
      style={{ background: 'var(--c-panel-head)' }}
    >
      {/* Ligne du haut : retour aux salles, actions de la fiche, réglages */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Link href="/salles" className="ui-btn ui-btn-ghost" title={t('backToMenu')}>
          <ArrowLeft size={14} aria-hidden="true" />
          {t('rooms')}
        </Link>

        <button onClick={onEdit} className="ui-btn">
          <Pencil size={14} />
          {t('edit')}
        </button>

        {childrenArray.map((child, i) => {
          const key = (child as ReactElement)?.key ?? `child-${i}`
          return <span key={String(key)} className="flex items-center">{child}</span>
        })}

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

      {/* Onglets de la fiche */}
      <nav className="ui-seg" role="tablist">
        {TABS.map(tItem => (
          <button
            key={tItem.key}
            role="tab"
            aria-selected={tab === tItem.key}
            onClick={() => setTab(tItem.key)}
          >
            {tItem.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default CharacterSheetHeader

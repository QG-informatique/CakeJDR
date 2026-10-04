import { FC, ReactElement } from 'react'
import { ChevronLeft, Pencil, Save } from 'lucide-react'
import { useT } from '@/lib/useT'
import Link from 'next/link'
import CakeLogo from '../ui/CakeLogo'
import ThemeSwitcher from '../ui/ThemeSwitcher'

type Tab = { key: string, label: string }

type Props = {
  edit: boolean,
  onToggleEdit: () => void,
  onSave: () => void,
  tab: string,
  setTab: (tabKey: string) => void,
  TABS: Tab[],
  children?: React.ReactNode,
  logoOnly?: boolean
  /** Replie la fiche ; absent quand elle ne peut pas l'être (téléphone, création). */
  onCollapse?: () => void
}

const CharacterSheetHeader: FC<Props> = ({
  edit,
  onToggleEdit,
  onSave,
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
      {/* Ligne du haut : retour à l'accueil, actions de la fiche, réglages */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href="/menu-accueil"
          className="ui-btn ui-btn-ghost ui-btn-icon !w-9 !h-9 !p-1"
          aria-label={t('backToMenu')}
          title={t('backToMenu')}
        >
          <CakeLogo className="mr-0" showText={false} />
        </Link>

        <button
          onClick={edit ? onSave : onToggleEdit}
          className={`ui-btn ${edit ? 'ui-btn-primary' : ''}`}
        >
          {edit ? <Save size={14} /> : <Pencil size={14} />}
          {edit ? t('save') : t('edit')}
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

import { FC, ReactElement } from 'react'
import { useT } from '@/lib/useT'
import Link from 'next/link'
import CakeLogo from '../ui/CakeLogo'

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
}

const CharacterSheetHeader: FC<Props> = ({
  edit,
  onToggleEdit,
  onSave,
  tab,
  setTab,
  TABS,
  children,
}) => {

  const childrenArray = children ? (Array.isArray(children) ? children : [children]) : []
  const t = useT()

  return (
    <div
      className="sticky top-0 left-0 right-0 z-40 rounded-xl pb-2 pt-1.5 -mx-3 px-3 flex flex-col"
      style={{
        background: 'rgba(0,0,0,0.40)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)'
      }}
    >
      {/* Top row : logo + actions */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href="/menu-accueil"
          className="rounded-xl p-2 bg-ink/5 border border-ink/8 text-ink/80 hover:bg-ink/12 hover:text-ink transition-all duration-150 flex items-center justify-center"
        >
          <CakeLogo className="mr-0" showText={false} />
        </Link>

        <button
          onClick={edit ? onSave : onToggleEdit}
          className={`
            rounded-xl px-4 py-1.5 text-sm font-semibold border transition-all duration-150 active:scale-95
            flex items-center justify-center gap-1.5
            ${edit
              ? 'bg-emerald-600/30 border-emerald-400/30 text-emerald-200 hover:bg-emerald-500/40 hover:border-emerald-300/40'
              : 'bg-ink/6 border-ink/10 text-ink/80 hover:bg-ink/12 hover:text-ink'}
          `}
        >
          {edit ? '💾 ' + t('save') : '✏️ ' + t('edit')}
        </button>

        {childrenArray.map((child, i) => {
          const key = (child as ReactElement)?.key ?? `child-${i}`
          return <span key={String(key)} className="flex items-center">{child}</span>
        })}
      </div>

      {/* Tab row */}
      <nav className="flex gap-1 mt-2 bg-shade/20 rounded-lg p-0.5">
        {TABS.map(tItem => (
          <button
            key={tItem.key}
            className={`
              flex-1 px-2 py-1 rounded-md text-xs font-semibold transition-all duration-150
              ${tab === tItem.key
                ? 'bg-accent/80 text-on-accent shadow-sm shadow-shade/40'
                : 'text-ink/50 hover:text-ink/80 hover:bg-ink/6'}
            `}
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

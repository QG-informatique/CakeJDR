import { FC } from 'react'
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

  const childrenArray = Array.isArray(children) ? children : [children]

  return (
    <div
      className="
        sticky top-0 left-0 right-0 z-40
        rounded-xl
        border-b border-white/10
        bg-black/30
        backdrop-blur-[2px]
        shadow-lg shadow-black/20
        pb-2 pt-1 -mx-3 px-3 flex flex-col
      "
      style={{
        boxShadow: '0 4px 18px -6px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.05)'
      }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link
            href="/menu-accueil"
            className="bg-gray-800 hover:bg-gray-900 text-white rounded p-1"
          >
            <CakeLogo className="mr-0" showText={false} />
          </Link>
          {childrenArray.map((child, i) => (
            <span key={i} className="flex items-center">{child}</span>
          ))}
        </div>
        <button
          onClick={edit ? onSave : onToggleEdit}
          className={`
            rounded-xl px-5 py-2 text-sm font-semibold shadow border-none
            bg-black/30 text-white/90
            hover:bg-emerald-600 hover:text-white
            transition duration-100
            flex items-center justify-center
            min-h-[38px]
          `}
          style={{ minHeight: 38 }}
        >
          {edit ? 'Sauver' : 'Éditer'}
        </button>
      </div>
      <nav className="flex gap-2 mt-2">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`
              px-2 py-1 rounded-lg text-xs font-semibold shadow border
              border-white/10
              transition duration-100
              ${tab === t.key
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-black/20 text-blue-100/85 hover:bg-blue-900/30 hover:text-white/80'}
            `}
            style={{
              opacity: tab === t.key ? 1 : 0.82,
              borderBottom: tab === t.key ? '2px solid #4f9ddf' : '2px solid transparent'
            }}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default CharacterSheetHeader

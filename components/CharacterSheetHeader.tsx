'use client'

import { FC } from 'react'

type Tab = { key: string, label: string }

type Props = {
  edit: boolean,
  onToggleEdit: () => void,
  onSave: () => void,
  tab: string,
  setTab: (tabKey: string) => void,
  TABS: Tab[],
  children?: React.ReactNode // Pour ImportExportMenu ou autre bouton
}

const CharacterSheetHeader: FC<Props> = ({
  edit,
  onToggleEdit,
  onSave,
  tab,
  setTab,
  TABS,
  children
}) => {
  return (
    <div
      className="sticky top-0 left-0 right-0 z-40 bg-gray-900 pb-2 pt-1 -mx-3 px-3 flex flex-col"
      style={{
        boxShadow: '0 4px 14px #0007',
        borderBottom: '1px solid #222'
      }}
    >
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Personnage</h2>
        <div className="flex gap-2 items-center">
          {children /* Place ImportExportMenu ici */}
          <button
            onClick={edit ? onSave : onToggleEdit}
            className="text-xs px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white"
          >
            {edit ? 'Sauver' : 'Éditer'}
          </button>
        </div>
      </div>
      <nav className="flex gap-2 mt-2">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`px-3 py-2 rounded-t text-base font-semibold ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}
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

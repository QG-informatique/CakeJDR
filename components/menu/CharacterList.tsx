import { FC, RefObject } from 'react'
/* eslint-disable @typescript-eslint/no-explicit-any */

export type Character = {
  id: string | number
  nom: string
  owner: string
  [key: string]: any
}

interface Props {
  filtered: Character[]
  selectedIdx: number | null
  onSelect: (idx: number) => void
  onEdit: (idx: number) => void
  onDelete: (idx: number) => void
  onNew: () => void
  onImportClick: () => void
  onExport: () => void
  fileInputRef: RefObject<HTMLInputElement | null>
  onImportFile: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const CharacterList: FC<Props> = ({
  filtered,
  selectedIdx,
  onSelect,
  onEdit,
  onDelete,
  onNew,
  onImportClick,
  onExport,
  fileInputRef,
  onImportFile,
}) => (
  <section className="bg-gray-800 bg-opacity-40 rounded-lg p-6 flex-grow" style={{ overflow: 'hidden' }}>
    <h2 className="text-2xl font-bold mb-4 select-none">Vos fiches de personnage</h2>
    {filtered.length === 0 ? (
      <p>Aucune fiche sauvegardée pour ce profil.</p>
    ) : (
      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map((ch, idx) => (
          <li
            key={ch.id}
            className={`bg-gray-700 rounded p-4 flex flex-col justify-between cursor-pointer ${
              selectedIdx !== null && filtered[selectedIdx]?.id === ch.id
                ? 'ring-4 ring-green-400'
                : 'ring-0'
            } transition-ring duration-300`}
            onClick={() => onSelect(idx)}
            title={`${ch.nom} - Niveau ${ch.niveau || '?'}`}
          >
            <span className="font-semibold text-lg mb-2 truncate">{ch.nom}</span>
            <div className="flex gap-2">
              <button
                onClick={e => {
                  e.stopPropagation()
                  onEdit(idx)
                }}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-sm"
                title="Modifier la fiche"
              >
                Modifier
              </button>
              <button
                onClick={e => {
                  e.stopPropagation()
                  onDelete(idx)
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                title="Supprimer la fiche"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    )}
    <div className="mt-6 flex gap-4">
      <button onClick={onNew} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow">
        Nouvelle fiche complète
      </button>
      <button onClick={onImportClick} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded shadow">
        Importer
      </button>
      <button
        onClick={onExport}
        disabled={selectedIdx === null}
        className={`font-semibold px-6 py-2 rounded shadow ${
          selectedIdx === null ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700 text-white'
        }`}
      >
        Exporter
      </button>
      <input type="file" accept="text/plain" ref={fileInputRef} onChange={onImportFile} className="hidden" />
    </div>
  </section>
)

export default CharacterList

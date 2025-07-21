import { FC, RefObject } from 'react'
import { Edit2, Trash2, Plus, Upload, Download } from 'lucide-react'

export type Character = {
  id: string | number
  nom: string
  owner: string
  niveau?: number
  classe?: string
  sexe?: string
  race?: string
  [key: string]: unknown
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

const btnBase =
  "inline-flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg " +
  "bg-blue-900/30 hover:bg-blue-800/60 active:bg-blue-900/70 border border-blue-200/10 " +
  "transition-all shadow-sm text-blue-100 font-semibold text-sm backdrop-blur-[2px] " +
  "disabled:opacity-40 disabled:cursor-not-allowed";

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
  onImportFile
}) => {
  return (
    <section
      className="
        rounded-xl backdrop-blur-md bg-black/18 border border-white/10
        p-3 flex-grow relative overflow-hidden
      "
      style={{
        boxShadow: '0 4px 18px -8px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)'
      }}
    >
      <h2 className="text-lg font-semibold mb-2 select-none tracking-wide">
        Fiches de personnage
      </h2>

      {filtered.length === 0 ? (
        <p className="text-xs text-white/65 italic">
          Aucune fiche enregistrée.
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map((ch, idx) => {
            const isSelected =
              selectedIdx !== null && filtered[selectedIdx]?.id === ch.id
            return (
              <li
                key={`${ch.id}-${idx}`}
                onClick={() => onSelect(idx)}
                className={`
                  group relative rounded-lg p-3 cursor-pointer
                  flex flex-col gap-2 min-h-[120px] 
                  transition
                  ${isSelected
                    ? 'ring-2 ring-emerald-400/90 shadow-[0_0_12px_2px_rgba(16,185,129,0.6)]'
                    : 'hover:ring-2 hover:ring-emerald-300/40'}
                `}
                style={{
                  background:
                    'linear-gradient(145deg, rgba(34,42,60,0.42), rgba(18,23,35,0.35))',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                  boxShadow: isSelected
                    ? '0 0 0 1px rgba(255,255,255,0.06), 0 0 18px -6px rgba(16,185,129,0.45)'
                    : '0 0 0 1px rgba(255,255,255,0.03), 0 2px 6px -4px rgba(0,0,0,0.50)'
                }}
                title={ch.nom || 'Sans nom'}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="font-semibold text-sm leading-tight truncate max-w-[110px]"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {ch.nom || 'Sans nom'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onEdit(idx)
                      }}
                      className={btnBase + " hover:bg-yellow-500/90 text-yellow-100 w-8 h-8"}
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onDelete(idx)
                      }}
                      className={btnBase + " hover:bg-red-600/90 text-red-100 w-8 h-8"}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs text-white/85 mt-1">
                  {ch.niveau !== undefined && (
                    <div>
                      <span className="font-medium text-emerald-200">Niveau</span> {ch.niveau}
                    </div>
                  )}
                  {ch.classe && (
                    <div>
                      <span className="font-medium text-emerald-200">Classe</span> {ch.classe}
                    </div>
                  )}
                  {ch.sexe && (
                    <div>
                      <span className="font-medium text-emerald-200">Sexe</span> {ch.sexe}
                    </div>
                  )}
                  {ch.race && (
                    <div>
                      <span className="font-medium text-emerald-200">Race</span> {ch.race}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <button
          onClick={onNew}
          className={btnBase + " hover:bg-emerald-600/80 text-emerald-100"}
        >
          <Plus size={17} /> Nouvelle fiche
        </button>
        <button
          onClick={onImportClick}
          className={btnBase + " hover:bg-purple-700/80 text-purple-100"}
        >
          <Upload size={17} /> Importer
        </button>
        <button
          onClick={onExport}
          disabled={selectedIdx === null}
          className={
            btnBase +
            " hover:bg-emerald-600/80 text-emerald-100" +
            (selectedIdx === null
              ? " opacity-50 pointer-events-none"
              : "")
          }
        >
          <Download size={17} /> Exporter
        </button>
        <input
          type="file"
          accept="text/plain,application/json"
          ref={fileInputRef}
          onChange={onImportFile}
          className="hidden"
        />
      </div>
    </section>
  )
}

export default CharacterList

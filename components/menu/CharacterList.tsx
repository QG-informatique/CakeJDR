import { FC, RefObject } from 'react'

export type Character = {
  id: string | number
  nom: string
  owner: string
  niveau?: number
  classe?: string
  sexe?: string
  race?: string
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
                      className="
                        w-6 h-6 rounded
                        flex items-center justify-center
                        bg-amber-600/80 hover:bg-amber-500
                        text-[11px] font-bold text-white
                        transition
                      "
                      title="Modifier"
                    >
                      ✎
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onDelete(idx)
                      }}
                      className="
                        w-6 h-6 rounded
                        flex items-center justify-center
                        bg-red-600/85 hover:bg-red-500
                        text-[12px] font-bold text-white
                        transition
                      "
                      title="Supprimer"
                    >
                      ✕
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
          className="
            bg-emerald-600/80 hover:bg-emerald-500
            text-white font-semibold
            px-4 py-1.5 rounded-md
            transition shadow
            shadow-emerald-900/40
          "
        >
          Nouvelle fiche
        </button>
        <button
          onClick={onImportClick}
          className="
            bg-slate-600/70 hover:bg-slate-500/70
            text-white font-semibold
            px-4 py-1.5 rounded-md
            transition shadow shadow-black/40
          "
        >
          Importer
        </button>
        <button
          onClick={onExport}
          disabled={selectedIdx === null}
          className={`
            font-semibold px-4 py-1.5 rounded-md transition
            ${
              selectedIdx === null
                ? 'bg-slate-500/30 text-white/45 cursor-not-allowed'
                : 'bg-slate-600/70 hover:bg-slate-500/70 text-white shadow shadow-black/40'
            }
          `}
        >
          Exporter
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

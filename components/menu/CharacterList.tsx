import { FC, RefObject, useState, useEffect } from 'react'
import { Edit2, Trash2, Plus, Upload, Download, CloudUpload } from 'lucide-react'

export type Character = {
  id: string | number
  nom: string
  owner: string
  updatedAt?: number
  niveau?: number
  classe?: string
  sexe?: string
  race?: string
  [key: string]: unknown
}

interface Props {
  filtered: Character[]
  remote: Record<string, Character>
  onDownload: (char: Character) => void
  onUpload: (char: Character) => void
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
  remote,
  onDownload,
  onUpload,
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
  // Cloud import dialog state
  const [cloudOpen, setCloudOpen] = useState(false)
  const [localList, setLocalList] = useState<Character[]>([])

  useEffect(() => {
    if (!cloudOpen) return
    try {
      const list = JSON.parse(localStorage.getItem('jdr_characters') || '[]')
      setLocalList(Array.isArray(list) ? list : [])
    } catch {
      setLocalList([])
    }
  }, [cloudOpen])

  const needsDownload = (char: Character) => {
    const local = localList.find(c => String(c.id) === String(char.id))
    if (!local) return true
    return (char.updatedAt || 0) > (local.updatedAt || 0)
  }

  const CloudList = () => (
    cloudOpen ? (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setCloudOpen(false)}
        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="bg-black/80 text-white rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md p-5 w-80 max-h-[70vh] overflow-auto"
        >
          <h3 className="text-lg font-semibold mb-3">Cloud characters</h3>
          <ul className="space-y-1">
            {Object.values(remote).map((c, idx) => (
              <li key={idx} className="flex justify-between items-center gap-2">
                <span className="truncate flex-1 text-sm">{String(c.nom || (c as { name?: string }).name || `#${idx + 1}`)}</span>
                {needsDownload(c) && (
                  <button
                    onClick={() => onDownload(c)}
                    className="px-2 py-1 bg-emerald-600/70 hover:bg-emerald-600 rounded text-sm"
                  >
                    Download
                  </button>
                )}
              </li>
            ))}
            {Object.keys(remote).length === 0 && (
              <li className="text-center text-sm text-gray-400">No character</li>
            )}
          </ul>
        </div>
      </div>
    ) : null
  )

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
        Character sheets
      </h2>

      {(() => {
        const remoteOnly = Object.values(remote).filter(r => !filtered.some(c => String(c.id) === String(r.id)))
        const all = [...filtered, ...remoteOnly]
        if (all.length === 0) {
          return (
            <p className="text-xs text-white/65 italic">No sheets stored.</p>
          )
        }
        return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {all.map((ch, idx) => {
            const isSelected = selectedIdx !== null && filtered[selectedIdx]?.id === ch.id
            const localIdx = filtered.findIndex(c => String(c.id) === String(ch.id))
            const local = localIdx !== -1
            const cloudChar = remote[String(ch.id)]
            const cloud = !!cloudChar
            const outdated = local && cloud && (cloudChar.updatedAt || 0) > (filtered[localIdx].updatedAt || 0)
            return (
              <li
                key={`${ch.id}-${idx}`}
                onClick={() => onSelect(local ? filtered.findIndex(c => String(c.id)===String(ch.id)) : -1)}
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
                    title={ch.nom || 'No name'}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="font-semibold text-sm leading-tight truncate max-w-[110px]"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {ch.nom || 'No name'}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {local && !cloud && (
                      <button
                        onClick={e => { e.stopPropagation(); onUpload(ch) }}
                        className={btnBase + ' hover:bg-cyan-600/80 text-cyan-100 w-8 h-8'}
                        title="Upload"
                      >
                        <Upload size={16} />
                      </button>
                    )}
                    {(!local && cloud) || outdated ? (
                      <button
                        onClick={e => { e.stopPropagation(); onDownload(ch) }}
                        className={btnBase + ' hover:bg-emerald-600/80 text-emerald-100 w-8 h-8'}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    ) : null}
                    {local && (
                    <>
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(filtered.findIndex(c => String(c.id)===String(ch.id))) }}
                      className={btnBase + " hover:bg-yellow-500/90 text-yellow-100 w-8 h-8"}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(filtered.findIndex(c => String(c.id)===String(ch.id))) }}
                      className={btnBase + " hover:bg-red-600/90 text-red-100 w-8 h-8"}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    </>) }
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
        )
      })()}

      <div className="mt-6 flex flex-wrap gap-3 text-sm items-center">
        <button
          onClick={onNew}
          className={btnBase + " hover:bg-emerald-600/80 text-emerald-100"}
        >
          <Plus size={17} /> New sheet
        </button>
        <button
          onClick={onImportClick}
          className={btnBase + " hover:bg-purple-700/80 text-purple-100"}
        >
          <Upload size={17} /> Import
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
          <Download size={17} /> Export
        </button>
        <button
          onClick={() => setCloudOpen(true)}
          className={btnBase + ' hover:bg-pink-600/80 text-pink-100'}
        >
          <CloudUpload size={17} /> Cloud
        </button>
        <input
          type="file"
          accept="text/plain,application/json"
          ref={fileInputRef}
          onChange={onImportFile}
          className="hidden"
        />
      </div>
      <CloudList />
    </section>
  )
}

export default CharacterList

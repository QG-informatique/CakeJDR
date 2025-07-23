import { FC, RefObject, useState } from 'react'
import { Edit2, Trash2, Plus, Upload, Download, CloudUpload } from 'lucide-react'

// Utilitaire pour un nom de fichier lisible et safe
function slugify(str: string) {
  return str
    .normalize('NFD')                   // Enlève accents
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_ ]/g, '')    // Caractères safe
    .trim()
    .replace(/\s+/g, '_')
    .toLowerCase()
}

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
  // Etat de synchronisation Cloud
  const [syncing, setSyncing] = useState(false)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [syncError, setSyncError] = useState(false)
  const [showCloud, setShowCloud] = useState(false)

  // Fonction pour générer le nom de fichier avec nom lisible + id
  const getFilename = (character: Character) => {
    const namePart = character.nom ? slugify(character.nom as string) : 'sans-nom'
    return `FichePerso/${character.id}-${namePart}.json`
  }

  async function syncAllToCloud() {
    setSyncing(true)
    setSyncSuccess(false)
    setSyncError(false)
    try {
      // 1. Liste tous les fichiers déjà présents sur Blob (FichePerso/)
      const resList = await fetch('/api/blob?prefix=FichePerso/')
      const { files } = await resList.json() as { files: { pathname: string }[] }

      // 2. Liste locale des fichiers attendus (uploadés) selon ta liste
      const localFilenames = filtered.map(getFilename)

      // 3. Pour chaque fichier existant sur Blob mais absent en local → on supprime
      const deletes = files
        .filter(f => !localFilenames.includes(f.pathname))
        .map(f =>
          fetch(`/api/blob?filename=${encodeURIComponent(f.pathname)}`, { method: 'DELETE' })
        )
      await Promise.all(deletes)

      // 4. Upload toutes les fiches locales
      const uploads = filtered.map(character => {
        const filename = getFilename(character)
        const blob = new Blob([JSON.stringify(character)], { type: 'application/json' })
        return fetch(`/api/blob?filename=${encodeURIComponent(filename)}`, {
          method: 'POST',
          body: blob,
        }).then(res => res.json())
      })
      const results = await Promise.all(uploads)
      if (results.every(r => r.url)) {
        setSyncSuccess(true)
        setTimeout(() => setSyncSuccess(false), 2000)
      } else {
        setSyncError(true)
        setTimeout(() => setSyncError(false), 2000)
      }
    } catch {
      setSyncError(true)
      setTimeout(() => setSyncError(false), 2000)
    }
    setSyncing(false)
  }

  async function importFromCloud() {
    try {
      const res = await fetch('/api/blob?prefix=FichePerso/')
      const { files } = await res.json() as { files: { pathname: string, downloadUrl?: string, url?: string }[] }
      const names = files.map(f => f.pathname)
      const choice = window.prompt('Choisir un fichier à importer:\n' + names.join('\n'))
      if (!choice) return
      const file = files.find(f => f.pathname === choice)
      if (!file) return
      const url = file.downloadUrl || file.url
      if (!url) return
      const text = await fetch(url).then(r => r.text())
      const data = JSON.parse(text)
      const stored = JSON.parse(localStorage.getItem('jdr_characters') || '[]') as Character[]
      const withId = { ...data, id: data.id || crypto.randomUUID() }
      localStorage.setItem('jdr_characters', JSON.stringify([...stored, withId]))
      window.dispatchEvent(new Event('jdr_characters_change'))
      alert('Fiche importée !')
    } catch {
      alert('Import échoué')
    }
  }

  const handleCloudExport = async () => {
    await syncAllToCloud()
    setShowCloud(false)
  }

  const handleCloudImport = async () => {
    await importFromCloud()
    setShowCloud(false)
  }

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

      {filtered.length === 0 ? (
        <p className="text-xs text-white/65 italic">
          No sheets stored.
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
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onEdit(idx)
                      }}
                      className={btnBase + " hover:bg-yellow-500/90 text-yellow-100 w-8 h-8"}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onDelete(idx)
                      }}
                      className={btnBase + " hover:bg-red-600/90 text-red-100 w-8 h-8"}
                      title="Delete"
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
        {/* Bouton Cloud ouvrant un petit menu */}
        <div className="relative">
          <button
            onClick={() => setShowCloud(v => !v)}
            className={
              btnBase +
              " hover:bg-pink-600/80 text-pink-100 font-bold flex items-center gap-2"
            }
            title="Cloud options"
          >
            <CloudUpload size={18} />
            Cloud
          </button>
          {showCloud && (
            <div className="absolute left-0 top-full mt-2 z-50 w-44 bg-black/75 border border-white/20 rounded-xl shadow-2xl backdrop-blur-md p-2 flex flex-col gap-1">
              <button onClick={handleCloudImport} className="px-3 py-1 text-left hover:bg-gray-800 rounded">Import from Cloud</button>
              <button onClick={handleCloudExport} className="px-3 py-1 text-left hover:bg-gray-800 rounded">Export to Cloud</button>
            </div>
          )}
        </div>
        {/* Indicateur de synchronisation */}
        {syncing && <span className="ml-1 animate-pulse">⏳</span>}
        {syncSuccess && <span className="ml-1 text-emerald-400">✔</span>}
        {syncError && <span className="ml-1 text-red-400">✖</span>}
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

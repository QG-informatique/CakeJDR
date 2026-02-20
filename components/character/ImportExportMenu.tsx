'use client'

import { FC, useRef, useState, useEffect } from 'react'
import { useT } from '@/lib/useT'
import { Folder } from 'lucide-react'
import { defaultPerso } from '../sheet/CharacterSheet'
import {
  type Character,
  buildCharacterKey,
  normalizeCharacter,
} from '@/types/character'

type Props = {
  perso: Character
  onUpdate: (perso: Character) => void
}

const LOCAL_KEY = 'cakejdr_perso'
const CHAR_LIST_KEY = 'jdr_characters'

const addToList = (char: Character) => {
  try {
    const listRaw = localStorage.getItem(CHAR_LIST_KEY) || '[]'
    const parsed = JSON.parse(listRaw)
    const current = Array.isArray(parsed)
      ? parsed.map((c) => normalizeCharacter(c))
      : []
    const normalized = normalizeCharacter({
      ...char,
      name: (char as { name?: string }).name || char.nom,
    })
    const key = buildCharacterKey(normalized)
    const idx = current.findIndex((c) => buildCharacterKey(c) === key)
    const updated =
      idx !== -1
        ? current.map((c, i) => (i === idx ? normalized : c))
        : [...current, normalized]
    localStorage.setItem(CHAR_LIST_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('jdr_characters_change'))
  } catch {
    /* empty */
  }
}

const ImportExportMenu: FC<Props> = ({ perso, onUpdate }) => {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<'import' | 'export' | 'delete' | null>(null)
  const [cloudFiles, setCloudFiles] = useState<string[]>([])
  const [localChars, setLocalChars] = useState<Character[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const t = useT()

  useEffect(() => {
    if (!modal) return
    const roomId = (() => {
      try {
        const r = JSON.parse(localStorage.getItem('jdr_selected_room') || '{}')
        return r.id || 'global'
      } catch { return 'global' }
    })()
    // Lister tous les fichiers de la room, peu importe l'owner
    const prefix = `FichePerso/${roomId}_`
    if (modal === 'import' || modal === 'delete') {
      fetch(`/api/blob?prefix=${encodeURIComponent(prefix)}`)
        .then(res => res.json())
        .then(data => setCloudFiles(data.files?.blobs?.map((b: { pathname: string }) => b.pathname) || []))
        .catch(() => setCloudFiles([]))
    }
    if (modal === 'export') {
      try {
        const list = JSON.parse(localStorage.getItem(CHAR_LIST_KEY) || '[]')
        setLocalChars(
          Array.isArray(list)
            ? list.map((c: Character) => normalizeCharacter(c))
            : [],
        )
      } catch { setLocalChars([]) }
    }
  }, [modal, perso.owner])

  // Export fiche
  const handleExport = () => {
    const txt = JSON.stringify(perso, null, 2)
    const blob = new Blob([txt], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `perso_${perso.nom || 'sans_nom'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  // Import fiche
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const txt = ev.target?.result as string
        const data = JSON.parse(txt)
        if (!data || typeof data !== "object") throw new Error()
        const normalized = normalizeCharacter({
          ...data,
          id: (data as Character).id || crypto.randomUUID(),
        })
        onUpdate(normalized)
        addToList(normalized)
        alert(t('importSuccess'))
      } catch {
        alert(t('importFail'))
        // onUpdate({ ...defaultPerso }) // Optionnel : reset fiche si import KO
      }
    }
    reader.readAsText(file)
    setOpen(false)
  }

  // Sauvegarde locale
  const handleLocalSave = () => {
    const normalized = normalizeCharacter(perso)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(normalized))
    alert(t('saveLocallyMsg'))
    setOpen(false)
  }

  // Chargement local
  const handleLocalLoad = () => {
    const data = localStorage.getItem(LOCAL_KEY)
    if (data) {
      try {
        const obj = JSON.parse(data)
        if (!obj || typeof obj !== "object") throw new Error()
        const normalized = normalizeCharacter({
          ...obj,
          id: (obj as Character).id || crypto.randomUUID(),
        })
        onUpdate(normalized)
        addToList(normalized)
        alert(t('loadLocalSuccess'))
      } catch {
        alert(t('loadLocalFail'))
        // onUpdate({ ...defaultPerso }) // Optionnel : reset si load KO
      }
    } else {
      alert(t('noSave'))
    }
    setOpen(false)
  }

  const saveToCloud = async (char: Character) => {
    const normalized = normalizeCharacter(
      { ...char, updatedAt: Date.now() },
      char.owner,
    )
    const slug = (normalized.nom || (normalized as { name?: string }).name || 'sans_nom').replace(/[^a-zA-Z0-9-_]/g, '_')
    const roomId = (() => {
      try {
        const r = JSON.parse(localStorage.getItem('jdr_selected_room') || '{}')
        return r.id || 'global'
      } catch { return 'global' }
    })()
    const owner = normalized.owner || 'anon'
    const filename = `FichePerso/${roomId}_${owner}_${normalized.id}_${slug}.json`
    try {
      const res = await fetch(`/api/blob?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        body: JSON.stringify(normalized),
      })
      if (!res.ok) throw new Error('upload failed')
      alert(t('saveCloud'))
      setModal(null)
    } catch {
      alert(t('saveCloudFail'))
    }
  }

  const loadFromCloud = async (filename: string) => {
    try {
      const res = await fetch(`/api/blob?prefix=${encodeURIComponent(filename)}`)
      if (!res.ok) throw new Error('list failed')
      const data = await res.json()
      const item = data.files?.blobs?.find((b: { pathname: string }) => b.pathname===filename)
      if (!item) throw new Error('file not found')
      const blobRes = await fetch(item.downloadUrl || item.url)
      if (!blobRes.ok) throw new Error('download failed')
      const txt = await blobRes.text()
      const obj = JSON.parse(txt)
      const normalized = normalizeCharacter({
        ...obj,
        id: (obj as Character).id || crypto.randomUUID(),
      })
      onUpdate(normalized)
      addToList(normalized)
      alert(t('loadCloudSuccess'))
    } catch {
      alert(t('loadCloudFail'))
    }
    setModal(null)
  }

  const deleteFromCloud = async (filename: string) => {
    try {
      const res = await fetch(`/api/blob?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('delete failed')
      setCloudFiles(f => f.filter(fl => fl !== filename))
      alert(t('deleted'))
      setModal(null)
    } catch {
      alert(t('deleteCloudFail'))
    }
  }

  // Reset sheet
  const handleReset = () => {
    if (window.confirm("Really reset the sheet? (This will delete it)")) {
      onUpdate(
        normalizeCharacter({ ...defaultPerso, id: crypto.randomUUID() }),
      )
      setOpen(false)
    }
  }

  return (
    <div className="relative inline-block ml-2">
      <button
        className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded shadow transition-all"
        onClick={() => setOpen(v => !v)}
        aria-label="Import / Export"
      >
        <Folder size={16} />
      </button>
      {open && (
        <div className="absolute top-full left-full mt-2 ml-2 z-50 w-56 bg-black/35 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl py-2 flex flex-col gap-1 animate-fadeIn">
          <button onClick={handleExport} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">📤 {t('exportSheet')}</button>
          <label className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm cursor-pointer">
            📥 {t('importSheet')}
            <input type="file" ref={inputRef} accept=".txt,.json" style={{ display: 'none' }} onChange={handleImport} />
          </label>

          <button onClick={handleLocalSave} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">💾 {t('saveLocally')}</button>
          <button onClick={handleLocalLoad} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">📂 {t('loadLocal')}</button>
          <button onClick={() => { setModal('export'); setOpen(false) }} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">☁️ {t('exportCloud')}</button>
          <button onClick={() => { setModal('import'); setOpen(false) }} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">☁️ {t('importCloud')}</button>
          <button onClick={() => { setModal('delete'); setOpen(false) }} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">🗑 {t('deleteCloud')}</button>

          <hr className="my-1 border-gray-600" />
          <button onClick={handleReset} className="w-full px-3 py-1 rounded hover:bg-red-700 bg-red-600 text-white text-left text-sm">🗑 {t('resetSheet')}</button>
        </div>
      )}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeInMenu .18s;
        }
        @keyframes fadeInMenu {
          from { opacity: 0; transform: translateY(12px);}
          to   { opacity: 1; transform: translateY(0);}
        }
      `}</style>
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-black/80 text-white rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md p-5 w-80 max-h-[70vh] overflow-auto"
          >
            {modal === 'import' && (
              <>
                <h3 className="text-lg font-semibold mb-3">{t('importFromCloud')}</h3>
                <ul className="space-y-1">
                  {cloudFiles.map((f) => (
                    <li key={f}>
                      <button
                        onClick={() => loadFromCloud(f)}
                        className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm"
                      >
                        {f.replace('FichePerso/', '')}
                      </button>
                    </li>
                  ))}
                  {cloudFiles.length === 0 && (
                    <li className="text-center text-sm text-gray-400">{t('noFile')}</li>
                  )}
                </ul>
              </>
            )}
            {modal === 'export' && (
              <>
                <h3 className="text-lg font-semibold mb-3">{t('exportToCloud')}</h3>
                <ul className="space-y-1">
                  {localChars.map((c) => (
                    <li key={c.id}>
                      <button
                        onClick={() => saveToCloud(c)}
                        className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm"
                      >
                        {c.nom || c.name || `#${c.id}`}
                      </button>
                    </li>
                  ))}
                  {localChars.length === 0 && (
                    <li className="text-center text-sm text-gray-400">{t('noCharacter')}</li>
                  )}
                </ul>
              </>
            )}
            {modal === 'delete' && (
              <>
                <h3 className="text-lg font-semibold mb-3">{t('deleteFromCloud')}</h3>
                <ul className="space-y-1">
                  {cloudFiles.map((f) => (
                    <li key={f} className="flex justify-between items-center gap-2">
                      <span className="truncate flex-1">{f.replace('FichePerso/', '')}</span>
                      <button
                        onClick={() => deleteFromCloud(f)}
                        className="px-2 py-1 bg-red-700/50 hover:bg-red-700/80 rounded text-sm"
                      >
                        {t('delete')}
                      </button>
                    </li>
                  ))}
                  {cloudFiles.length === 0 && (
                    <li className="text-center text-sm text-gray-400">{t('noFile')}</li>
                  )}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportExportMenu

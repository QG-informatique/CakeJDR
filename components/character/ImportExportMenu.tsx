'use client'

import { FC, useRef, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useT } from '@/lib/useT'
import { Folder } from 'lucide-react'
import { defaultPerso } from '../sheet/CharacterSheet'
import ConfirmDialog from '../ui/ConfirmDialog'
import {
  type Character,
  buildCharacterKey,
  normalizeCharacter,
} from '@/types/character'
import {
  deleteAccountCharacter,
  listAccountCharacters,
  saveAccountCharacter,
} from '@/lib/charactersApi'

type Props = {
  perso: Character
  onUpdate: (perso: Character) => void
}

const LOCAL_KEY = 'cakejdr_perso'
const CHAR_LIST_KEY = 'jdr_characters'
// Une fiche fait quelques Ko : 1 Mo laisse de la marge sans laisser passer
// n'importe quel fichier choisi par erreur.
const MAX_IMPORT_BYTES = 1024 * 1024

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
  const [cloudChars, setCloudChars] = useState<Character[]>([])
  const [localChars, setLocalChars] = useState<Character[]>([])
  const [confirmReset, setConfirmReset] = useState(false)
  const [toDelete, setToDelete] = useState<Character | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const t = useT()
  // La sauvegarde en ligne est rattachée au compte : un visiteur de la salle
  // de démonstration n'y a pas accès. Le serveur le refuse de toute façon ;
  // masquer les boutons évite juste de proposer une action vouée à l'échec.
  const isSignedIn = useSession().status === 'authenticated'

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!modal) return
    if (modal === 'import' || modal === 'delete') {
      listAccountCharacters()
        .then(setCloudChars)
        .catch(() => setCloudChars([]))
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
  }, [modal])

  // Export fiche
  const handleExport = () => {
    const txt = JSON.stringify(perso, null, 2)
    const blob = new Blob([txt], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = (perso.nom || 'sans_nom').replace(/[\\/:*?"<>|]+/g, '_')
    a.download = `perso_${safeName}.json`
    a.click()
    // Révoquer tout de suite peut annuler le téléchargement sur certains navigateurs.
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setOpen(false)
  }

  // Import fiche
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Vider le champ permet de réimporter le même fichier juste après.
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_IMPORT_BYTES) {
      alert(t('importTooBig'))
      setOpen(false)
      return
    }
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
      }
    } else {
      alert(t('noSave'))
    }
    setOpen(false)
  }

  const saveToCloud = async (char: Character) => {
    try {
      await saveAccountCharacter(
        normalizeCharacter({ ...char, updatedAt: Date.now() }, char.owner),
      )
      alert(t('saveCloud'))
      setModal(null)
    } catch {
      alert(t('saveCloudFail'))
    }
  }

  const loadFromCloud = (char: Character) => {
    const normalized = normalizeCharacter({
      ...char,
      id: char.id || crypto.randomUUID(),
    })
    onUpdate(normalized)
    addToList(normalized)
    alert(t('loadCloudSuccess'))
    setModal(null)
  }

  const deleteFromCloud = async (char: Character) => {
    try {
      await deleteAccountCharacter(String(char.id))
      setCloudChars((list) => list.filter((c) => c.id !== char.id))
      alert(t('deleted'))
      setModal(null)
    } catch {
      alert(t('deleteCloudFail'))
    }
  }

  // Reset sheet
  const handleReset = () => {
    onUpdate(
      normalizeCharacter({ ...defaultPerso, id: crypto.randomUUID() }),
    )
    setConfirmReset(false)
  }

  return (
    <div ref={containerRef} className="relative inline-block ml-2">
      <button
        className="bg-surface hover:bg-surface-hover text-ink p-2 rounded shadow transition-all"
        onClick={() => setOpen(v => !v)}
        aria-label="Import / Export"
      >
        <Folder size={16} />
      </button>
      {open && (
        <div className="absolute top-full left-full mt-2 ml-2 z-50 w-56 bg-shade/35 backdrop-blur-md border border-ink/10 rounded-xl shadow-2xl py-2 flex flex-col gap-1 animate-fadeIn">
          <button onClick={handleExport} className="w-full px-3 py-1 rounded hover:bg-surface text-left text-sm">📤 {t('exportSheet')}</button>
          <label className="w-full px-3 py-1 rounded hover:bg-surface text-left text-sm cursor-pointer">
            📥 {t('importSheet')}
            <input type="file" ref={inputRef} accept=".txt,.json" style={{ display: 'none' }} onChange={handleImport} />
          </label>

          <button onClick={handleLocalSave} className="w-full px-3 py-1 rounded hover:bg-surface text-left text-sm">💾 {t('saveLocally')}</button>
          <button onClick={handleLocalLoad} className="w-full px-3 py-1 rounded hover:bg-surface text-left text-sm">📂 {t('loadLocal')}</button>
          {isSignedIn && (
            <>
              <button onClick={() => { setModal('export'); setOpen(false) }} className="w-full px-3 py-1 rounded hover:bg-surface text-left text-sm">☁️ {t('exportCloud')}</button>
              <button onClick={() => { setModal('import'); setOpen(false) }} className="w-full px-3 py-1 rounded hover:bg-surface text-left text-sm">☁️ {t('importCloud')}</button>
              <button onClick={() => { setModal('delete'); setOpen(false) }} className="w-full px-3 py-1 rounded hover:bg-surface text-left text-sm">🗑 {t('deleteCloud')}</button>
            </>
          )}

          <hr className="my-1 border-line-strong" />
          <button onClick={() => { setConfirmReset(true); setOpen(false) }} className="w-full px-3 py-1 rounded hover:bg-red-700 bg-red-600 text-white text-left text-sm">🗑 {t('resetSheet')}</button>
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
      <ConfirmDialog
        open={confirmReset}
        message={t('resetSheetConfirm')}
        confirmLabel={t('resetSheet')}
        danger
        onConfirm={handleReset}
        onCancel={() => setConfirmReset(false)}
      />
      <ConfirmDialog
        open={toDelete !== null}
        message={t('deleteCloudConfirm').replace('{n}', toDelete?.nom || toDelete?.name || `#${toDelete?.id}`)}
        confirmLabel={t('delete')}
        danger
        onConfirm={() => {
          if (toDelete) deleteFromCloud(toDelete)
          setToDelete(null)
        }}
        onCancel={() => setToDelete(null)}
      />
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setModal(null)}
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-shade/80 text-ink rounded-2xl border border-ink/10 shadow-2xl backdrop-blur-md p-5 w-80 max-h-[70vh] overflow-auto"
          >
            {modal === 'import' && (
              <>
                <h3 className="text-lg font-semibold mb-3">{t('importFromCloud')}</h3>
                <ul className="space-y-1">
                  {cloudChars.map((c) => (
                    <li key={String(c.id)}>
                      <button
                        onClick={() => loadFromCloud(c)}
                        className="w-full px-3 py-1 rounded hover:bg-surface text-left text-sm"
                      >
                        {c.nom || c.name || `#${c.id}`}
                      </button>
                    </li>
                  ))}
                  {cloudChars.length === 0 && (
                    <li className="text-center text-sm text-ink/55">{t('noFile')}</li>
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
                        className="w-full px-3 py-1 rounded hover:bg-surface text-left text-sm"
                      >
                        {c.nom || c.name || `#${c.id}`}
                      </button>
                    </li>
                  ))}
                  {localChars.length === 0 && (
                    <li className="text-center text-sm text-ink/55">{t('noCharacter')}</li>
                  )}
                </ul>
              </>
            )}
            {modal === 'delete' && (
              <>
                <h3 className="text-lg font-semibold mb-3">{t('deleteFromCloud')}</h3>
                <ul className="space-y-1">
                  {cloudChars.map((c) => (
                    <li key={String(c.id)} className="flex justify-between items-center gap-2">
                      <span className="truncate flex-1">{c.nom || c.name || `#${c.id}`}</span>
                      <button
                        onClick={() => setToDelete(c)}
                        className="px-2 py-1 bg-red-700/50 hover:bg-red-700/80 rounded text-sm"
                      >
                        {t('delete')}
                      </button>
                    </li>
                  ))}
                  {cloudChars.length === 0 && (
                    <li className="text-center text-sm text-ink/55">{t('noFile')}</li>
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

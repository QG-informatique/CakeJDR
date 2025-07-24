'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FC, useRef, useState } from 'react'
import { Folder } from 'lucide-react'
import { defaultPerso } from '../sheet/CharacterSheet' // <-- AJOUT

type Props = {
  perso: any,
  onUpdate: (perso: any) => void
}

const LOCAL_KEY = 'cakejdr_perso'
const CHAR_LIST_KEY = 'jdr_characters'

const addToList = (char: any) => {
  try {
    const list = JSON.parse(localStorage.getItem(CHAR_LIST_KEY) || '[]')
    const withName = { ...char, name: char.name || char.nom }
    const exists = list.find((c: any) => c.id === withName.id)
    const updated = exists
      ? list.map((c: any) => c.id === withName.id ? withName : c)
      : [...list, withName]
    localStorage.setItem(CHAR_LIST_KEY, JSON.stringify(updated))
    window.dispatchEvent(new Event('jdr_characters_change'))
  } catch {
    /* empty */
  }
}

const ImportExportMenu: FC<Props> = ({ perso, onUpdate }) => {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
        onUpdate(data)
        addToList({ ...data, id: data.id || crypto.randomUUID() })
        alert('Sheet imported successfully!')
      } catch {
        alert('Import failed: file must be a JSON text file.')
        // onUpdate({ ...defaultPerso }) // Optionnel : reset fiche si import KO
      }
    }
    reader.readAsText(file)
    setOpen(false)
  }

  // Sauvegarde locale
  const handleLocalSave = () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(perso))
    alert('Sheet saved locally!')
    setOpen(false)
  }

  // Chargement local
  const handleLocalLoad = () => {
    const data = localStorage.getItem(LOCAL_KEY)
    if (data) {
      try {
        const obj = JSON.parse(data)
        if (!obj || typeof obj !== "object") throw new Error()
        onUpdate(obj)
        addToList({ ...obj, id: obj.id || crypto.randomUUID() })
        alert('Sheet loaded from local save!')
      } catch {
        alert('Failed to load local save.')
        // onUpdate({ ...defaultPerso }) // Optionnel : reset si load KO
      }
    } else {
      alert('No save found.')
    }
    setOpen(false)
  }

  // Sauvegarde Cloud
  const handleCloudSave = async () => {
    const slug = (perso.nom || 'sans_nom').replace(/[^a-zA-Z0-9-_]/g, '_')
    const filename = `FichePerso/${slug}.json`
    await fetch(`/api/blob?filename=${encodeURIComponent(filename)}`, {
      method: 'POST',
      body: JSON.stringify(perso),
    })
    alert('Sheet saved to cloud!')
    setOpen(false)
  }

  // Chargement Cloud
  const handleCloudLoad = async () => {
    const res = await fetch('/api/blob')
    const data = await res.json()
    const files: string[] = data.files?.blobs?.map((b:any)=>b.pathname) || []
    const name = window.prompt('Nom du perso à restaurer?\n'+files.join('\n'))
    if (!name) return
    const item = data.files.blobs.find((b:any)=>b.pathname===name)
    if (!item) return
    const txt = await fetch(item.downloadUrl || item.url).then(r=>r.text())
    try {
      const obj = JSON.parse(txt)
      onUpdate(obj)
      addToList({ ...obj, id: obj.id || crypto.randomUUID() })
      alert('Sheet loaded!')
    } catch {
      alert('Cloud load failed.')
    }
    setOpen(false)
  }

  // Reset fiche
  const handleReset = () => {
    if (window.confirm("Vraiment réinitialiser la fiche ? (Suppression irréversible)")) {
      onUpdate({ ...defaultPerso }) // <-- MODIF ICI !
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
          <button onClick={handleExport} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">📤 Export sheet</button>
          <label className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm cursor-pointer">
            📥 Import sheet
            <input type="file" ref={inputRef} accept=".txt,.json" style={{ display: 'none' }} onChange={handleImport} />
          </label>

          <button onClick={handleLocalSave} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">💾 Save locally</button>
          <button onClick={handleLocalLoad} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">📂 Load local save</button>
          <button onClick={handleCloudSave} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">☁️ Save to cloud</button>
          <button onClick={handleCloudLoad} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">☁️ Load from cloud</button>

          <hr className="my-1 border-gray-600" />
          <button onClick={handleReset} className="w-full px-3 py-1 rounded hover:bg-red-700 bg-red-600 text-white text-left text-sm">🗑 Reset sheet</button>
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
    </div>
  )
}

export default ImportExportMenu

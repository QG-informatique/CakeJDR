'use client'

import { FC, useRef, useState } from 'react'
import { defaultPerso } from './CharacterSheet' // <-- AJOUT

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  perso: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUpdate: (perso: any) => void
}

const LOCAL_KEY = 'cakejdr_perso'

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
        alert('Fiche importée avec succès !')
      } catch {
        alert('Erreur lors de l\'import : le fichier doit être un fichier texte au format JSON.')
        // onUpdate({ ...defaultPerso }) // Optionnel : reset fiche si import KO
      }
    }
    reader.readAsText(file)
    setOpen(false)
  }

  // Sauvegarde locale
  const handleLocalSave = () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(perso))
    alert('Fiche sauvegardée localement !')
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
        alert('Fiche chargée depuis la sauvegarde locale !')
      } catch {
        alert('Erreur lors du chargement local.')
        // onUpdate({ ...defaultPerso }) // Optionnel : reset si load KO
      }
    } else {
      alert('Aucune sauvegarde trouvée.')
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
        className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded shadow transition-all"
        onClick={() => setOpen(v => !v)}
      >
        Import/Export
      </button>
      {open && (
        <div className="absolute right-0 mt-2 z-50 w-56 bg-[#18181b] border border-gray-700 rounded-xl shadow-2xl py-2 flex flex-col gap-1 animate-fadeIn">
          <button onClick={handleExport} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">📤 Exporter la fiche</button>
          <label className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm cursor-pointer">
            📥 Importer une fiche
            <input type="file" ref={inputRef} accept=".txt,.json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <button onClick={handleLocalSave} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">💾 Sauver localement</button>
          <button onClick={handleLocalLoad} className="w-full px-3 py-1 rounded hover:bg-gray-800 text-left text-sm">📂 Charger la sauvegarde</button>
          <hr className="my-1 border-gray-600" />
          <button onClick={handleReset} className="w-full px-3 py-1 rounded hover:bg-red-700 bg-red-600 text-white text-left text-sm">🗑 Réinitialiser fiche</button>
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

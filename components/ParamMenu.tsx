import { FC, useRef, useState } from 'react'
// Emoji à la place de lucide-react pour l'icône
const CogIcon = () => <span style={{ fontSize: 24, lineHeight: 1 }}>⚙️</span>

type Props = {
  perso: any,
  onUpdate: (perso: any) => void
}

const LOCAL_KEY = 'cakejdr_perso'

const ParamMenu: FC<Props> = ({ perso, onUpdate }) => {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Export TXT
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

  // Import TXT
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const txt = ev.target?.result as string
        const data = JSON.parse(txt)
        onUpdate(data)
        alert('Fiche importée avec succès !')
      } catch {
        alert('Erreur lors de l\'import : le fichier doit être un fichier texte au format JSON.')
      }
    }
    reader.readAsText(file)
    setOpen(false)
  }

  // Save local
  const handleLocalSave = () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(perso))
    alert('Fiche sauvegardée localement !')
    setOpen(false)
  }

  // Load local
  const handleLocalLoad = () => {
    const data = localStorage.getItem(LOCAL_KEY)
    if (data) {
      try {
        const obj = JSON.parse(data)
        onUpdate(obj)
        alert('Fiche chargée depuis la sauvegarde locale !')
      } catch {
        alert('Erreur lors du chargement local.')
      }
    } else {
      alert('Aucune sauvegarde trouvée.')
    }
    setOpen(false)
  }

  // Exemple de paramètre supplémentaire (reset fiche)
  const handleReset = () => {
    if (window.confirm("Vraiment réinitialiser la fiche ? (Suppression irréversible)")) {
      onUpdate({})
      setOpen(false)
    }
  }

  return (
    <div className="parammenu-container">
      <button
        className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full shadow-lg transition-all"
        onClick={() => setOpen(v => !v)}
        title="Paramètres"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <CogIcon />
      </button>
      {open && (
        <div className="param-dropdown">
          <button onClick={handleExport} className="w-full px-2 py-1 rounded hover:bg-gray-800 text-left text-sm">📤 Exporter la fiche</button>
          <label className="w-full px-2 py-1 rounded hover:bg-gray-800 text-left text-sm cursor-pointer">
            📥 Importer une fiche
            <input type="file" ref={inputRef} accept=".txt,.json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
          <button onClick={handleLocalSave} className="w-full px-2 py-1 rounded hover:bg-gray-800 text-left text-sm">💾 Sauver localement</button>
          <button onClick={handleLocalLoad} className="w-full px-2 py-1 rounded hover:bg-gray-800 text-left text-sm">📂 Charger la sauvegarde</button>
          <hr className="my-1 border-gray-600" />
          <button onClick={handleReset} className="w-full px-2 py-1 rounded hover:bg-red-700 bg-red-600 text-white text-left text-sm">🗑 Réinitialiser fiche</button>
        </div>
      )}
      <style jsx>{`
        .parammenu-container {
          position: absolute;
          left: 0; right: 0; bottom: 10px;
          display: flex;
          justify-content: center;
          width: 100%;
          z-index: 20;
          pointer-events: none; /* pour ne pas gêner le contenu */
        }
        .parammenu-container > button {
          pointer-events: auto;
        }
        .param-dropdown {
          position: absolute;
          bottom: 48px;
          left: 50%;
          transform: translateX(-50%);
          width: 220px;
          background: #18181b;
          border: 1px solid #333;
          border-radius: 10px;
          box-shadow: 0 8px 32px rgba(0,0,0,.23);
          padding: 8px 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 100;
          animation: fadeInDown 0.17s;
          pointer-events: auto;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(30px);}
          to   { opacity: 1; transform: translateY(0);}
        }
      `}</style>
    </div>
  )
}

export default ParamMenu

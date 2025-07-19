'use client'
import { useState, useEffect, useRef } from 'react'
// Déplacement fichier pour organisation
import Login from '../login/Login'
// Déplacement fichier pour organisation
import CharacterSheet, { defaultPerso } from '../character/CharacterSheet'

const PROFILE_KEY = 'jdr_profile'

const COLORS = [
  '#e11d48',
  '#1d4ed8',
  '#16a34a',
  '#f59e0b',
  '#d946ef',
  '#0d9488',
  '#f97316',
  '#a3a3a3',
  '#ffffff',
  '#000000'
]

type Character = {
  id: number
  nom: string
  owner: string
  [key: string]: any
}

export default function MenuAccueil() {
  const [user, setUser] = useState<{ pseudo: string; isMJ: boolean; color: string } | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [draftChar, setDraftChar] = useState<Character>(defaultPerso as Character)
  const [hydrated, setHydrated] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setHydrated(true)
    try {
      const saved = localStorage.getItem(PROFILE_KEY)
      if (saved) {
        const prof = JSON.parse(saved)
        if (prof.pseudo) {
          setUser({ pseudo: prof.pseudo, isMJ: !!prof.isMJ, color: prof.color || '#1d4ed8' })
        }
      }
    } catch {}
    try {
      const savedChars = JSON.parse(localStorage.getItem('jdr_characters') || '[]')
      if (Array.isArray(savedChars)) setCharacters(savedChars)
    } catch {}
  }, [])

  // Sync profil MJ + couleur
  useEffect(() => {
    const update = () => {
      try {
        const saved = localStorage.getItem(PROFILE_KEY)
        if (saved) {
          const prof = JSON.parse(saved)
          if (prof.pseudo) {
            setUser({ pseudo: prof.pseudo, isMJ: !!prof.isMJ, color: prof.color || '#1d4ed8' })
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
    }
    window.addEventListener('storage', update)
    window.addEventListener('jdr_profile_change', update as EventListener)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('jdr_profile_change', update as EventListener)
    }
  }, [])

  const saveCharacters = (chars: Character[]) => {
    localStorage.setItem('jdr_characters', JSON.stringify(chars))
    setCharacters(chars)
  }

  const handleSelectChar = (idx: number) => setSelectedIdx(idx)
  const handleNewCharacter = () => {
    if (!user) return
    setDraftChar({ ...defaultPerso, id: Date.now(), owner: user.pseudo })
    setModalOpen(true)
  }
  const handleEditCharacter = (idx: number) => {
    setDraftChar(characters[idx])
    setModalOpen(true)
  }
  const handleSaveDraft = () => {
    if (!user) return
    const toSave = { ...draftChar, nom: draftChar.nom || 'Sans nom', owner: user.pseudo }
    let updated
    if (draftChar.id && characters.findIndex(c => c.id === draftChar.id) !== -1) {
      updated = characters.map(c => (c.id === draftChar.id ? toSave : c))
    } else {
      updated = [...characters, toSave]
    }
    saveCharacters(updated)
    setModalOpen(false)
    setSelectedIdx(updated.findIndex(c => c.id === toSave.id))
  }
  const handleDeleteChar = (idx: number) => {
    if (!window.confirm('Supprimer cette fiche ?')) return
    const updated = characters.filter((_, i) => i !== idx)
    saveCharacters(updated)
    setSelectedIdx(null)
  }
  const handleImportClick = () => fileInputRef.current?.click()
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const text = evt.target?.result as string
        const imported = JSON.parse(text)
        if (!imported.owner && user) imported.owner = user.pseudo
        const updated = [...characters, imported]
        saveCharacters(updated)
        alert('Fiche importée !')
      } catch {
        alert('Erreur : fichier invalide.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }
  const handleExportChar = () => {
    if (selectedIdx === null) return
    const char = characters[selectedIdx]
    const blob = new Blob([JSON.stringify(char, null, 2)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(char.nom || 'fiche').replace(/\s+/g, '_')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  const handleLogout = () => {
    localStorage.removeItem(PROFILE_KEY)
    setUser(null)
    setSelectedIdx(null)
  }

  const filteredCharacters = user
    ? user.isMJ
      ? characters
      : characters.filter(c => c.owner === user.pseudo)
    : []

  const handleChangeColor = (color: string) => {
    if (!user) return
    const newUser = { ...user, color }
    setUser(newUser)
    try {
      const profRaw = localStorage.getItem(PROFILE_KEY)
      if (!profRaw) return
      const prof = JSON.parse(profRaw)
      prof.color = color
      localStorage.setItem(PROFILE_KEY, JSON.stringify(prof))
      window.dispatchEvent(new Event('jdr_profile_change'))
    } catch {}
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900" />
    )
  }

  return (
    <div
      className="min-h-screen relative bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-4 flex flex-col max-w-6xl mx-auto"
      style={{ height: '100vh', overflow: 'hidden' }}
    >
      {/* Fond dés en SVG */}
      <div className="absolute inset-0 pointer-events-none -z-10 select-none">
        <svg
          className="w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          viewBox="0 0 100 100"
        >
          {[...Array(20)].map((_, i) => {
            const x = (i * 5) % 100
            const y = (i * 10) % 100
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={5}
                height={5}
                fill="white"
                opacity="0.15"
                rx="0.5"
                ry="0.5"
              />
            )
          })}
        </svg>
      </div>

      {/* Header KEKJDR */}
      <header className="flex items-center justify-between mb-8 select-none">
        <h1
          className="text-4xl font-extrabold tracking-wide flex items-center gap-3"
          style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
        >
          CAKE JDR <span aria-label="gateau" role="img">🎂</span>
        </h1>
        {user && (
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded font-semibold text-sm"
              title="Se déconnecter"
            >
              Déconnexion
            </button>

            {/* Bouton mode MJ */}
            <button
              className={`px-3 py-1 rounded font-semibold text-white text-sm ${
                user.isMJ ? 'bg-purple-700 hover:bg-purple-800' : 'bg-gray-600 hover:bg-gray-700'
              }`}
              onClick={() => {
                const newIsMJ = !user.isMJ
                setUser(prev => prev ? { ...prev, isMJ: newIsMJ } : null)
                try {
                  const profRaw = localStorage.getItem(PROFILE_KEY)
                  if (!profRaw) return
                  const prof = JSON.parse(profRaw)
                  prof.isMJ = newIsMJ
                  localStorage.setItem(PROFILE_KEY, JSON.stringify(prof))
                  window.dispatchEvent(new Event('jdr_profile_change'))
                } catch {}
              }}
              title={user.isMJ ? 'Désactiver le mode MJ' : 'Activer le mode MJ'}
            >
              {user.isMJ ? 'Mode MJ activé' : 'Activer le mode MJ'}
            </button>

            {/* Sélecteur couleur profil */}
            <div className="flex items-center gap-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleChangeColor(c)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    user.color === c ? 'border-white scale-110' : 'border-gray-400'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
              <input
                type="color"
                value={user.color}
                onChange={(e) => handleChangeColor(e.target.value)}
                title="Choisir une couleur personnalisée"
                className="w-6 h-6 rounded border-2 border-gray-400 cursor-pointer p-0"
              />
            </div>
          </div>
        )}
      </header>

      {!user && (
        <div className="flex-grow flex items-center justify-center">
          <Login
            onLogin={() => {
              try {
                const profRaw = localStorage.getItem(PROFILE_KEY)
                if (!profRaw) return
                const prof = JSON.parse(profRaw)
                setUser({ pseudo: prof.pseudo, isMJ: !!prof.isMJ, color: prof.color || '#1d4ed8' })
              } catch {}
            }}
          />
        </div>
      )}

      {user && (
        <>
          {/* Profil utilisateur */}
          <section className="mb-8 bg-gray-800 bg-opacity-40 rounded-lg p-4" style={{ overflow: 'hidden' }}>
            <p className="mb-2 text-lg font-semibold">
              Connecté en tant que <span style={{ color: user.color }}>{user.pseudo}</span>
            </p>
          </section>

          {/* Liste fiches personnages */}
          <section className="bg-gray-800 bg-opacity-40 rounded-lg p-6 flex-grow" style={{ overflow: 'hidden' }}>
            <h2 className="text-2xl font-bold mb-4 select-none">Vos fiches de personnage</h2>

            {filteredCharacters.length === 0 ? (
              <p>Aucune fiche sauvegardée pour ce profil.</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredCharacters.map((ch, idx) => (
                  <li
                    key={ch.id}
                    className={`bg-gray-700 rounded p-4 flex flex-col justify-between cursor-pointer
                      ${selectedIdx !== null && filteredCharacters[selectedIdx]?.id === ch.id ? 'ring-4 ring-green-400' : 'ring-0'}
                      transition-ring duration-300`}
                    onClick={() => handleSelectChar(idx)}
                    title={`${ch.nom} - Niveau ${ch.niveau || '?'}`}
                  >
                    <span className="font-semibold text-lg mb-2 truncate">{ch.nom}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditCharacter(idx)
                        }}
                        className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-sm"
                        title="Modifier la fiche"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteChar(idx)
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
              <button
                onClick={handleNewCharacter}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow"
              >
                Nouvelle fiche complète
              </button>
              <button
                onClick={handleImportClick}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-2 rounded shadow"
              >
                Importer
              </button>
              <button
                onClick={handleExportChar}
                disabled={selectedIdx === null}
                className={`font-semibold px-6 py-2 rounded shadow ${
                  selectedIdx === null ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                Exporter
              </button>
              <input
                type="file"
                accept="text/plain"
                ref={fileInputRef}
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </section>

          {/* Modal fiche personnage */}
          {modalOpen && (
            <div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6"
              role="dialog"
              aria-modal="true"
            >
              <div
                className="relative bg-gray-900 rounded-xl shadow-lg flex flex-col w-[95vw] max-w-[1400px] p-6"
                style={{ height: '95vh' }}
              >
                <CharacterSheet
                  perso={draftChar}
                  onUpdate={setDraftChar}
                  creation={false}
                  key={draftChar.id}
                />
                <div className="border-t border-gray-700 mt-4 pt-4 flex justify-end gap-4">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

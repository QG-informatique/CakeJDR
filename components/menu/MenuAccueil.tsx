'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useRef } from 'react'
import Login from '../login/Login'
import { defaultPerso } from '../sheet/CharacterSheet'
import MenuHeader from './MenuHeader'
import CharacterList from './CharacterList'
import CharacterModal from './CharacterModal'
import ProfileColorPicker from './ProfileColorPicker'

/* ------------------------------------------------------------------------- */
/*  Constantes & Types                                                       */
/* ------------------------------------------------------------------------- */
const PROFILE_KEY = 'jdr_profile'

type Character = {
  id: string | number
  nom: string
  owner: string
  [key: string]: any
}

/* ------------------------------------------------------------------------- */
/*  Composant Menu Accueil                                                   */
/* ------------------------------------------------------------------------- */
export default function MenuAccueil() {
  const [user, setUser] = useState<{ pseudo:string; isMJ:boolean; color:string } | null>(null)
  const [characters, setCharacters]   = useState<Character[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [draftChar, setDraftChar]     = useState<Character>(defaultPerso as unknown as Character)
  const [hydrated, setHydrated]       = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /* ----------------------------------------------------------------------- */
  /*  Hydratation initiale (localStorage → état React)                       */
  /* ----------------------------------------------------------------------- */
  useEffect(() => {
    setHydrated(true)

    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) {
        const prof = JSON.parse(raw)
        if (prof.pseudo) {
          setUser({ pseudo: prof.pseudo, isMJ: !!prof.isMJ, color: prof.color || '#1d4ed8' })
        }
      }
      const savedChars = JSON.parse(localStorage.getItem('jdr_characters') || '[]')
      if (Array.isArray(savedChars)) setCharacters(savedChars)
    } catch {}
  }, [])

  /* ----------------------------------------------------------------------- */
  /*  Synchronisation inter‑onglets                                          */
  /* ----------------------------------------------------------------------- */
  useEffect(() => {
    const update = () => {
      try {
        const raw = localStorage.getItem(PROFILE_KEY)
        if (!raw) { setUser(null); return }
        const prof = JSON.parse(raw)
        if (prof.pseudo) {
          setUser({ pseudo: prof.pseudo, isMJ: !!prof.isMJ, color: prof.color || '#1d4ed8' })
        } else setUser(null)
      } catch { setUser(null) }
    }
    window.addEventListener('storage', update)
    window.addEventListener('jdr_profile_change', update as EventListener)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('jdr_profile_change', update as EventListener)
    }
  }, [])

  /* ----------------------------------------------------------------------- */
  /*  Helpers persistance                                                    */
  /* ----------------------------------------------------------------------- */
  const saveCharacters = (chars: Character[]) => {
    localStorage.setItem('jdr_characters', JSON.stringify(chars))
    setCharacters(chars)
  }

  /* ----------------------------------------------------------------------- */
  /*  Gestion utilisateur                                                    */
  /* ----------------------------------------------------------------------- */
  const handleLogout = () => {
    // ➜ on NE supprime PLUS la clé, on met juste loggedIn=false
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) {
        const prof = JSON.parse(raw)
        prof.loggedIn = false
        localStorage.setItem(PROFILE_KEY, JSON.stringify(prof))
        window.dispatchEvent(new Event('jdr_profile_change'))
      }
    } catch {}
    setUser(null)
    setSelectedIdx(null)
  }

  /* ----------------------------------------------------------------------- */
  /*  Divers handlers personnages                                            */
  /* ----------------------------------------------------------------------- */
  const handleSelectChar   = (idx:number) => setSelectedIdx(idx)
  const handleNewCharacter = () => {
    if (!user) return
    setDraftChar({ ...defaultPerso, id: crypto.randomUUID(), owner: user.pseudo })
    setModalOpen(true)
  }
  const handleEditCharacter = (idx:number) => { setDraftChar(characters[idx]); setModalOpen(true) }

  const handleSaveDraft = () => {
    if (!user) return
    const toSave = { ...draftChar, nom: draftChar.nom || 'Sans nom', owner: user.pseudo }
    const updated = draftChar.id && characters.find(c => c.id === draftChar.id)
      ? characters.map(c => (c.id === draftChar.id ? toSave : c))
      : [...characters, toSave]
    saveCharacters(updated)
    setModalOpen(false)
    setSelectedIdx(updated.findIndex(c => c.id === toSave.id))
  }

  const handleDeleteChar = (idx:number) => {
    if (!window.confirm('Supprimer cette fiche ?')) return
    saveCharacters(characters.filter((_, i) => i !== idx))
    setSelectedIdx(null)
  }

  /*  Import / Export ------------------------------------------------------- */
  const handleImportClick = () => fileInputRef.current?.click()
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const imported = JSON.parse(evt.target?.result as string)
        if (!imported.owner && user) imported.owner = user.pseudo
        saveCharacters([...characters, imported])
        alert('Fiche importée !')
      } catch { alert('Erreur : fichier invalide.') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExportChar = () => {
    if (selectedIdx === null) return
    const char = characters[selectedIdx]
    const blob = new Blob([JSON.stringify(char, null, 2)], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), {
      href: url,
      download: `${(char.nom || 'fiche').replace(/\s+/g, '_')}.txt`
    })
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  /* ----------------------------------------------------------------------- */
  /*  Couleurs profil                                                        */
  /* ----------------------------------------------------------------------- */
  const handleChangeColor = (color:string) => {
    if (!user) return
    setUser({ ...user, color })
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (!raw) return
      const prof = JSON.parse(raw)
      prof.color = color
      localStorage.setItem(PROFILE_KEY, JSON.stringify(prof))
      window.dispatchEvent(new Event('jdr_profile_change'))
    } catch {}
  }

  const handleToggleMJ = () => {
    if (!user) return
    const newIsMJ = !user.isMJ
    setUser({ ...user, isMJ: newIsMJ })
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (!raw) return
      const prof = JSON.parse(raw)
      prof.isMJ = newIsMJ
      localStorage.setItem(PROFILE_KEY, JSON.stringify(prof))
      window.dispatchEvent(new Event('jdr_profile_change'))
    } catch {}
  }

  /* ----------------------------------------------------------------------- */
  /*  Rendu conditionnel avant hydratation                                   */
  /* ----------------------------------------------------------------------- */
  if (!hydrated) {
    return <div className="w-full h-full" />
  }

  /* ----------------------------------------------------------------------- */
  /*  Render                                                                 */
  /* ----------------------------------------------------------------------- */
  const filteredCharacters = user
    ? user.isMJ ? characters : characters.filter(c => c.owner === user.pseudo)
    : []

  return (
    <div className="w-full h-full relative text-white p-4 flex flex-col max-w-6xl mx-auto overflow-hidden">

      {/* ------------------------------- HEADER ----------------------------- */}
      <MenuHeader user={user} onLogout={handleLogout} />

      {/* -------------------------- CONTENU PRINCIPAL ----------------------- */}
      {!user ? (
        /* ---------------- LOGIN (pas connecté) --------------------------- */
        <div className="flex-grow flex items-center justify-center">
          <Login onLogin={() => {
            try {
              const prof = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
              setUser({ pseudo: prof.pseudo, isMJ: !!prof.isMJ, color: prof.color || '#1d4ed8' })
            } catch {}
          }} />
        </div>
      ) : (
        /* ---------------- MENU (connecté) -------------------------------- */
        <>
          {/* Profil utilisateur */}
          <section className="mb-8 bg-gray-800 bg-opacity-40 rounded-lg p-4 flex items-center justify-between" style={{ overflow:'hidden' }}>
            <p className="text-lg font-semibold flex items-center gap-2">
              Connecté en tant que <span style={{ color: user.color }}>{user.pseudo}</span>
            </p>
            <div className="flex items-center gap-4">
              <ProfileColorPicker color={user.color} onChange={handleChangeColor} />
              <button
                onClick={handleToggleMJ}
                className={`px-3 py-1 rounded font-semibold text-sm text-white ${user.isMJ ? 'bg-purple-700 hover:bg-purple-800' : 'bg-gray-600 hover:bg-gray-700'}`}
              >
                {user.isMJ ? 'Mode MJ activé' : 'Activer le mode MJ'}
              </button>
            </div>
          </section>

          <CharacterList
            filtered={filteredCharacters}
            selectedIdx={selectedIdx}
            onSelect={handleSelectChar}
            onEdit={handleEditCharacter}
            onDelete={handleDeleteChar}
            onNew={handleNewCharacter}
            onImportClick={handleImportClick}
            onExport={handleExportChar}
            fileInputRef={fileInputRef}
            onImportFile={handleImportFile}
          />

          <CharacterModal
            open={modalOpen}
            character={draftChar}
            onUpdate={setDraftChar}
            onSave={handleSaveDraft}
            onClose={() => setModalOpen(false)}
          />
        </>
      )}
    </div>
  )
}

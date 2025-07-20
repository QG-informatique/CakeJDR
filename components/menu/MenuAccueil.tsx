/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Login from '../login/Login'
import { defaultPerso } from '../sheet/CharacterSheet'
import MenuHeader from './MenuHeader'
import CharacterList from './CharacterList'
import CharacterModal from './CharacterModal'
import ProfileColorPicker from './ProfileColorPicker'

const PROFILE_KEY = 'jdr_profile'

type Character = {
  id: string | number
  nom: string
  owner: string
  [key: string]: any
}

export default function MenuAccueil() {
  const router = useRouter()

  const [user, setUser] = useState<{ pseudo:string; isMJ:boolean; color:string } | null>(null)
  const [characters, setCharacters]   = useState<Character[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [draftChar, setDraftChar]     = useState<Character>(defaultPerso as unknown as Character)
  const [hydrated, setHydrated]       = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  /** Nouvel état pour masquer instantanément l’UI lors du logout */
  const [loggingOut, setLoggingOut] = useState(false)

  /* ---------------- Hydratation ---------------- */
  useEffect(() => {
    setHydrated(true)
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) {
        const prof = JSON.parse(raw)
        if (prof.pseudo && prof.loggedIn) {
          setUser({ pseudo: prof.pseudo, isMJ: !!prof.isMJ, color: prof.color || '#1d4ed8' })
        }
      }
      const savedChars = JSON.parse(localStorage.getItem('jdr_characters') || '[]')
      if (Array.isArray(savedChars)) setCharacters(savedChars)
    } catch {}
  }, [])

  /* --------- Sync inter‑onglets --------- */
  useEffect(() => {
    if (loggingOut) return
    const update = () => {
      try {
        const raw = localStorage.getItem(PROFILE_KEY)
        if (!raw) { setUser(null); return }
        const prof = JSON.parse(raw)
        if (prof.pseudo && prof.loggedIn) {
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
  }, [loggingOut])

  /* --------- Persistence --------- */
  const saveCharacters = (chars: Character[]) => {
    localStorage.setItem('jdr_characters', JSON.stringify(chars))
    setCharacters(chars)
  }

  /* --------- Logout (Option B) --------- */
  const handleLogout = () => {
    if (loggingOut) return
    setLoggingOut(true)

    // Invalider le profil dans le storage
    try {
      const raw = localStorage.getItem(PROFILE_KEY)
      if (raw) {
        const prof = JSON.parse(raw)
        prof.loggedIn = false
        localStorage.setItem(PROFILE_KEY, JSON.stringify(prof))
        window.dispatchEvent(new Event('jdr_profile_change'))
      }
    } catch {}

    // Masquer immédiatement toute l’UI dépendante de user
    setUser(null)
    setSelectedIdx(null)

    // Navigation au tick suivant (évite le double logo)
    requestAnimationFrame(() => {
      router.replace('/menu')
    })
  }

  /* --------- Characters CRUD --------- */
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

  /* --------- Import / Export --------- */
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

  /* --------- Profile helpers --------- */
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

  if (!hydrated) return <div className="w-full h-full" />

  const filteredCharacters = user
    ? user.isMJ ? characters : characters.filter(c => c.owner === user.pseudo)
    : []

  /* Pendant logout : écran neutre (rien de l'ancien UI ne reste) */
  if (loggingOut) {
    return <div className="w-full min-h-screen bg-transparent" />
  }

  return (
    <div className="w-full min-h-screen relative text-white px-6 pb-8 flex flex-col max-w-7xl mx-auto bg-transparent overflow-hidden">
      {user && (
        <MenuHeader
          user={user}
          onLogout={handleLogout}
          tableRoute="/table"
        />
      )}

      {!user ? (
        <div className="flex-grow flex items-center justify-center">
          <Login onLogin={() => {
            try {
              const prof = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}')
              setUser({ pseudo: prof.pseudo, isMJ: !!prof.isMJ, color: prof.color || '#1d4ed8' })
            } catch {}
          }} />
        </div>
      ) : (
        <>
          {/* Barre profil : pseudo centré + color picker ; bouton MJ compact à droite */}
          <section
            className="
              mt-4 mb-6
              rounded-xl backdrop-blur-md
              bg-black/35
              px-6 py-4
              flex items-center w-full
            "
          >
            {/* Spacer gauche pour équilibrer la largeur du bloc MJ à droite */}
            <div className="w-[120px] shrink-0" />

            {/* Centre : pseudo + color picker */}
            <div className="flex-1 flex items-center justify-center">
              <span
                className="font-bold text-xl tracking-wide select-none"
                style={{ color: user.color, textShadow:'0 1px 2px rgba(0,0,0,0.5)' }}
              >
                {user.pseudo}
              </span>
              <span className="ml-4">
                <ProfileColorPicker
                  color={user.color}
                  onChange={handleChangeColor}
                />
              </span>
            </div>

            {/* Droite : bouton MJ compact */}
            <div className="shrink-0 flex items-center justify-end w-[120px]">
              <button
                onClick={handleToggleMJ}
                title={user.isMJ ? 'Mode MJ (clique pour repasser joueur)' : 'Activer mode MJ'}
                className={`
                  relative inline-flex items-center justify-center
                  w-14 h-10 rounded-md font-semibold text-sm
                  transition border
                  ${user.isMJ
                    ? 'bg-fuchsia-600/80 hover:bg-fuchsia-500 border-fuchsia-300/40'
                    : 'bg-gray-700/70 hover:bg-gray-600/70 border-gray-400/30'}
                `}
                style={{
                  boxShadow: user.isMJ
                    ? '0 0 0 1px rgba(255,255,255,0.08), 0 0 12px -2px rgba(217,70,239,0.55)'
                    : '0 0 0 1px rgba(255,255,255,0.05), 0 2px 8px -2px rgba(0,0,0,0.55)'
                }}
              >
                <span className="flex items-center gap-1">
                  <span className="text-xs tracking-wide">MJ</span>
                  <span
                    className={`
                      block w-2.5 h-2.5 rounded-full transition
                      ${user.isMJ
                        ? 'bg-fuchsia-300 shadow-[0_0_6px_2px_rgba(217,70,239,0.5)]'
                        : 'bg-gray-300/80'}
                    `}
                  />
                </span>
              </button>
            </div>
          </section>

          {/* Liste des personnages */}
          <div className="flex-1 min-h-0 rounded-xl backdrop-blur-md bg-black/20 p-5 overflow-auto">
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
          </div>

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

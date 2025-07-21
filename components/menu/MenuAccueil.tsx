/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'

import { Crown, LogOut } from 'lucide-react'

import { Crown, LogOut, Dice6 } from 'lucide-react'

import { useBackground } from '../context/BackgroundContext'
import { useRouter } from 'next/navigation'
import Login from '../login/Login'
import { defaultPerso } from '../sheet/CharacterSheet'
import MenuHeader from './MenuHeader'
import CharacterList from './CharacterList'
import CharacterModal from './CharacterModal'
import ProfileColorPicker from './ProfileColorPicker'

const PROFILE_KEY = 'jdr_profile'
const SELECTED_KEY = 'selectedCharacterId'
const DICE_SIZE = 44

type Character = {
  id: string | number
  nom: string
  owner: string
  [key: string]: any
}

export default function MenuAccueil() {
  const router = useRouter()
  const { setBackground } = useBackground()

  const [user, setUser] = useState<{ pseudo:string; isMJ:boolean; color:string } | null>(null)
  const [characters, setCharacters]   = useState<Character[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [modalOpen, setModalOpen]     = useState(false)
  const [draftChar, setDraftChar]     = useState<Character>(defaultPerso as unknown as Character)
  const [hydrated, setHydrated]       = useState(false)
  const [loggingOut, setLoggingOut]   = useState(false)

  const [diceHover, setDiceHover]     = useState(false)



  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
      if (Array.isArray(savedChars)) {
        setCharacters(savedChars)
        const selId = localStorage.getItem(SELECTED_KEY)
        if (selId) {
          const idx = savedChars.findIndex((c: any) => c.id?.toString() === selId)
          if (idx !== -1) setSelectedIdx(idx)
        }
      }
    } catch {}
  }, [])

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

  const saveCharacters = (chars: Character[]) => {
    localStorage.setItem('jdr_characters', JSON.stringify(chars))
    setCharacters(chars)
  }

  const handleLogout = () => {
    if (loggingOut) return
    setLoggingOut(true)

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
    setBackground('rpg') // Reset to default background on logout
    requestAnimationFrame(() => {
      router.replace('/menu')
    })
  }

  // Accès rapide à la table de jeu depuis la barre profil
  const handlePlay = () => {
    router.push('/')
  }

  const handleNewCharacter = () => {
    if (!user) return
    setDraftChar({ ...defaultPerso, id: crypto.randomUUID(), owner: user.pseudo })
    setModalOpen(true)
  }
  const handleEditCharacter = (idx:number) => { setDraftChar(characters[idx]); setModalOpen(true) }

  const handleSaveDraft = () => {
    if (!user) return
    const id = draftChar.id || crypto.randomUUID()
    const toSave = { ...draftChar, id, nom: draftChar.nom || 'Sans nom', owner: user.pseudo }
    const updated = characters.find(c => c.id === id)
      ? characters.map(c => (c.id === id ? toSave : c))
      : [...characters, toSave]
    saveCharacters(updated)
    localStorage.setItem(SELECTED_KEY, String(id))
    setModalOpen(false)
    setSelectedIdx(updated.findIndex(c => c.id === id))
  }

  const handleDeleteChar = (idx:number) => {
    if (!window.confirm('Supprimer cette fiche ?')) return
    const toDelete = characters[idx]
    const remaining = characters.filter((_, i) => i !== idx)
    saveCharacters(remaining)
    if (toDelete?.id && localStorage.getItem(SELECTED_KEY) === String(toDelete.id)) {
      localStorage.removeItem(SELECTED_KEY)
      setSelectedIdx(null)
    } else {
      const id = localStorage.getItem(SELECTED_KEY)
      if (id) {
        const newIdx = remaining.findIndex(c => String(c.id) === id)
        setSelectedIdx(newIdx !== -1 ? newIdx : null)
      } else {
        setSelectedIdx(null)
      }
    }
  }

  const handleImportClick = () => fileInputRef.current?.click()
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = evt => {
      try {
        const imported = JSON.parse(evt.target?.result as string)
        const id = imported.id || crypto.randomUUID()
        if (!imported.owner && user) imported.owner = user.pseudo
        const withId = { ...imported, id }
        saveCharacters([...characters, withId])
        localStorage.setItem(SELECTED_KEY, String(id))
        setSelectedIdx(characters.length)
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

  const handleSelectChar = (idx: number) => {
    setSelectedIdx(idx)
    const ch = filteredCharacters[idx]
    if (ch?.id !== undefined) {
      localStorage.setItem(SELECTED_KEY, String(ch.id))
    }
  }

  if (loggingOut) {
    return <div className="w-full min-h-screen bg-transparent" />
  }

  return (
    <>
      {/* Header avec le bouton qui change de fond */}
      {user && (

        <MenuHeader />

        <MenuHeader
          user={user}
        />

      )}

      <div className="w-full min-h-screen relative text-white px-6 pb-8 flex flex-col max-w-7xl mx-auto bg-transparent overflow-hidden">
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
            {/* Barre profil */}
            <section
              className="
                mt-4 mb-6
                rounded-xl backdrop-blur-md
                bg-black/35
                px-6 py-4
                flex items-center w-full
              "
            >
              <div className="shrink-0 flex items-center justify-start w-[120px]">
                <button
                  type="button"
                  aria-label="Aller à la table de jeu"
                  onClick={handlePlay}
                  onMouseEnter={() => setDiceHover(true)}
                  onMouseLeave={() => setDiceHover(false)}
                  className="relative inline-flex items-center justify-center rounded-md border-2 border-pink-300/40 shadow-md shadow-pink-200/20 transition focus:outline-none focus:ring-2 focus:ring-pink-200/40 focus:ring-offset-2 focus:ring-offset-black"
                  style={{
                    width: DICE_SIZE,
                    height: DICE_SIZE,
                    background: diceHover
                      ? 'radial-gradient(circle at 60% 35%, #ffe0f1 40%, #fff7 80%, #ffe2 100%)'
                      : 'rgba(38,16,56,0.14)',
                    boxShadow: diceHover
                      ? '0 0 12px 2px #ffb0e366, 0 2px 20px 8px #fff2'
                      : '0 0 4px 1px #ffe5fa44, 0 2px 8px 2px #fff2',
                    borderColor: diceHover ? '#ff90cc' : '#f7bbf7',
                    transition: 'background 0.22s cubic-bezier(.77,.2,.56,1)'
                  }}
                >
                  <Dice6 className="w-5 h-5 text-white drop-shadow-[0_2px_5px_rgba(255,70,190,0.45)]" />
                </button>
              </div>

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

              <div className="shrink-0 flex items-center justify-end w-[120px] gap-3">
                <button
                  onClick={handleToggleMJ}
                  title={user.isMJ ? 'Mode MJ (clique pour repasser joueur)' : 'Activer mode MJ'}
                  className={`
                    relative inline-flex items-center justify-center
                    w-14 h-10 rounded-md font-semibold text-sm
                    transition border
                    ${user.isMJ
                      ? 'bg-[#f472b6]/20 hover:bg-[#f472b6]/35 border-[#f472b6]/40'
                      : 'bg-gray-700/70 hover:bg-gray-600/70 border-gray-400/30'}
                  `}
                  style={{
                    boxShadow: user.isMJ
                      ? '0 0 0 1px rgba(244,114,182,0.14), 0 0 12px -2px #f472b630'
                      : '0 0 0 1px rgba(255,255,255,0.05), 0 2px 8px -2px rgba(0,0,0,0.55)'
                  }}
                >
                  <span className="flex items-center gap-1">
                    <Crown size={18} className="text-pink-400" />
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
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center px-3 h-10 rounded-md bg-gradient-to-br from-slate-700/80 to-slate-800/80 hover:from-slate-600/80 hover:to-slate-700/80 font-semibold text-sm text-white shadow-lg shadow-black/40 transition focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:ring-offset-2 focus:ring-offset-black"
                >
                  <LogOut size={18} className="mr-1" />
                  Déconnexion
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
    </>
  )
}

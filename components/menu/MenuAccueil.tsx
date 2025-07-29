/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useEffect, useRef } from 'react'
import { Crown, LogOut, Dice6 } from 'lucide-react'
import SmallSpinner from '../ui/SmallSpinner'
import RoomList, { RoomInfo } from '../rooms/RoomList'
import RoomCreateModal from '../rooms/RoomCreateModal'
import { useRouter } from 'next/navigation'
import Login from '../login/Login'
import { defaultPerso } from '../sheet/CharacterSheet'
import MenuHeader from './MenuHeader'
import CharacterList from './CharacterList'
import CharacterModal from './CharacterModal'
import ProfileColorPicker from './ProfileColorPicker'

const PROFILE_KEY = 'jdr_profile'
const SELECTED_KEY = 'selectedCharacterId'
// Dice button size consistent with main repo
const DICE_SIZE = 44

const ROOM_KEY = 'jdr_selected_room'

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
  const [loggingOut, setLoggingOut]   = useState(false)
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null)
  const [remoteChars, setRemoteChars] = useState<Record<string, Character>>({})
  const [roomLoading, setRoomLoading] = useState(false)


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
      const roomRaw = localStorage.getItem(ROOM_KEY)
      if (roomRaw) {
        try {
          const r = JSON.parse(roomRaw)
          if (r?.id) {
            setSelectedRoom(r)
            setRoomLoading(true)
            fetch(`/api/roomstorage?roomId=${encodeURIComponent(r.id)}`)
              .then(res => res.json())
              .then(data => setRemoteChars(data.characters || {}))
              .catch(() => setRemoteChars({}))
              .finally(() => setRoomLoading(false))
          }
        } catch {}
      }
    } catch {}
  }, [])

  // Met à jour la liste quand une fiche est importée depuis un autre onglet
  useEffect(() => {
    const update = () => {
      try {
        const list = JSON.parse(localStorage.getItem('jdr_characters') || '[]')
        if (Array.isArray(list)) setCharacters(list)
      } catch {}
    }
    window.addEventListener('jdr_characters_change', update as EventListener)
    window.addEventListener('storage', update)
    return () => {
      window.removeEventListener('jdr_characters_change', update as EventListener)
      window.removeEventListener('storage', update)
    }
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
    requestAnimationFrame(() => {
      router.replace('/menu')
    })
  }

  const handlePlay = () => {
    if (!selectedRoom) return
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('visitedMenu', 'true')
    }
    router.push(`/room/${selectedRoom.id}`)
  }

  const handleRoomSelect = (room: RoomInfo) => {
    setSelectedRoom(room)
    setRoomLoading(true)
    localStorage.setItem(ROOM_KEY, JSON.stringify(room))
    fetch(`/api/roomstorage?roomId=${encodeURIComponent(room.id)}`)
      .then(res => res.json())
      .then(data => setRemoteChars(data.characters || {}))
      .catch(() => setRemoteChars({}))
      .finally(() => setRoomLoading(false))
  }

  const handleNewCharacter = () => {
    if (!user) return
    setDraftChar({ ...defaultPerso, id: crypto.randomUUID(), owner: user.pseudo })
    setModalOpen(true)
  }
  const handleEditCharacter = (id: string | number) => {
    const idx = characters.findIndex(c => String(c.id) === String(id))
    if (idx !== -1) {
      setDraftChar(characters[idx])
      setModalOpen(true)
    }
  }

  const handleSaveDraft = () => {
    if (!user) return
    const id = draftChar.id || crypto.randomUUID()
    const toSave = { ...draftChar, id, nom: draftChar.nom || 'Unnamed', owner: user.pseudo, updatedAt: Date.now() }
    const updated = characters.find(c => c.id === id)
      ? characters.map(c => (c.id === id ? toSave : c))
      : [...characters, toSave]
    saveCharacters(updated)
    localStorage.setItem(SELECTED_KEY, String(id))
    setModalOpen(false)
    setSelectedIdx(updated.findIndex(c => c.id === id))
  }

  const handleDeleteChar = (id: string | number) => {
    if (!window.confirm('Delete this sheet?')) return
    const idx = characters.findIndex(c => String(c.id) === String(id))
    if (idx === -1) return
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

  const handleUploadChar = async (char: Character) => {
    if (!selectedRoom) return
    await fetch('/api/roomstorage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: selectedRoom.id, id: char.id, character: { ...char, updatedAt: Date.now() } })
    })
    setRemoteChars(r => ({ ...r, [String(char.id)]: { ...char, updatedAt: Date.now() } }))
  }

  const handleDownloadChar = (char: Character) => {
    const idx = characters.findIndex(c => String(c.id) === String(char.id))
    const updated = idx !== -1 ? characters.map((c, i) => i === idx ? char : c) : [...characters, char]
    saveCharacters(updated)
  }

  const handleDeleteCloudChar = async (id: string | number) => {
    if (!selectedRoom) return
    if (!window.confirm('Delete from cloud?')) return
    await fetch(`/api/roomstorage?roomId=${encodeURIComponent(selectedRoom.id)}&id=${encodeURIComponent(String(id))}`, { method: 'DELETE' })
    setRemoteChars(r => {
      const next = { ...r }
      delete next[String(id)]
      return next
    })
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
        <MenuHeader user={user} />
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
              <div className="shrink-0 flex items-center justify-start min-w-[150px] gap-2">
                <button
                  type="button"
                  aria-label="Enter room"
                  onClick={handlePlay}
                  className={`relative inline-flex items-center justify-center rounded-md border-2 border-pink-300/40 shadow-md shadow-pink-200/20 transition focus:outline-none focus:ring-2 focus:ring-pink-200/40 focus:ring-offset-2 focus:ring-offset-black ${selectedRoom ? 'animate-pulse' : ''}`}
                  style={{
                    width: DICE_SIZE,
                    height: DICE_SIZE,
                    background: selectedRoom ? 'rgba(38,16,56,0.2)' : 'rgba(38,16,56,0.14)',
                    borderColor: selectedRoom ? '#ff90cc' : '#f7bbf7',
                    boxShadow: selectedRoom
                      ? '0 0 12px 2px #ffb0e366, 0 2px 20px 8px #fff2'
                      : '0 0 4px 1px #ffe5fa44, 0 2px 8px 2px #fff2',
                    transition: 'transform 0.18s cubic-bezier(.77,.2,.56,1), box-shadow 0.18s cubic-bezier(.77,.2,.56,1)'
                  }}
                  disabled={!selectedRoom}
                >
                  <Dice6 className="w-5 h-5 text-white drop-shadow-[0_2px_5px_rgba(255,70,190,0.45)]" />
                </button>
                {selectedRoom && (
                  <span className="text-sm text-white/80 flex items-center gap-2">
                    {roomLoading && <SmallSpinner />}
                    {selectedRoom.name || 'Unnamed room'}
                  </span>
                )}
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
                  title={user.isMJ ? 'GM mode (click to revert)' : 'Enable GM mode'}
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
                {/* Logout button with red hover */}
                <button
                  onClick={handleLogout}
                  className="
                    inline-flex items-center justify-center px-3 h-10 rounded-md
                    bg-gradient-to-br from-slate-700/80 to-slate-800/80
                    hover:from-pink-600/80 hover:to-pink-700/80
                    font-semibold text-sm text-white shadow-lg shadow-black/40 transition
                    focus:outline-none focus:ring-2 focus:ring-pink-400/30 focus:ring-offset-2 focus:ring-offset-black
                  "
                  style={{
                    transition: 'background 0.2s, box-shadow 0.2s',
                    boxShadow: '0 2px 8px -2px #d6336c77, 0 4px 24px -6px #d6336c22'
                  }}
                >
                  <LogOut size={18} className="mr-1" />
                  Logout
                </button>
              </div>
            </section>
            <div className="mb-4">
              <RoomList
                selectedId={selectedRoom?.id || null}
                onSelect={handleRoomSelect}
                onCreateClick={() => setCreateRoomOpen(true)}
              />
            </div>
            <RoomCreateModal
              open={createRoomOpen}
              onClose={() => setCreateRoomOpen(false)}
              onCreated={handleRoomSelect}
            />

            {/* Liste des personnages */}
            <div className="flex-1 min-h-0 rounded-xl backdrop-blur-md bg-black/20 p-5 overflow-auto">
              <CharacterList
                filtered={filteredCharacters}
                remote={remoteChars}
                onDownload={handleDownloadChar}
                onUpload={handleUploadChar}
                selectedIdx={selectedIdx}
                onSelect={handleSelectChar}
                onEdit={handleEditCharacter}
                onDelete={handleDeleteChar}
                onDeleteCloud={handleDeleteCloudChar}
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

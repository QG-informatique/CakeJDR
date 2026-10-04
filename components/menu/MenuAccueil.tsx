'use client'

import { useState, useEffect, useRef } from 'react'
import { useT } from '@/lib/useT'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useConfirm } from '@/lib/useConfirm'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import ThemeSwitcher from '../ui/ThemeSwitcher'
import { LogIn, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SmallSpinner from '../ui/SmallSpinner'
import RoomList, { RoomInfo } from '../rooms/RoomList'
import RoomCreateModal from '../rooms/RoomCreateModal'
import { useRouter } from 'next/navigation'
import { fetchRooms as fetchRoomsApi, roomAuthHeaders } from '@/lib/roomsApi'
import { signOut } from 'next-auth/react'
import useProfile from '../app/hooks/useProfile'
import {
  deleteAccountCharacter,
  listAccountCharacters,
  saveAccountCharacter,
} from '@/lib/charactersApi'
import SignedOutPanel from '../auth/SignedOutPanel'
import PseudoPicker from '@/components/auth/PseudoPicker'
import DeleteAccount from '@/components/auth/DeleteAccount'
import { defaultPerso } from '../sheet/CharacterSheet'
import MenuHeader from './MenuHeader'
import CharacterList from './CharacterList'
import CharacterCloudModal from './CharacterCloudModal'
import CharacterEditor from '../character/CharacterEditor'
import ProfileColorPicker from './ProfileColorPicker'
import {
  type Character,
  buildCharacterKey,
  buildSelectionKey,
  normalizeCharacter,
  parseSelectionKey,
  isOwnedBy,
} from '@/types/character'

const SELECTED_KEY = 'selectedCharacterId'
// Dice button size consistent with main repo

const ROOM_KEY = 'jdr_selected_room'

/**
 * `landing` : la page d'arrivée (`/`), qui propose la connexion ; un joueur
 * déjà connecté passe directement aux salles.
 * `salles` : la page des salles et des fiches (`/salles`), réservée aux
 * joueurs connectés.
 */
export default function MenuAccueil({ page }: { page: 'landing' | 'salles' }) {
  const router = useRouter()
  const t = useT()
  const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
  // L'identite vient du compte connecte et de la base ; elle n'est plus modifiable
  // depuis le navigateur. `useProfile` renvoie un profil « Visiteur » quand
  // personne n'est connecte.
  const profile = useProfile()
  const user = profile?.signedIn ? profile : null
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [draftChar, setDraftChar] = useState<Character>(
    normalizeCharacter(defaultPerso),
  )
  const [hydrated, setHydrated] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [createRoomOpen, setCreateRoomOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<RoomInfo | null>(null)
  const [remoteChars, setRemoteChars] = useState<Record<string, Character>>({})
  const [roomLoading, setRoomLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [cloudOpen, setCloudOpen] = useState(false)
  // Tant que le compte n'est pas lu, on ne sait pas quel écran montrer : une
  // attente plutôt que l'écran de connexion, qui clignotait au retour d'une table.
  const profileLoading = profile === null
  const wrongPage = !profileLoading && (page === 'landing' ? !!user : !user)

  useEffect(() => {
    if (!wrongPage) return
    router.replace(page === 'landing' ? '/salles' : '/')
  }, [wrongPage, page, router])

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture du navigateur au premier affichage
    setHydrated(true)
    try {
      // Le pseudo sert de proprietaire par defaut aux fiches heritees, le
      // temps qu'elles soient rattachees au compte.
      const fallbackOwner: string | undefined = undefined
      const savedCharsRaw = localStorage.getItem('jdr_characters') || '[]'
      const savedChars = JSON.parse(savedCharsRaw)
      if (Array.isArray(savedChars)) {
        const normalized = savedChars.map((c: Character) =>
          normalizeCharacter(c, fallbackOwner ?? null),
        )
        setCharacters(normalized)
        const selection = parseSelectionKey(localStorage.getItem(SELECTED_KEY))
        if (selection.id) {
          const idx = normalized.findIndex(
            (c) =>
              c.id?.toString() === selection.id &&
              (!selection.owner || c.owner === selection.owner),
          )
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
              roomAuthHeaders(r.id)
              .then((auth) => {
                if (!auth) throw new Error('room access denied')
                return fetch(`/api/roomstorage?roomId=${encodeURIComponent(r.id)}`, { headers: auth })
              })
              .then((res) => res.json())
          .then((data) => {
            const map: Record<string, Character> = {}
            Object.values(data?.characters || {}).forEach((c) => {
              const normalized = normalizeCharacter(c as Character, fallbackOwner ?? null)
              map[buildCharacterKey(normalized)] = normalized
            })
            setRemoteChars(map)
          })
          .catch(() => setRemoteChars({}))
              .finally(() => setRoomLoading(false))
            }
          } catch {}
      }
    } catch {}
  }, [])

  // La table selectionnee est memorisee dans le navigateur. Si elle a ete
  // supprimee entre-temps, le menu continuait d'afficher « Entrer <nom> »
  // pour une table fantome. On verifie qu'elle existe encore.
  useEffect(() => {
    if (!selectedRoom) return
    let cancelled = false
    fetchRoomsApi()
      .then((list) => {
        if (cancelled) return
        const fresh = list.find((r) => r.id === selectedRoom.id)
        if (!fresh) {
          localStorage.removeItem(ROOM_KEY)
          setSelectedRoom(null)
          setRemoteChars({})
        } else if (fresh.role !== selectedRoom.role) {
          // Role memorise perime ou absent : on reprend celui du serveur.
          setSelectedRoom(fresh)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [selectedRoom])

  useEffect(() => {
    if (!statusMessage) return
    const timer = setTimeout(() => setStatusMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [statusMessage])

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
      window.removeEventListener(
        'jdr_characters_change',
        update as EventListener,
      )
      window.removeEventListener('storage', update)
    }
  }, [])

  /**
   * Les fiches du joueur suivent son compte. La liste locale contient aussi
   * les fiches d'autres joueurs, recuperees en passant dans leurs tables :
   * celles-la restent locales, sans quoi elles atterriraient sur son compte.
   */
  const isMine = (c: Character) => (!c.owner && !c.ownerId) || isOwnedBy(c, user)

  const saveCharacters = (chars: Character[]) => {
    const normalized = chars.map((c) =>
      normalizeCharacter(c, user?.pseudo ?? null),
    )
    // On repercute sur le compte uniquement ce qui a change : une requete
    // par fiche ajoutee, modifiee ou supprimee, pas la liste entiere.
    if (user) {
      const before = new Map(characters.map((c) => [String(c.id), c]))
      const after = new Set(normalized.map((c) => String(c.id)))
      for (const c of normalized) {
        const prev = before.get(String(c.id))
        if (isMine(c) && (!prev || JSON.stringify(prev) !== JSON.stringify(c))) {
          void saveAccountCharacter(c).catch(() => setStatusMessage(t('saveCloudFail')))
        }
      }
      for (const [id, c] of before) {
        // Une fiche jamais envoyee renvoie 404 a la suppression : sans importance.
        if (!after.has(id) && isMine(c)) void deleteAccountCharacter(id).catch(() => {})
      }
    }
    localStorage.setItem('jdr_characters', JSON.stringify(normalized))
    setCharacters(normalized)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('jdr_characters_change'))
    }
  }

  // A l'ouverture du menu : les fiches du compte redescendent dans la liste,
  // et celles du joueur qui n'existaient que dans ce navigateur montent une
  // fois. En cas de conflit, la version la plus recente l'emporte.
  // Dependances limitees a des chaines stables : `user` est un nouvel objet a
  // chaque rendu, et relancer l'effet annulerait la synchronisation en cours.
  const accountId = user?.id
  const accountPseudo = user?.pseudo
  const accountSyncedRef = useRef(false)
  useEffect(() => {
    if (!accountId || accountSyncedRef.current) return
    accountSyncedRef.current = true
    listAccountCharacters()
      .then(async (remote) => {
        let local: Character[] = []
        try {
          const raw = JSON.parse(localStorage.getItem('jdr_characters') || '[]')
          if (Array.isArray(raw)) local = raw.map((c: Character) => normalizeCharacter(c))
        } catch {}
        const byId = new Map<string, Character>()
        for (const c of local) byId.set(String(c.id), c)
        for (const r of remote) {
          const l = byId.get(String(r.id))
          if (!l || Number(r.updatedAt ?? 0) >= Number(l.updatedAt ?? 0)) byId.set(String(r.id), r)
        }
        const remoteIds = new Set(remote.map((r) => String(r.id)))
        const toUpload = local.filter(
          (c) =>
            !remoteIds.has(String(c.id)) &&
            ((!c.owner && !c.ownerId) || isOwnedBy(c, { id: accountId, pseudo: accountPseudo ?? '' })),
        )
        await Promise.allSettled(toUpload.map((c) => saveAccountCharacter(c)))
        const merged = Array.from(byId.values())
        localStorage.setItem('jdr_characters', JSON.stringify(merged))
        setCharacters(merged)
        // L'ordre a pu changer : on retrouve la fiche selectionnee par son id.
        const { id: selId } = parseSelectionKey(localStorage.getItem(SELECTED_KEY))
        const idx = selId ? merged.findIndex((c) => String(c.id) === selId) : -1
        setSelectedIdx(idx === -1 ? null : idx)
        window.dispatchEvent(new Event('jdr_characters_change'))
      })
      .catch(() => {
        // Hors ligne : on garde la liste locale telle quelle.
      })
  }, [accountId, accountPseudo])

  const handleLogout = () => {
    if (loggingOut) return
    setLoggingOut(true)
    setSelectedIdx(null)
    void signOut({ redirectTo: '/' })
  }

  const handlePlay = () => {
    if (!selectedRoom) return
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('visitedMenu', 'true')
    }
    router.push(`/room/${selectedRoom.id}`)
  }

  const handleEnterRoom = (room: RoomInfo) => {
    setSelectedRoom(room)
    localStorage.setItem(ROOM_KEY, JSON.stringify(room))
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('visitedMenu', 'true')
    }
    router.push(`/room/${room.id}`)
  }

  const handleRoomSelect = (room: RoomInfo) => {
    setSelectedRoom(room)
    setRoomLoading(true)
    localStorage.setItem(ROOM_KEY, JSON.stringify(room))
    roomAuthHeaders(room.id)
      .then((auth) => {
        if (!auth) throw new Error('room access denied')
        return fetch(`/api/roomstorage?roomId=${encodeURIComponent(room.id)}`, { headers: auth })
      })
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, Character> = {}
        Object.values(data?.characters || {}).forEach((c) => {
          const normalized = normalizeCharacter(
            c as Character,
            user?.pseudo ?? null,
          )
          map[buildCharacterKey(normalized)] = normalized
        })
        setRemoteChars(map)
      })
      .catch(() => setRemoteChars({}))
      .finally(() => setRoomLoading(false))
  }

  const handleNewCharacter = () => {
    if (!user) return
    setDraftChar(
      normalizeCharacter(
        { ...defaultPerso, id: crypto.randomUUID(), owner: user.pseudo, ownerId: user.id },
        user.pseudo,
      ),
    )
    setModalOpen(true)
  }
  const handleEditCharacter = (id: string | number) => {
    const idx = characters.findIndex((c) => String(c.id) === String(id))
    if (idx !== -1) {
      setDraftChar(characters.at(idx)!)
      setModalOpen(true)
    }
  }

  const handleSaveDraft = (edited: Character) => {
    if (!user) return
    const id = edited.id || crypto.randomUUID()
    const toSave = normalizeCharacter(
      {
        ...edited,
        id,
        nom: edited.nom || t('unnamed'),
        owner: user.pseudo,
        ownerId: user.id,
        updatedAt: Date.now(),
      },
      user.pseudo,
    )
    const key = buildCharacterKey(toSave)
    const updated = characters.some((c) => buildCharacterKey(c) === key)
      ? characters.map((c) => (buildCharacterKey(c) === key ? toSave : c))
      : [...characters, toSave]
    saveCharacters(updated)
    localStorage.setItem(SELECTED_KEY, buildSelectionKey(toSave.id, toSave.owner))
    setModalOpen(false)
    setSelectedIdx(updated.findIndex((c) => buildCharacterKey(c) === key))
  }

  const handleDeleteChar = async (id: string | number) => {
    const ok = await confirm(t('deleteSheetConfirm'), { danger: true })
    if (!ok) return
    const idx = characters.findIndex((c) => String(c.id) === String(id))
    if (idx === -1) return
    const toDelete = characters.at(idx)
    const remaining = characters.filter((_, i) => i !== idx)
    saveCharacters(remaining)
    const selection = parseSelectionKey(localStorage.getItem(SELECTED_KEY))
    if (
      selection.id &&
      selection.id === String(toDelete?.id ?? '') &&
      (!selection.owner || selection.owner === toDelete?.owner)
    ) {
      localStorage.removeItem(SELECTED_KEY)
      setSelectedIdx(null)
    } else if (selection.id) {
      const newIdx = remaining.findIndex(
        (c) =>
          c.id?.toString() === selection.id &&
          (!selection.owner || c.owner === selection.owner),
      )
      setSelectedIdx(newIdx !== -1 ? newIdx : null)
    } else {
      setSelectedIdx(null)
    }
  }

  const handleImportClick = () => fileInputRef.current?.click()
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string)
        // Validation minimale : doit ressembler à une fiche (avoir au moins un champ reconnu)
        const knownFields = ['nom', 'name', 'race', 'classe', 'force', 'pv', 'niveau']
        const hasKnownField = knownFields.some((f) => f in imported)
        if (!hasKnownField || typeof imported !== 'object' || Array.isArray(imported)) {
          setStatusMessage(t('importFail'))
          return
        }
        const normalized = normalizeCharacter(
          {
            ...imported,
            id: imported.id || crypto.randomUUID(),
            owner: imported.owner || user?.pseudo || '',
          },
          user?.pseudo ?? null,
        )
        const key = buildCharacterKey(normalized)
        const idx = characters.findIndex(
          (c) => buildCharacterKey(c) === key,
        )
        const updated =
          idx !== -1
            ? characters.map((c, i) => (i === idx ? normalized : c))
            : [...characters, normalized]
        saveCharacters(updated)
        const newIdx =
          idx !== -1
            ? idx
            : updated.findIndex((c) => buildCharacterKey(c) === key)
        localStorage.setItem(
          SELECTED_KEY,
          buildSelectionKey(normalized.id, normalized.owner),
        )
        setSelectedIdx(newIdx !== -1 ? newIdx : updated.length - 1)
        setStatusMessage(t('importSuccess'))
      } catch {
        setStatusMessage(t('invalidFile'))
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExportChar = () => {
    if (selectedIdx === null) return
      const char = characters.at(selectedIdx)!
    const blob = new Blob([JSON.stringify(char, null, 2)], {
      type: 'text/plain',
    })
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: `${(char.nom || 'fiche').replace(/\s+/g, '_')}.txt`,
    })
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setStatusMessage(t('exportSuccess'))
  }

  const handleUploadChar = async (char: Character) => {
    if (!selectedRoom || !user) return
    try {
      const updatedChar = normalizeCharacter(
        { ...char, updatedAt: Date.now() },
        user.pseudo,
      )
      const auth = await roomAuthHeaders(selectedRoom.id)
      if (!auth) {
        setStatusMessage(t('roomAccessDenied'))
        return
      }
      await fetch('/api/roomstorage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          id: char.id,
          owner: char.owner,
          character: updatedChar,
        }),
      })
      setRemoteChars((r) => ({
        ...r,
        [buildCharacterKey(updatedChar)]: updatedChar,
      }))
      setStatusMessage(t('saveCloud'))
    } catch {
      setStatusMessage(t('saveCloudFail'))
    }
  }

  const handleDownloadChar = async (char: Character) => {
    const normalized = normalizeCharacter(char, user?.pseudo ?? null)
    const key = buildCharacterKey(normalized)
    const idx = characters.findIndex((c) => buildCharacterKey(c) === key)
    const updated =
      idx !== -1
        ? characters.map((c, i) => (i === idx ? normalized : c))
        : [...characters, normalized]
    saveCharacters(updated)
    const newIdx = updated.findIndex((c) => buildCharacterKey(c) === key)
    if (newIdx !== -1) {
      setSelectedIdx(newIdx)
      const selected = updated.at(newIdx)
      if (selected) {
        localStorage.setItem(
          SELECTED_KEY,
          buildSelectionKey(selected.id, selected.owner),
        )
      }
    }
    return newIdx
  }

  // FIX: Import depuis le Cloud (BLOB) vers le local et sélectionner
  const handleImportFromBlob = (char: Character) => {
    const normalized = normalizeCharacter(char, user?.pseudo ?? null)
    const key = buildCharacterKey(normalized)
    const idx = characters.findIndex((c) => buildCharacterKey(c) === key)
    const updated =
      idx !== -1
        ? characters.map((c, i) => (i === idx ? normalized : c))
        : [...characters, normalized]
    saveCharacters(updated)
    const newIdx = updated.findIndex((c) => buildCharacterKey(c) === key)
    setSelectedIdx(newIdx === -1 ? null : newIdx)
    setStatusMessage(t('loadCloudSuccess'))
  }

  const handleDeleteCloudChar = async (char: Character) => {
    if (!selectedRoom) return
    const ok = await confirm(t('deleteSheetConfirm'), { danger: true })
    if (!ok) return
    const auth = await roomAuthHeaders(selectedRoom.id)
    if (!auth) {
      setStatusMessage(t('roomAccessDenied'))
      return
    }
    await fetch(
      `/api/roomstorage?roomId=${encodeURIComponent(selectedRoom.id)}&owner=${encodeURIComponent(char.owner)}&id=${encodeURIComponent(String(char.id))}`,
      { method: 'DELETE', headers: auth },
    )
    setRemoteChars((r) => {
      const next = { ...r }
      delete next[buildCharacterKey(char)]
      return next
    })
  }

  const handleChangeColor = (color: string) => {
    if (!user) return
    // La couleur est enregistree sur le compte : elle suit le joueur d'un
    // navigateur a l'autre, et sert aussi a colorer son curseur pour les autres.
    void fetch('/api/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    })
      .then(() => window.dispatchEvent(new Event('jdr_profile_change')))
      .catch(() => setStatusMessage(t('saveCloudFail')))
  }

  // Le role de MJ n'est plus une case a cocher : il decoule du compte, et a
  // terme de la table dont on est le createur. La bascule manuelle permettait
  // a n'importe qui de s'attribuer les outils du MJ.

  if (!hydrated) return <div className="w-full h-full" />

  const filteredCharacters = user ? characters : []

  const handleSelectChar = (idx: number) => {
    if (idx === -1) {
      setSelectedIdx(null)
      localStorage.removeItem(SELECTED_KEY)
      return
    }
    setSelectedIdx(idx)
    const ch = filteredCharacters.at(idx)
    if (ch?.id !== undefined) {
      localStorage.setItem(
        SELECTED_KEY,
        buildSelectionKey(ch.id, ch.owner),
      )
    }
  }

  if (loggingOut) {
    return <div className="w-full min-h-screen bg-transparent" />
  }

  return (
    <>
      {/* ConfirmDialog global — remplace window.confirm dans toute la page */}
      <ConfirmDialog
        open={!!confirmState}
        message={confirmState?.message ?? ''}
        title={confirmState?.title}
        danger={confirmState?.danger}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Header avec le bouton qui change de fond */}
      {user && <MenuHeader />}
      {/* Barre d'outils en haut a droite : le theme et la langue. La pastille
          du compte n'y est plus : le pseudo est deja dans la barre profil, et
          les joueurs en ligne s'affichent dans la table. */}
      <div className="fixed right-3 top-3 z-50 flex items-center gap-2">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      <div className="w-full min-h-screen relative text-ink px-6 pb-8 flex flex-col max-w-7xl mx-auto bg-transparent overflow-hidden">
        {profileLoading || wrongPage ? (
          <div className="flex-grow flex items-center justify-center" aria-busy="true">
            <SmallSpinner />
          </div>
        ) : !user ? (
          <div className="flex-grow flex items-center justify-center">
            <SignedOutPanel />
          </div>
        ) : !user.pseudoChosen ? (
          // Première visite : le pseudo proposé vient du compte Google ou
          // Discord, le joueur le valide ou le change avant d'entrer.
          <div className="flex-grow flex items-center justify-center">
            <PseudoPicker initial={user.pseudo} />
          </div>
        ) : (
          <>
            {/* Barre profil : qui je suis, puis l'action principale, entrer en jeu */}
            <section className="ui-panel mt-2 mb-4 flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="truncate text-lg font-bold tracking-wide select-none"
                  style={{ color: user.color }}
                >
                  {user.pseudo}
                </span>
                <ProfileColorPicker
                  color={user.color}
                  onChange={handleChangeColor}
                />
              </div>

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePlay}
                  disabled={!selectedRoom}
                  className="ui-btn ui-btn-primary !min-h-10 !px-5 max-w-[22rem]"
                >
                  {selectedRoom && roomLoading ? <SmallSpinner /> : <LogIn size={16} />}
                  <span className="truncate">
                    {selectedRoom
                      ? t('enterRoomNamed').replace('{n}', selectedRoom.name || t('unnamedRoom'))
                      : t('pickARoom')}
                  </span>
                </button>
                <button onClick={handleLogout} className="ui-btn ui-btn-ghost">
                  <LogOut size={16} />
                  {t('logout')}
                </button>
              </div>
            </section>

            {/* Tables à gauche, personnages à droite sur grand écran */}
            <div className="grid flex-1 min-h-0 items-start gap-4 lg:grid-cols-2">
              <RoomList
                selectedId={selectedRoom?.id || null}
                onSelect={handleRoomSelect}
                onEnter={handleEnterRoom}
                onCreateClick={() => setCreateRoomOpen(true)}
              />
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
                onOpenCloud={() => setCloudOpen(true)}
              />
            </div>
            <RoomCreateModal
              open={createRoomOpen}
              onClose={() => setCreateRoomOpen(false)}
              onCreated={handleRoomSelect}
            />

            <div className="mt-4 flex justify-end">
              <DeleteAccount pseudo={user.pseudo} />
            </div>

            <CharacterEditor
              key={draftChar.id}
              open={modalOpen}
              character={draftChar}
              isNew={!characters.some((c) => String(c.id) === String(draftChar.id))}
              onSave={handleSaveDraft}
              onClose={() => setModalOpen(false)}
            />
          </>
        )}
      </div>

      {/* Modals portés hors du div overflow-hidden pour éviter le clipping sur fixed */}
      <CharacterCloudModal
        open={cloudOpen}
        onClose={() => setCloudOpen(false)}
        roomId={selectedRoom?.id || null}
        localChars={characters}
        onImported={handleImportFromBlob}
      />
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="ui-panel fixed bottom-10 left-1/2 z-50 -translate-x-1/2 px-4 py-2 text-sm shadow-lg !backdrop-blur-md"
            style={{ background: 'var(--c-panel-head)' }}
          >
            {statusMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

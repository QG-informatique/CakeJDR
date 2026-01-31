'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useBroadcastEvent, useEventListener, useMyPresence, useSelf } from '@liveblocks/react'
import { useRouter, useParams } from 'next/navigation'
import CharacterSheet, { defaultPerso } from '@/components/sheet/CharacterSheet'
import DiceRoller from '@/components/dice/DiceRoller'
import ChatBox from '@/components/chat/ChatBox'
import PopupResult from '@/components/dice/PopupResult'
import InteractiveCanvas from '@/components/canvas/InteractiveCanvas'
import MusicPlayer from '@/components/music/MusicPlayer'
import LiveAvatarStack from '@/components/chat/LiveAvatarStack'
import Login from '@/components/login/Login'
import GMCharacterSelector from '@/components/misc/GMCharacterSelector'
import ImportExportMenu from '@/components/character/ImportExportMenu'
import useDiceHistory from './hooks/useDiceHistory'
import useEventLog from './hooks/useEventLog'
import useProfile from './hooks/useProfile'
import useOnlineStatus from './hooks/useOnlineStatus'
import ErrorBoundary from '@/components/misc/ErrorBoundary'
import { debug } from '@/lib/debug'
import {
  type Character,
  buildCharacterKey,
  buildSelectionKey,
  normalizeCharacter,
  parseSelectionKey,
} from '@/types/character'

const SELECTED_CHARACTER_KEY = 'selectedCharacterId'

export default function HomePageInner() {
  const router = useRouter()
  const [user, setUser] = useState<string | null>(null)
  const profile = useProfile()
  const self = useSelf()
  const myConnectionId = self?.connectionId ?? null
  const [perso, setPerso] = useState<Character>(() =>
    normalizeCharacter(defaultPerso),
  )
  const [characters, setCharacters] = useState<Character[]>([])

  const [showPopup, setShowPopup] = useState(false)
  const [diceType, setDiceType] = useState(6)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [diceDisabled, setDiceDisabled] = useState(false)
  const { id: roomId } = useParams<{ id: string }>()
  const [pendingRoll, setPendingRoll] = useState<{ result: number; dice: number; nom: string } | null>(null)
  const [history, setHistory] = useDiceHistory(roomId)
  const { addEvent } = useEventLog(roomId)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const [canvasKey, setCanvasKey] = useState(0)
  const lastRollTs = useRef<number | null>(null)
  const [cooldown, setCooldown] = useState(false)
  const remoteLoadedRef = useRef(false)
  const initialBackupDone = useRef(false)
  // total durée d'indisponibilité du bouton (animation + hold + cooldown)
  const ROLL_TOTAL_MS = 2000 + 300 + 2000 + 1000

  const broadcast = useBroadcastEvent()
  const [, updateMyPresence] = useMyPresence()

  // Reset room-scoped flags when navigating between rooms
  useEffect(() => {
    remoteLoadedRef.current = false
    initialBackupDone.current = false
  }, [roomId])

  const saveCharacterToCloud = useCallback(async (char: Character) => {
    if (!roomId) return
    const normalized = normalizeCharacter(char, profile?.pseudo ?? null)
    const owner = normalized.owner || profile?.pseudo
    if (!owner || !normalized.id) return
    try {
      await fetch('/api/roomstorage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          id: normalized.id,
          owner,
          character: { ...normalized, owner },
        }),
      })
    } catch {
      // best-effort : ne bloque pas l'UI en cas d'échec réseau
    }
  }, [roomId, profile?.pseudo])

  // listen for remote events
  useEventListener((payload) => {
    const { event } = payload
    if (event.type === 'dice-roll') {
      const ts =
        typeof (event as { ts?: number }).ts === 'number'
          ? (event as { ts: number }).ts
          : Date.now()
      if (ts === lastRollTs.current) return
      setHistory((h) => [...h, { player: event.player, dice: event.dice, result: event.result, ts }])
      debug('dice-roll received', event)
      addEvent({ id: crypto.randomUUID(), kind: 'dice', player: event.player, dice: event.dice, result: event.result, ts })
      return
    }

    if (event.type === 'gm-select') {
      const selectionTarget: number | null =
        typeof event.targetConnectionId === 'number' ? event.targetConnectionId : null
      // Ne change jamais la fiche des autres sauf si explicitement ciblé
      if (selectionTarget === null || selectionTarget !== myConnectionId) {
        return
      }

      const incomingChar = normalizeCharacter(
        event.character ?? defaultPerso,
        profile?.pseudo ?? null,
      )
      const owner = incomingChar.owner || profile?.pseudo || ''
      const finalChar: Character = { ...incomingChar, owner }

      setPerso(finalChar)
      updateMyPresence({
        character: {
          ...finalChar,
          ownerConnectionId: myConnectionId ?? undefined,
        },
      })
      void saveCharacterToCloud(finalChar)

      setCharacters((prev) => {
        const idx = prev.findIndex(
          (c) => c.id === finalChar.id && c.owner === finalChar.owner,
        )
        const next =
          idx !== -1
            ? prev.map((c, i) => (i === idx ? { ...c, ...finalChar } : c))
            : [...prev, finalChar]
        if (typeof window !== 'undefined') {
          localStorage.setItem('jdr_characters', JSON.stringify(next))
          localStorage.setItem(
            SELECTED_CHARACTER_KEY,
            buildSelectionKey(finalChar.id, finalChar.owner ?? null),
          )
          window.dispatchEvent(new Event('jdr_characters_change'))
        }
        return next
      })
    }
  })


  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!sessionStorage.getItem('visitedMenu')) {
      sessionStorage.setItem('visitedMenu', 'true')
      router.push('/menu')
    }
  }, [router])

  useOnlineStatus(user, profile)

  useEffect(() => {
    if (profile) setUser(profile.pseudo)
  }, [profile])

  useEffect(() => {
    if (profile) {
      updateMyPresence({ name: profile.pseudo, color: profile.color })
    }
  }, [profile, updateMyPresence])

  useEffect(() => {
    const savedChars = localStorage.getItem('jdr_characters')
    let chars: Character[] = []
    if (savedChars) {
      try {
        const parsed = JSON.parse(savedChars)
        if (Array.isArray(parsed)) {
          chars = parsed.map((c) =>
            normalizeCharacter(c, profile?.pseudo ?? null),
          )
          setCharacters(chars)
        }
      } catch {}
    }

    const { owner, id } = parseSelectionKey(
      localStorage.getItem(SELECTED_CHARACTER_KEY),
    )

    const found =
      id && chars.length
        ? chars.find(
            (c) =>
              c.id?.toString() === id && (!owner || c.owner === owner),
          )
        : null

    const nextChar = found
      ? found
      : normalizeCharacter(
          { ...defaultPerso, owner: profile?.pseudo || defaultPerso.owner },
          profile?.pseudo ?? null,
        )

    setPerso(nextChar)
    updateMyPresence({
      character: {
        ...nextChar,
        ownerConnectionId: myConnectionId ?? undefined,
      },
    })

    if (!found && typeof window !== 'undefined') {
      localStorage.removeItem(SELECTED_CHARACTER_KEY)
    }
  }, [profile?.pseudo, myConnectionId, updateMyPresence])

  // Chargement automatique des fiches stockées côté serveur (Liveblocks storage)
  useEffect(() => {
    if (!roomId || remoteLoadedRef.current) return
    let cancelled = false
    const loadRemote = async () => {
      try {
        const res = await fetch(`/api/roomstorage?roomId=${encodeURIComponent(roomId)}`)
        if (!res.ok) return
        const data = await res.json().catch(() => null)
        const charsObj = (data?.characters as Record<string, Character> | undefined) ?? {}
        const values = Object.values(charsObj)
        if (!values.length) return
        remoteLoadedRef.current = true
        const normalizedValues = values.map((c) =>
          normalizeCharacter(
            { ...c, owner: c.owner || profile?.pseudo || 'anon' },
            profile?.pseudo ?? null,
          ),
        )
        setCharacters((prev) => {
          const map = new Map<string, Character>()
          prev.forEach((c) => map.set(buildCharacterKey(c), c))
          normalizedValues.forEach((c) => {
            const key = buildCharacterKey(c)
            const current = map.get(key)
            const currentTs = Number(current?.updatedAt ?? 0)
            const incomingTs = Number(c.updatedAt ?? 0)
            if (!current || incomingTs > currentTs) {
              map.set(key, c)
            }
          })
          const merged = Array.from(map.values())
          if (typeof window !== 'undefined') {
            localStorage.setItem('jdr_characters', JSON.stringify(merged))
          }
          return merged
        })
        const preferred = (!perso?.id || characters.length === 0)
          ? normalizedValues.find((c) => c.owner === profile?.pseudo) ?? normalizedValues[0]
          : null
        if (preferred && !cancelled) {
          const finalChar = normalizeCharacter(
            { ...preferred, owner: preferred.owner || profile?.pseudo || '' },
            profile?.pseudo ?? null,
          )
          setPerso(finalChar)
          updateMyPresence({
            character: {
              ...finalChar,
              ownerConnectionId: myConnectionId ?? undefined,
            },
          })
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              SELECTED_CHARACTER_KEY,
              buildSelectionKey(finalChar.id, finalChar.owner ?? null),
            )
          }
        }
      } catch {
        // réseau indisponible : on ne bloque pas l'UX
      }
    }
    void loadRemote()
    return () => { cancelled = true }
  }, [roomId, profile?.pseudo, updateMyPresence, myConnectionId, perso?.id, characters.length])

  // Sauvegarde initiale silencieuse dans le cloud pour éviter la perte de fiche
  useEffect(() => {
    if (!roomId || !perso?.id || initialBackupDone.current) return
    initialBackupDone.current = true
    void saveCharacterToCloud(perso)
  }, [roomId, perso, saveCharacterToCloud])

  const handleUpdatePerso = (incoming: Character) => {
    const updatedPerso = normalizeCharacter(
      {
        ...incoming,
        owner: incoming.owner || profile?.pseudo || '',
        updatedAt: Date.now(),
      },
      profile?.pseudo ?? null,
    )
    const characterKey = buildCharacterKey(updatedPerso)

    setPerso(updatedPerso)
    updateMyPresence({
      character: {
        ...updatedPerso,
        ownerConnectionId: myConnectionId ?? undefined,
      },
    })

    setCharacters((prevChars) => {
      let found = false
      const next = prevChars.map((c) => {
        if (buildCharacterKey(c) === characterKey) {
          found = true
          return { ...c, ...updatedPerso }
        }
        return c
      })
      const finalList = found ? next : [...next, updatedPerso]
      if (typeof window !== 'undefined') {
        localStorage.setItem('jdr_characters', JSON.stringify(finalList))
        localStorage.setItem(
          SELECTED_CHARACTER_KEY,
          buildSelectionKey(updatedPerso.id, updatedPerso.owner ?? null),
        )
        window.dispatchEvent(new Event('jdr_characters_change'))
      }
      return finalList
    })
    void saveCharacterToCloud(updatedPerso)
  }

  const handleGMSelect = (char: Character) => {
    const next = normalizeCharacter(
      { ...char, owner: char.owner || profile?.pseudo || '' },
      profile?.pseudo ?? null,
    )
    setPerso(next)
    updateMyPresence({ gmView: { id: next.id, name: next.nom || next.name } })
    // Diffuse un événement d'observation (sans ciblage) pour information uniquement
    broadcast({ type: 'gm-select', character: next, targetConnectionId: null })
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  const rollDice = () => {
    if (diceDisabled) return
    setDiceDisabled(true)
    setCooldown(true)
    const result = Math.floor(Math.random() * diceType) + 1
    setDiceResult(result)
    setShowPopup(true)
    setPendingRoll({ result, dice: diceType, nom: perso.nom || '?' })
  }

  const handlePopupReveal = () => {
    if (!pendingRoll) return
    const { nom, dice, result } = pendingRoll

    const ts = Date.now()
    const entry = { player: nom, dice, result, ts }

    lastRollTs.current = ts
    setHistory((h) => [...h, entry])
    addEvent({ id: crypto.randomUUID(), kind: 'dice', ...entry })

    broadcast({ type: 'dice-roll', player: nom, dice, result, ts })
    debug('dice-roll send', entry)
    setPendingRoll(null)

  }

  const handlePopupFinish = () => {
    setShowPopup(false)
    window.setTimeout(() => {
      setCooldown(false)
      setDiceDisabled(false)
      setDiceResult(null)
    }, 1000)
  }

  return (
    <div className="relative w-screen h-dvh font-sans overflow-hidden bg-transparent">
      <div className="relative z-10 flex flex-col lg:flex-row w-full h-full">
        <CharacterSheet perso={perso} onUpdate={handleUpdatePerso} chatBoxRef={chatBoxRef} allCharacters={characters} logoOnly>
          <span className="ml-2">
            <GMCharacterSelector onSelect={handleGMSelect} />
          </span>
          <span className="ml-1">
            <ImportExportMenu perso={perso} onUpdate={handleUpdatePerso} />
          </span>
        </CharacterSheet>

        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 m-4 flex flex-col justify-center items-center relative min-h-0">
            <ErrorBoundary
              key={canvasKey}
              fallbackRender={({ error, reset }) => (
                <div className="p-4 text-red-500 flex flex-col items-center gap-2">
                  <div>Canvas error: {String(error?.message || 'Unknown')}</div>
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => { reset(); setCanvasKey((k) => k + 1) }}
                  >Reload canvas</button>
                  <button
                    className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600"
                    onClick={() => window.location.reload()}
                  >Reload page</button>
                </div>
              )}
            >
              <InteractiveCanvas />
            </ErrorBoundary>
            <ErrorBoundary fallback={<div className="p-4 text-red-500">Dice display error</div>}>
              <PopupResult show={showPopup} result={diceResult} diceType={diceType} onReveal={handlePopupReveal} onFinish={handlePopupFinish} />
            </ErrorBoundary>
          </div>
          <ErrorBoundary fallback={<div className="p-4 text-red-500">Dice roller error</div>}>
            <DiceRoller
              diceType={diceType}
              onChange={setDiceType}
              onRoll={rollDice}
              disabled={diceDisabled}
              cooldown={cooldown}
              cooldownDuration={ROLL_TOTAL_MS}
              afterRoll={<MusicPlayer />}
            >
              <LiveAvatarStack />
            </DiceRoller>
          </ErrorBoundary>
        </main>

        <ErrorBoundary fallback={<div className="p-4 text-red-500">Chat error</div>}>
          <ChatBox
            chatBoxRef={chatBoxRef}
            history={history}
            author={profile?.isMJ
              ? profile.pseudo
              : perso.nom || profile?.pseudo || 'Anonymous'}
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}






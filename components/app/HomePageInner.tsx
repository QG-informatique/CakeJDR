'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'
import { useBroadcastEvent, useEventListener, useMyPresence, useSelf } from '@liveblocks/react'
import { useRouter, useParams } from 'next/navigation'
import CharacterSheet, { defaultPerso } from '@/components/sheet/CharacterSheet'
import DiceRoller from '@/components/dice/DiceRoller'
import ChatBox from '@/components/chat/ChatBox'
import PopupResult from '@/components/dice/PopupResult'
import Head from 'next/head'
import InteractiveCanvas from '@/components/canvas/InteractiveCanvas'
import LiveAvatarStack from '@/components/chat/LiveAvatarStack'
import Login from '@/components/login/Login'
import GMCharacterSelector from '@/components/misc/GMCharacterSelector'
import useDiceHistory from './hooks/useDiceHistory'
import useEventLog from './hooks/useEventLog'
import useProfile from './hooks/useProfile'
import useOnlineStatus from './hooks/useOnlineStatus'
import ErrorBoundary from '@/components/misc/ErrorBoundary'
import { debug } from '@/lib/debug'

const SELECTED_CHARACTER_KEY = 'selectedCharacterId'

type StoredSelection = { owner: string | null; id: string | null }

const buildSelectionKey = (id: string | number | undefined, owner?: string | null) => {
  if (!id) return ''
  const idStr = String(id)
  const ownerStr = owner ? String(owner) : ''
  return ownerStr ? `${ownerStr}::${idStr}` : idStr
}

const parseSelectionKey = (raw: string | null): StoredSelection => {
  if (!raw) return { owner: null, id: null }
  const [owner, id] = raw.includes('::') ? raw.split('::', 2) : [null, raw]
  return { owner: owner && owner.length ? owner : null, id: id ?? null }
}

export default function HomePageInner() {
  const router = useRouter()
  const [user, setUser] = useState<string | null>(null)
  const profile = useProfile()
  const self = useSelf()
  const myConnectionId = self?.connectionId ?? null
  const [perso, setPerso] = useState(defaultPerso)
  const [characters, setCharacters] = useState<any[]>([])

  const [showPopup, setShowPopup] = useState(false)
  const [diceType, setDiceType] = useState(6)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [diceDisabled, setDiceDisabled] = useState(false)
  const { id: roomId } = useParams<{ id: string }>()
  const [pendingRoll, setPendingRoll] = useState<{ result: number; dice: number; nom: string } | null>(null)
  const [history, setHistory] = useDiceHistory(roomId)
  const { addEvent } = useEventLog(roomId)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const lastRollTs = useRef<number | null>(null)
  const [cooldown, setCooldown] = useState(false)
  // total durée d'indisponibilité du bouton (animation + hold + cooldown)
  const ROLL_TOTAL_MS = 2000 + 300 + 2000 + 1000

  const broadcast = useBroadcastEvent()
  const [, updateMyPresence] = useMyPresence()

  // listen for remote events
  useEventListener((payload: any) => {
    const { event } = payload
    if (event.type === 'dice-roll') {
      const ts = typeof event.ts === 'number' ? event.ts : Date.now()
      if (ts === lastRollTs.current) return
      setHistory((h) => [...h, { player: event.player, dice: event.dice, result: event.result, ts }])
      debug('dice-roll received', event)
      return
    }

    if (event.type === 'gm-select') {
      const selectionTarget: number | null =
        typeof event.targetConnectionId === 'number'
          ? event.targetConnectionId
          : null
      const incomingChar = event.character || defaultPerso
      const safeChar = { ...incomingChar }
      if (!safeChar.id) safeChar.id = crypto.randomUUID()
      const owner = safeChar.owner ? String(safeChar.owner) : null
      const belongsToMe =
        !!owner && profile?.pseudo
          ? String(profile.pseudo) === owner
          : false
      const isForMe =
        selectionTarget === null || selectionTarget === myConnectionId
      if (!profile?.isMJ && !belongsToMe && !isForMe) {
        return
      }

      const finalChar = {
        ...safeChar,
        owner: owner || profile?.pseudo || safeChar.owner || null,
      }

      setPerso(finalChar)

      if (belongsToMe || profile?.isMJ) {
        if (belongsToMe) {
          updateMyPresence({
            character: {
              ...finalChar,
              ownerConnectionId: myConnectionId ?? undefined,
            },
          })
        }
        setCharacters((prev) => {
          const idx = prev.findIndex(
            (c) =>
              String(c.id) === String(finalChar.id) &&
              c.owner === finalChar.owner,
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
    let chars: any[] = []
    if (savedChars) {
      try {
        const parsed = JSON.parse(savedChars)
        if (Array.isArray(parsed)) {
          chars = parsed
          setCharacters(parsed)
        }
      } catch {}
    }

    const { owner, id } = parseSelectionKey(
      localStorage.getItem(SELECTED_CHARACTER_KEY),
    )

    const found =
      id && chars.length
        ? chars.find(
            (c: any) =>
              c.id?.toString() === id && (!owner || c.owner === owner),
          )
        : null

    const nextChar = found
      ? { ...found }
      : { ...defaultPerso, owner: profile?.pseudo || defaultPerso.owner }

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

  const handleUpdatePerso = (incoming: any) => {
    const ensuredOwner = incoming.owner || profile?.pseudo || incoming.owner || null
    let id = incoming.id
    if (!id) {
      id = crypto.randomUUID()
    }
    const updatedPerso = {
      ...incoming,
      id,
      owner: ensuredOwner,
      updatedAt: Date.now(),
    }

    setPerso(updatedPerso)
    updateMyPresence({
      character: {
        ...updatedPerso,
        ownerConnectionId: myConnectionId ?? undefined,
      },
    })

    if (profile?.isMJ || updatedPerso.owner === profile?.pseudo) {
      setCharacters((prevChars) => {
        let found = false
        const next = prevChars.map((c) => {
          if (
            String(c.id) === String(id) &&
            c.owner === updatedPerso.owner
          ) {
            found = true
            return { ...c, ...updatedPerso }
          }
          return c
        })
        if (!found) next.push(updatedPerso)
        if (typeof window !== 'undefined') {
          localStorage.setItem('jdr_characters', JSON.stringify(next))
          localStorage.setItem(
            SELECTED_CHARACTER_KEY,
            buildSelectionKey(id, updatedPerso.owner ?? null),
          )
          window.dispatchEvent(new Event('jdr_characters_change'))
        }
        return next
      })
    }
  }

  const handleGMSelect = (char: any) => {
    const next = {
      ...char,
      owner: char.owner || profile?.pseudo || char.owner || null,
    }
    setPerso(next)
    updateMyPresence({ gmView: { id: next.id, name: next.nom || next.name } })
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

    broadcast({ type: 'dice-roll', player: nom, dice, result, ts } as Liveblocks['RoomEvent'])
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
          {profile?.isMJ && (
            <span className="ml-2">
              <GMCharacterSelector onSelect={handleGMSelect} />
            </span>
          )}
        </CharacterSheet>

        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 m-4 flex flex-col justify-center items-center relative min-h-0">
            <ErrorBoundary fallback={<div className="p-4 text-red-500">Canvas error</div>}>
              <InteractiveCanvas />
            </ErrorBoundary>
            <ErrorBoundary fallback={<div className="p-4 text-red-500">Dice display error</div>}>
              <PopupResult show={showPopup} result={diceResult} diceType={diceType} onReveal={handlePopupReveal} onFinish={handlePopupFinish} />
            </ErrorBoundary>
          </div>
          <ErrorBoundary fallback={<div className="p-4 text-red-500">Dice roller error</div>}>
            <DiceRoller diceType={diceType} onChange={setDiceType} onRoll={rollDice} disabled={diceDisabled} cooldown={cooldown} cooldownDuration={ROLL_TOTAL_MS}>
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
      <Head>
        <title>CakeJDR</title>
      </Head>
    </div>
  )
}

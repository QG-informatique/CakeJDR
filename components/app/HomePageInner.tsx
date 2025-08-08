'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'
import { useBroadcastEvent, useEventListener, useMyPresence } from '@liveblocks/react'
import { useRouter, useParams } from 'next/navigation'
import { defaultPerso } from '@/components/sheet/CharacterSheet'
import CharacterPanel from '@/components/panels/CharacterPanel'
import ChatPanel from '@/components/panels/ChatPanel'
import DicePanel from '@/components/panels/DicePanel'
import PopupResult from '@/components/dice/PopupResult'
import Head from 'next/head'
import InteractiveCanvas from '@/components/canvas/InteractiveCanvas'
import LiveAvatarStack from '@/components/chat/LiveAvatarStack'
import SideNotes from '@/components/misc/SideNotes'
import Login from '@/components/login/Login'
import GMCharacterSelector from '@/components/misc/GMCharacterSelector'
import useDiceHistory from './hooks/useDiceHistory'
import useEventLog from './hooks/useEventLog'
import useProfile from './hooks/useProfile'
import useOnlineStatus from './hooks/useOnlineStatus'

export default function HomePageInner() {
  const router = useRouter()
  const [user, setUser] = useState<string | null>(null)
  const profile = useProfile()
  const [perso, setPerso] = useState(defaultPerso)
  const [characters, setCharacters] = useState<any[]>([])

  const [characterCollapsed, setCharacterCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('characterCollapsed') === 'true'
    }
    return false
  })
  const [chatCollapsed, setChatCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatCollapsed') === 'true'
    }
    return false
  })
  const [diceCollapsed, setDiceCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('diceCollapsed') === 'true'
    }
    return false
  })

  const [showPopup, setShowPopup] = useState(false)
  const [diceType, setDiceType] = useState(6)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [diceDisabled, setDiceDisabled] = useState(false)
  const { id: roomId } = useParams<{ id: string }>()
  const [pendingRoll, setPendingRoll] = useState<{ result: number; dice: number; nom: string } | null>(null)
  const [history, setHistory] = useDiceHistory(roomId)
  const { addEvent } = useEventLog(roomId)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const [cooldown, setCooldown] = useState(false)
  // total durée d'indisponibilité du bouton (animation + hold + cooldown)
  const ROLL_TOTAL_MS = 2000 + 300 + 2000 + 1000

  const broadcast = useBroadcastEvent()
  const [, updateMyPresence] = useMyPresence()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('characterCollapsed', String(characterCollapsed))
    }
  }, [characterCollapsed])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatCollapsed', String(chatCollapsed))
    }
  }, [chatCollapsed])
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('diceCollapsed', String(diceCollapsed))
    }
  }, [diceCollapsed])

  // listen for remote dice rolls
  useEventListener((payload: any) => {
    const { event } = payload
    if (event.type === 'dice-roll') {
      setHistory((h) => [...h, { player: event.player, dice: event.dice, result: event.result, ts: Date.now() }])
    } else if (event.type === 'gm-select') {
      const char = event.character || defaultPerso
      if (!char.id) char.id = crypto.randomUUID()
      setPerso(char)
      updateMyPresence({ character: char })
      setCharacters(prev => {
        const idx = prev.findIndex(c => String(c.id) === String(char.id))
        const next = idx !== -1 ? prev.map((c,i)=> i===idx ? char : c) : [...prev, char]
        localStorage.setItem('jdr_characters', JSON.stringify(next))
        localStorage.setItem('selectedCharacterId', String(char.id))
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
    let chars = []
    if (savedChars) {
      try {
        chars = JSON.parse(savedChars)
        setCharacters(chars)
      } catch {}
    }
    const selectedId = localStorage.getItem('selectedCharacterId')
    if (selectedId && chars.length) {
      const found = chars.find((c: any) => c.id?.toString() === selectedId)
      if (found) {
        setPerso(found)
        updateMyPresence({ character: found })
      } else {
        setPerso(defaultPerso)
        updateMyPresence({ character: defaultPerso })
      }
    } else {
      setPerso(defaultPerso)
      updateMyPresence({ character: defaultPerso })
    }
  }, [updateMyPresence])

  const handleUpdatePerso = (newPerso: any) => {
    let id = newPerso.id
    if (!id) {
      id = crypto.randomUUID()
      newPerso = { ...newPerso, id }
    }
    newPerso = { ...newPerso, updatedAt: Date.now() }
    setPerso(newPerso)
    updateMyPresence({ character: newPerso })
    setCharacters((prevChars) => {
      let found = false
      const next = prevChars.map((c) => {
        if (c.id === id) {
          found = true
          return { ...c, ...newPerso }
        }
        return c
      })
      if (!found) next.push(newPerso)
      localStorage.setItem('jdr_characters', JSON.stringify(next))
      localStorage.setItem('selectedCharacterId', id)
      return next
    })
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
    const entry = { player: nom, dice, result, ts: Date.now() }
    setHistory((h) => [...h, entry])
    broadcast({ type: 'dice-roll', player: nom, dice, result } as Liveblocks['RoomEvent'])
    addEvent({ id: crypto.randomUUID(), kind: 'dice', player: nom, dice, result, ts: entry.ts })
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
    <div className="relative w-screen h-screen font-sans overflow-hidden bg-transparent">
      <div className="relative z-10 flex flex-col lg:flex-row w-full h-full">
        <CharacterPanel
          collapsed={characterCollapsed}
          onToggle={() => setCharacterCollapsed(c => !c)}
          perso={perso}
          onUpdate={handleUpdatePerso}
          chatBoxRef={chatBoxRef}
          allCharacters={characters}
          logoOnly
        >
          {profile?.isMJ && (
            <span className="ml-2">
              <GMCharacterSelector onSelect={handleUpdatePerso} />
            </span>
          )}
        </CharacterPanel>

        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 m-4 flex flex-col justify-center items-center relative min-h-0">
            <InteractiveCanvas />
            <PopupResult show={showPopup} result={diceResult} diceType={diceType} onReveal={handlePopupReveal} onFinish={handlePopupFinish} />
          </div>
          <DicePanel
            collapsed={diceCollapsed}
            onToggle={() => setDiceCollapsed(c => !c)}
            diceType={diceType}
            onChange={setDiceType}
            onRoll={rollDice}
            disabled={diceDisabled}
            cooldown={cooldown}
            cooldownDuration={ROLL_TOTAL_MS}
          >
            <LiveAvatarStack />
          </DicePanel>
        </main>

        <ChatPanel
          collapsed={chatCollapsed}
          onToggle={() => setChatCollapsed(c => !c)}
          chatBoxRef={chatBoxRef}
          history={history}
          author={perso.nom || profile?.pseudo || 'Anonymous'}
        />
        <SideNotes />
      </div>
      <Head>
        <title>CakeJDR</title>
      </Head>
    </div>
  )
}

'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'
import { useBroadcastEvent, useEventListener, useMyPresence } from '@liveblocks/react'
import { useRouter, useParams } from 'next/navigation'
import CharacterSheet, { defaultPerso } from '@/components/sheet/CharacterSheet'
import DiceRoller from '@/components/dice/DiceRoller'
import ChatBox from '@/components/chat/ChatBox'
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
import Dice3DOverlay, { useSendRollToOthers } from '@/components/dice/Dice3DOverlay'
import { useDiceQueue, RollRequest } from '@/components/dice/useDiceQueue'

export default function HomePageInner() {
  const router = useRouter()
  const [user, setUser] = useState<string | null>(null)
  const profile = useProfile()
  const [perso, setPerso] = useState(defaultPerso)
  const [characters, setCharacters] = useState<any[]>([])

  const [showPopup, setShowPopup] = useState(false)
  const [diceType, setDiceType] = useState(6)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [diceDisabled, setDiceDisabled] = useState(false)
  const { id: roomId } = useParams<{ id: string }>()
  const [history, setHistory] = useDiceHistory(roomId)
  const { addEvent } = useEventLog(roomId)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const { enqueue } = useDiceQueue()

  const broadcast = useBroadcastEvent()
  const sendRollToOthers = useSendRollToOthers()
  const [, updateMyPresence] = useMyPresence()

  // listen for remote dice rolls
  useEventListener((payload: any) => {
    const { event } = payload
    if (event.type === 'dice-roll') {
      setHistory((h) => [...h, { player: event.player, dice: event.dice, result: event.result, ts: Date.now() }])
    } else if (event.type === 'dice-3d-roll') {
      const { id, type, seed, playerName } = event
      enqueue({ id, type, seed, playerName, isLocal: false })
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
    const roll: RollRequest = {
      id: crypto.randomUUID(),
      type: `1d${diceType}`,
      seed: Math.floor(Math.random() * 1_000_000),
      playerName: perso.nom || '?',
      isLocal: true
    }
    enqueue(roll)
    sendRollToOthers(roll)
  }

  const handleRollComplete = (values: number[], roll: RollRequest) => {
    const total = values.reduce((a, b) => a + b, 0)
    setHistory(h => [...h, { player: roll.playerName, dice: parseInt(roll.type.replace(/^[^d]*d/, '')), result: total, ts: Date.now() }])
    broadcast({ type: 'dice-roll', player: roll.playerName, dice: parseInt(roll.type.replace(/^[^d]*d/, '')), result: total } as Liveblocks['RoomEvent'])
    addEvent({ id: crypto.randomUUID(), kind: 'dice', player: roll.playerName, dice: parseInt(roll.type.replace(/^[^d]*d/, '')), result: total, ts: Date.now() })
    if (roll.isLocal) {
      setDiceResult(total)
      setShowPopup(true)
      setDiceDisabled(false)
    }
  }

  return (
    <div className="relative w-screen h-screen font-sans overflow-hidden bg-transparent">
      <div className="relative z-10 flex flex-col lg:flex-row w-full h-full">
        <CharacterSheet perso={perso} onUpdate={handleUpdatePerso} chatBoxRef={chatBoxRef} allCharacters={characters} logoOnly>
          {profile?.isMJ && (
            <span className="ml-2">
              <GMCharacterSelector onSelect={handleUpdatePerso} className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded shadow" />
            </span>
          )}
        </CharacterSheet>

        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 m-4 flex flex-col justify-center items-center relative min-h-0">
            <InteractiveCanvas />
            <Dice3DOverlay onComplete={handleRollComplete} />
            <PopupResult show={showPopup} result={diceResult} diceType={diceType} onFinish={() => setShowPopup(false)} />
          </div>
          <DiceRoller diceType={diceType} onChange={setDiceType} onRoll={rollDice} disabled={diceDisabled}>
            <LiveAvatarStack />
          </DiceRoller>
        </main>

        <ChatBox
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

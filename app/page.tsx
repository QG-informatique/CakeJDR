'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import CharacterSheet, { defaultPerso } from '@/components/sheet/CharacterSheet'
import DiceRoller from '@/components/dice/DiceRoller'
import ChatBox from '@/components/chat/ChatBox'
import PopupResult from '@/components/dice/PopupResult'
import Head from 'next/head'
import InteractiveCanvas from '@/components/canvas/InteractiveCanvas'
import OnlineProfiles from '@/components/chat/OnlineProfiles'
import SideNotes from '@/components/misc/SideNotes'
import Login from '@/components/login/Login'
import GMCharacterSelector from '@/components/misc/GMCharacterSelector'
import ImportExportMenu from '@/components/character/ImportExportMenu'
import Link from 'next/link'
import RpgBackground from '@/components/ui/RpgBackground'
import CakeLogo from '@/components/ui/CakeLogo'

export default function HomePage() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ pseudo: string, color: string, isMJ: boolean }>({ pseudo: '', color: '#ffffff', isMJ: false })
  const [perso, setPerso] = useState(defaultPerso)
  const [characters, setCharacters] = useState<any[]>([])

  const [showPopup, setShowPopup] = useState(false)
  const [diceType, setDiceType] = useState(6)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [diceDisabled, setDiceDisabled] = useState(false)
  const [pendingRoll, setPendingRoll] = useState<{ result: number, dice: number, nom: string } | null>(null)
  const [history, setHistory] = useState<{ player: string, dice: number, result: number }[]>([])
  const chatBoxRef = useRef<HTMLDivElement>(null)

  // --------- PERSISTANCE DE L'HISTORIQUE DE DÉS ---------
  const HISTORY_KEY = 'jdr_dice_history'
  const lastLength = useRef(0)

  const restoreHistory = () => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) {
        const arr = JSON.parse(saved)
        if (!Array.isArray(arr)) return
        if (arr.length !== lastLength.current) {
          setHistory(arr)
          lastLength.current = arr.length
        }
      }
    } catch {}
  }

  useEffect(() => {
    restoreHistory()
  }, [pathname])

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
    lastLength.current = history.length
  }, [history])
  // ------------------------------------------------------

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!sessionStorage.getItem('visitedMenu')) {
      sessionStorage.setItem('visitedMenu', 'true')
      router.push('/menu')
    }
  }, [])

  useEffect(() => {
    if (!user) return
    const id = localStorage.getItem('jdr_profile_id') || crypto.randomUUID()
    localStorage.setItem('jdr_profile_id', id)
    const updateOnline = () => {
      try {
        const list = JSON.parse(localStorage.getItem('jdr_online') || '{}')
        list[id] = { pseudo: user, color: profile.color }
        localStorage.setItem('jdr_online', JSON.stringify(list))
        window.dispatchEvent(new Event('jdr_online_change'))
      } catch {}
    }
    updateOnline()
    const handleUnload = () => {
      try {
        const list = JSON.parse(localStorage.getItem('jdr_online') || '{}')
        delete list[id]
        localStorage.setItem('jdr_online', JSON.stringify(list))
        window.dispatchEvent(new Event('jdr_online_change'))
      } catch {}
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      handleUnload()
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [user, profile.color])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('jdr_profile')
      if (saved) {
        const p = JSON.parse(saved)
        if (p.pseudo && p.loggedIn) {
          setUser(p.pseudo)
          setProfile({ pseudo: p.pseudo, color: p.color || '#ffffff', isMJ: !!p.isMJ })
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    const update = () => {
      try {
        const saved = localStorage.getItem('jdr_profile')
        if (saved) {
          const p = JSON.parse(saved)
          if (p.loggedIn) {
            setProfile({ pseudo: p.pseudo || '', color: p.color || '#ffffff', isMJ: !!p.isMJ })
          }
        }
      } catch {}
    }
    window.addEventListener('storage', update)
    window.addEventListener('jdr_profile_change', update as EventListener)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('jdr_profile_change', update as EventListener)
    }
  }, [])

  // ----------- Synchronisation des personnages --------------
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
      } else {
        setPerso(defaultPerso)
      }
    } else {
      setPerso(defaultPerso)
    }
  }, [])

  // ----------- Handler MAJ fiche perso + stockage -----------
  const handleUpdatePerso = (newPerso: any) => {
    // Assigner un id si besoin
    let id = newPerso.id
    if (!id) {
      id = crypto.randomUUID()
      newPerso = { ...newPerso, id }
    }
    setPerso(newPerso)
    setCharacters(prevChars => {
      let found = false
      const next = prevChars.map(c => {
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
  // ----------------------------------------------------------

  if (!user) {
    return <Login onLogin={setUser} />
  }

  const rollDice = () => {
    setDiceDisabled(true)
    const result = Math.floor(Math.random() * diceType) + 1
    setDiceResult(result)
    setShowPopup(true)
    setPendingRoll({ result, dice: diceType, nom: perso.nom || "?" })
  }

  const handlePopupFinish = () => {
    setShowPopup(false)
    setDiceDisabled(false)
    if (!pendingRoll) return

    setHistory(h => [...h, { player: pendingRoll.nom, dice: pendingRoll.dice, result: pendingRoll.result }])
    setPendingRoll(null)
  }

  // --- STRUCTURE MODIFIÉE POUR UN VRAI FOND RPG + panels en overlay ---
  return (
    <div className="relative w-screen h-screen font-sans overflow-hidden bg-transparent">
      {/* RPG BACKGROUND animé EN FOND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <RpgBackground />
      </div>
      {/* Contenu principal en overlay */}
      <div className="relative z-10 flex w-full h-full">
        {/* Barre latérale personnage (gauche) */}
        <CharacterSheet
          perso={perso}
          onUpdate={handleUpdatePerso}
          chatBoxRef={chatBoxRef}
          allCharacters={characters}
          logoOnly
        >
          <Link
            href="/menu-accueil"
            className="bg-gray-800 hover:bg-gray-900 text-white px-2 py-1 rounded text-xs"
            style={{ minWidth: 70 }}
          >
            Menu
          </Link>
          <ImportExportMenu perso={perso} onUpdate={handleUpdatePerso} />
          {profile.isMJ && (
            <span className="ml-2">
              <GMCharacterSelector
                onSelect={handleUpdatePerso}
                buttonLabel="Personnage"
                className="bg-purple-700 hover:bg-purple-800 text-white px-2 py-1 rounded text-xs border border-purple-500"
              />
            </span>
          )}
        </CharacterSheet>

        {/* Zone de jeu centrale */}
        <main className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 m-4 flex flex-col justify-center items-center relative min-h-0">
            <InteractiveCanvas />
            <PopupResult
              show={showPopup}
              result={diceResult}
              diceType={diceType}
              onFinish={handlePopupFinish}
            />
          </div>
          <DiceRoller
            diceType={diceType}
            onChange={setDiceType}
            onRoll={rollDice}
            disabled={diceDisabled}
          >
            <OnlineProfiles />
          </DiceRoller>
        </main>

        {/* Chat à droite */}
        <ChatBox chatBoxRef={chatBoxRef} history={history} />
        <SideNotes />
      </div>
      <Head>
        <title>CakeJDR</title>
      </Head>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
// Déplacement fichier pour organisation
import CharacterSheet, { defaultPerso } from '@/components/character/CharacterSheet'
// Déplacement fichier pour organisation
import DiceRoller from '@/components/dice/DiceRoller'
// Déplacement fichier pour organisation
import ChatBox from '@/components/chat/ChatBox'
// Déplacement fichier pour organisation
import PopupResult from '@/components/dice/PopupResult'
import Head from 'next/head'
// Déplacement fichier pour organisation
import InteractiveCanvas from '@/components/canvas/InteractiveCanvas'
// Déplacement fichier pour organisation
import OnlineProfiles from '@/components/chat/OnlineProfiles'
// Déplacement fichier pour organisation
import SideNotes from '@/components/misc/SideNotes'

// Déplacement fichier pour organisation
import Login from '@/components/login/Login'
// Déplacement fichier pour organisation
import GMCharacterSelector from '@/components/misc/GMCharacterSelector'
// Déplacement fichier pour organisation
import ImportExportMenu from '@/components/character/ImportExportMenu'
import Link from 'next/link'

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

  // Redirection menu au premier chargement
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!sessionStorage.getItem('visitedMenu')) {
      sessionStorage.setItem('visitedMenu', 'true')
      router.push('/menu')
    }
  }, [])

  // Présence en ligne
  useEffect(() => {
    if (!user) return
    const id = localStorage.getItem('jdr_profile_id') || String(Date.now())
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

  // Chargement profil depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('jdr_profile')
      if (saved) {
        const p = JSON.parse(saved)
        if (p.pseudo) {
          setUser(p.pseudo)
          setProfile({ pseudo: p.pseudo, color: p.color || '#ffffff', isMJ: !!p.isMJ })
        }
      }
    } catch {}
  }, [])

  // Synchronisation profil MJ si changement ailleurs
  useEffect(() => {
    const update = () => {
      try {
        const saved = localStorage.getItem('jdr_profile')
        if (saved) {
          const p = JSON.parse(saved)
          setProfile({ pseudo: p.pseudo || '', color: p.color || '#ffffff', isMJ: !!p.isMJ })
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

  // --- NOUVEAU : Charger les persos + selectionné ---
  useEffect(() => {
    // Charger tous les persos depuis localStorage
    const savedChars = localStorage.getItem('jdr_characters')
    let chars = []
    if (savedChars) {
      try {
        chars = JSON.parse(savedChars)
        setCharacters(chars)
      } catch {}
    }
    // Charger le perso sélectionné
    const selectedId = localStorage.getItem('selectedCharacterId')
    if (selectedId && chars.length) {
      const found = chars.find(c => c.id?.toString() === selectedId)
      if (found) {
        setPerso(found)
      } else {
        setPerso(defaultPerso)
      }
    } else {
      setPerso(defaultPerso)
    }
  }, [])

  if (!user) {
    return <Login onLogin={setUser} />
  }

  // Lancer de dé
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

  return (
    <div className="flex h-[calc(100vh-10px)] m-[5px] font-sans overflow-hidden bg-white text-black dark:bg-gray-900 dark:text-white">
      <Head>
        <title>CakeJDR</title>
      </Head>
      <CharacterSheet
        perso={perso}
        onUpdate={setPerso}
        chatBoxRef={chatBoxRef}
      >
        <Link
          href="/menu"
          className="bg-gray-800 hover:bg-gray-900 text-white px-2 py-1 rounded text-xs"
          style={{ minWidth: 70 }}
        >
          Menu
        </Link>
        <ImportExportMenu perso={perso} onUpdate={setPerso} />
        {profile.isMJ && (
          <span className="ml-2">
            <GMCharacterSelector
              onSelect={setPerso}
              buttonLabel="Personnage"
              className="bg-purple-700 hover:bg-purple-800 text-white px-2 py-1 rounded text-xs border border-purple-500"
            />
          </span>
        )}
      </CharacterSheet>

      <main className="flex-1 bg-white dark:bg-gray-950 flex flex-col">
        <div className="flex-1 border m-4 bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center relative">
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

      <ChatBox chatBoxRef={chatBoxRef} history={history} />
      <SideNotes />
    </div>
  )
}

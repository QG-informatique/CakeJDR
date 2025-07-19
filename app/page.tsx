'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import CharacterSheet from '@/components/CharacterSheet'
import DiceRoller from '@/components/DiceRoller'
import ChatBox from '@/components/ChatBox'
import PopupResult from '@/components/PopupResult'
import Head from 'next/head'
import InteractiveCanvas from '@/components/InteractiveCanvas'
import OnlineProfiles from '@/components/OnlineProfiles'
import SideNotes from '@/components/SideNotes'

import Login from '@/components/Login'
import GMCharacterSelector from '@/components/GMCharacterSelector'
import Link from 'next/link'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ pseudo: string, color: string, isMJ: boolean }>({ pseudo: '', color: '#ffffff', isMJ: false })
  const [perso, setPerso] = useState({
    nom: 'Gustave',
    race: 'Cake',
    classe: 'Barbare',
    niveau: 2,
    pv: 13,
    force: 13,
    dexterite: 4,
    constitution: 4,
    intelligence: 2,
    sagesse: 2,
    charisme: 4,
    arme: 'Épée rouillée',
    armure: 'Armure en miettes',
    competence: ['Cri sauvage', 'Coup puissant']
  })

  const [showPopup, setShowPopup] = useState(false)
  const [diceType, setDiceType] = useState(6)
  const [diceResult, setDiceResult] = useState<number | null>(null)
  const [diceDisabled, setDiceDisabled] = useState(false)
  const [pendingRoll, setPendingRoll] = useState<{ result: number, dice: number, nom: string } | null>(null)
  const [history, setHistory] = useState<{ player: string, dice: number, result: number }[]>([])
  const chatBoxRef = useRef<HTMLDivElement>(null)

  // Au premier chargement, on redirige vers le menu pour forcer le passage
  // par l'écran d'accueil. Un indicateur en session permet d'éviter une
  // boucle de redirection quand on revient au jeu.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!sessionStorage.getItem('visitedMenu')) {
      sessionStorage.setItem('visitedMenu', 'true')
      router.push('/menu')
    }
  }, [])

  // Gestion de la présence en ligne
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
      } catch {
        /* empty */
      }
    }
    updateOnline()
    const handleUnload = () => {
      try {
        const list = JSON.parse(localStorage.getItem('jdr_online') || '{}')
        delete list[id]
        localStorage.setItem('jdr_online', JSON.stringify(list))
        window.dispatchEvent(new Event('jdr_online_change'))
      } catch {
        /* empty */
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => {
      handleUnload()
      window.removeEventListener('beforeunload', handleUnload)
    }
  }, [user, profile.color])

  // Chargement du profil depuis localStorage
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
    } catch {
      /* empty */
    }
  }, [])

  // Mise à jour si profil changé ailleurs
  useEffect(() => {
    const update = () => {
      try {
        const saved = localStorage.getItem('jdr_profile')
        if (saved) {
          const p = JSON.parse(saved)
          setProfile({ pseudo: p.pseudo || '', color: p.color || '#ffffff', isMJ: !!p.isMJ })
        }
      } catch {
        /* empty */
      }
    }
    window.addEventListener('storage', update)
    window.addEventListener('jdr_profile_change', update as EventListener)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('jdr_profile_change', update as EventListener)
    }
  }, [])

  if (!user) {
    return <Login onLogin={(name) => { setUser(name); }} />
  }

  // ⚡ Quand on lance le dé, on ne met PAS le résultat tout de suite dans le chat
  const rollDice = () => {
    setDiceDisabled(true)
    const result = Math.floor(Math.random() * diceType) + 1
    setDiceResult(result)
    setShowPopup(true)
    setPendingRoll({ result, dice: diceType, nom: perso.nom || "?" })
    // Pas d'ajout dans le chat ici !
  }

  // ➡️ Quand l'animation est finie (appelé par PopupResult)
  const handlePopupFinish = () => {
    setShowPopup(false)
    setDiceDisabled(false)
    if (!pendingRoll) return

    // Mise à jour de l'historique pour DiceStats (toujours, même si le chat n'est pas visible)
    setHistory(h => [...h, { player: user || pendingRoll.nom, dice: pendingRoll.dice, result: pendingRoll.result }])

    // Affichage direct dans le chat si la zone est montée
    if (chatBoxRef.current) {
      const message = document.createElement('p')
      message.innerHTML = `<strong>🎲 ${pendingRoll.nom} :</strong> D${pendingRoll.dice} → <strong>${pendingRoll.result}</strong>`
      chatBoxRef.current.appendChild(message)
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }

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
        headerExtras={(
          <>
            <Link href="/menu" className="bg-gray-800 text-white px-2 py-1 rounded text-xs">Menu</Link>
            {profile.isMJ && <GMCharacterSelector onSelect={setPerso} />}
          </>
        )}
      />

      <main className="flex-1 bg-white dark:bg-gray-950 flex flex-col">
        <div className="flex-1 border m-4 bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center relative">
          <InteractiveCanvas />
          <PopupResult
            show={showPopup}
            result={diceResult}
            diceType={diceType}
            onFinish={handlePopupFinish} // 👈 Animation terminée = affiche dans le chat
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

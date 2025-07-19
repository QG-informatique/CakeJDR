'use client'

import { useRef, useState } from 'react'
import CharacterSheet from '@/components/CharacterSheet'
import DiceRoller from '@/components/DiceRoller'
import ChatBox from '@/components/ChatBox'
import PopupResult from '@/components/PopupResult'
import Head from 'next/head'
import InteractiveCanvas from '@/components/InteractiveCanvas'
import Login from '@/components/Login'
import GMCharacterSelector from '@/components/GMCharacterSelector'
import DiceStats from '@/components/DiceStats'

export default function HomePage() {
  const [user, setUser] = useState<string | null>(null)
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

  if (!user) {
    return <Login onLogin={setUser} />
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
    if (pendingRoll && chatBoxRef.current) {
      const message = document.createElement("p")
      message.innerHTML = `<strong>🎲 ${pendingRoll.nom} :</strong> D${pendingRoll.dice} → <strong>${pendingRoll.result}</strong>`
      chatBoxRef.current.appendChild(message)
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
      setHistory(h => [...h, { player: user || pendingRoll.nom, dice: pendingRoll.dice, result: pendingRoll.result }])
      setPendingRoll(null)
    }
  }

  return (
    <div className="flex h-[calc(100vh-10px)] m-[5px] font-sans overflow-hidden bg-white text-black dark:bg-gray-900 dark:text-white">
      <Head>
        <title>CakeJDR</title>
      </Head>
      <div className="absolute top-2 left-2 z-50">
        <GMCharacterSelector onSelect={setPerso} />
      </div>

      <CharacterSheet perso={perso} onUpdate={setPerso} chatBoxRef={chatBoxRef} />

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
        />
      </main>

      <ChatBox chatBoxRef={chatBoxRef} />
      <aside className="w-1/5 bg-gray-100 dark:bg-gray-800 overflow-y-auto">
        <DiceStats history={history} />
      </aside>
    </div>
  )
}

'use client'

import { useRef, useState } from 'react'
import CharacterSheet from '@/components/CharacterSheet'
import DiceRoller from '@/components/DiceRoller'
import ChatBox from '@/components/ChatBox'
import PopupResult from '@/components/PopupResult'
import Head from 'next/head'



export default function HomePage() {
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

  const chatBoxRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>

  const levelUp = () => {
    setPerso((prev) => ({
      ...prev,
      niveau: prev.niveau + 1,
      pv: prev.pv + 10,
      force: prev.force + 1,
      dexterite: prev.dexterite + 1,
      constitution: prev.constitution + 1,
      intelligence: prev.intelligence + 1,
      sagesse: prev.sagesse + 1,
      charisme: prev.charisme + 1,
    }))
  }

  const rollDice = () => {
    setDiceDisabled(true)
    const result = Math.floor(Math.random() * diceType) + 1
    setDiceResult(result)
    setShowPopup(true)

    setTimeout(() => {
      setShowPopup(false)
      setDiceDisabled(false)
    }, 3000)

    if (chatBoxRef.current) {
      const message = document.createElement("p")
      message.innerHTML = `<strong>🎲 Jet :</strong> D${diceType} → <strong>${result}</strong>`
      chatBoxRef.current.appendChild(message)
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }

  return (
    <div className="flex h-[calc(100vh-10px)] m-[5px] font-sans overflow-hidden bg-white text-black dark:bg-gray-900 dark:text-white">
      <Head>
        <title>CakeJDR</title>
      </Head>
      <CharacterSheet perso={perso} onLevelUp={levelUp} />

      <main className="flex-1 bg-white dark:bg-gray-950 flex flex-col">
        <div className="flex-1 border m-4 bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center relative">
          <p className="mb-4">Zone carte interactive / dessin / musique</p>
          <PopupResult show={showPopup} result={diceResult} diceType={diceType} />
        </div>

        <DiceRoller
          diceType={diceType}
          onChange={setDiceType}
          onRoll={rollDice}
          disabled={diceDisabled}
        />
      </main>

      <ChatBox chatBoxRef={chatBoxRef} />
    </div>
  )
}

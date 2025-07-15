'use client'

import { FC, useState, useEffect } from 'react'

const STATS = ['force', 'dexterite', 'constitution', 'intelligence', 'sagesse', 'charisme']

const rollDice = (dice: string): number => {
  const match = dice.match(/d(\d+)/i)
  if (!match) return 0
  const sides = parseInt(match[1])
  return Math.floor(Math.random() * sides) + 1
}

type Props = {
  perso: any
  onUpdate: (newPerso: any) => void
}

const CharacterSheet: FC<Props> = ({ perso, onUpdate }) => {
  const [dice, setDice] = useState('d6')
  const [processing, setProcessing] = useState(false)

  const handleLevelUp = async () => {
    if (processing) return
    setProcessing(true)

    let updatedPerso = { ...perso, niveau: perso.niveau + 1 }

    for (const stat of STATS) {
      const gain = rollDice(dice)

      const event = new CustomEvent('dice-roll', {
        detail: {
          diceType: dice,
          result: gain,
          label: `Level up - ${stat.charAt(0).toUpperCase() + stat.slice(1)}`
        }
      })
      window.dispatchEvent(event)

      // Ajouter au chat
      const chatBox = document.getElementById('chat-box')
      if (chatBox) {
        const message = document.createElement('p')
        message.innerHTML = `<strong>🎲 ${stat} :</strong> ${gain}`
        chatBox.appendChild(message)
        chatBox.scrollTop = chatBox.scrollHeight
      }

      updatedPerso = { ...updatedPerso, [stat]: updatedPerso[stat] + gain }
      onUpdate(updatedPerso)

      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    setProcessing(false)
  }

  useEffect(() => {
    const handleDiceEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail
      const popup = document.getElementById('popup-dice')
      if (popup) {
        popup.innerText = `${detail.label} : ${detail.result}`
        popup.classList.remove('hidden')
        setTimeout(() => popup.classList.add('hidden'), 2000)
      }
    }

    window.addEventListener('dice-roll', handleDiceEvent)
    return () => window.removeEventListener('dice-roll', handleDiceEvent)
  }, [])

  return (
    <aside className="w-1/5 bg-gray-100 dark:bg-gray-800 p-4 overflow-y-auto text-sm">
      <h2 className="text-xl font-bold mb-4">Personnage</h2>
      <p><strong>Nom :</strong> {perso.nom}</p>
      <p><strong>Race :</strong> {perso.race}</p>
      <p><strong>Classe :</strong> {perso.classe}</p>
      <p><strong>Niveau :</strong> {perso.niveau}</p>
      <p><strong>PV :</strong> {perso.pv}</p>

      <h3 className="mt-4 font-semibold">Statistiques</h3>
      <ul className="ml-4 space-y-1">
        {STATS.map((stat) => (
          <li key={stat}>
            <strong>{stat.charAt(0).toUpperCase() + stat.slice(1)} :</strong>
            <input
              type="number"
              value={perso[stat]}
              readOnly
              className="ml-2 w-16 px-1 py-0.5 border rounded bg-gray-200 cursor-not-allowed"
            />
          </li>
        ))}
      </ul>

      <h3 className="mt-4 font-semibold">Équipement</h3>
      <p><strong>Arme :</strong> {perso.arme}</p>
      <p><strong>Armure :</strong> {perso.armure}</p>

      <h3 className="mt-4 font-semibold">Compétences</h3>
      <ul className="list-disc ml-5">
        {perso.competence.map((c: string, i: number) => <li key={i}>{c}</li>)}
      </ul>

      <div className="mt-6">
        <label className="block mb-1">Type de dé (ex: d6, d20) :</label>
        <input
          type="text"
          value={dice}
          onChange={(e) => setDice(e.target.value)}
          className="w-full mb-2 p-1 border rounded"
        />

        <button
          onClick={handleLevelUp}
          disabled={processing}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Lancer Level Up
        </button>
      </div>
    </aside>
  )
}

export default CharacterSheet

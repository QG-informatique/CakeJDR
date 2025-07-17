import { FC } from 'react'

type Props = {
  dice: string
  setDice: (dice: string) => void
  onLevelUp: () => void
  processing?: boolean
}

const DICE_OPTIONS = [
  { value: 'd4', label: 'D4' },
  { value: 'd6', label: 'D6' },
  { value: 'd20', label: 'D20' }
]

const LevelUpPanel: FC<Props> = ({ dice, setDice, onLevelUp, processing }) => {
  return (
    <div className="mt-5">
      <label className="block mb-1">Type de dé :</label>
      <select
        value={dice}
        onChange={e => setDice(e.target.value)}
        className="w-full mb-2 p-1 border rounded bg-white text-black dark:bg-gray-700 dark:text-white"
        disabled={processing}
      >
        {DICE_OPTIONS.map(d => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
      </select>
      <button
        onClick={onLevelUp}
        disabled={processing}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {processing ? "Lancement..." : "Lancer Level Up"}
      </button>
    </div>
  )
}

export default LevelUpPanel

'use client'
import { FC } from 'react'

type Props = {
  diceType: number
  onChange: (value: number) => void
  onRoll: () => void
  disabled: boolean
  children?: React.ReactNode
}

const DiceRoller: FC<Props> = ({ diceType, onChange, onRoll, disabled, children }) => (
  <div className="p-4 bg-gray-200 dark:bg-gray-800 flex items-center gap-2">
    <label htmlFor="diceType" className="mr-2 font-semibold">Type de dé :</label>
    <select
      id="diceType"
      className="border p-1 rounded text-white bg-gray-700 dark:bg-gray-600"
      value={diceType}
      onChange={(e) => onChange(Number(e.target.value))}
      disabled={disabled}
    >
      {[4, 6, 8, 10, 12, 20, 100].map(val => (
        <option key={val} value={val}>D{val}</option>
      ))}
    </select>
    <button
      onClick={onRoll}
      className={`ml-4 bg-green-500 hover:bg-green-600 text-white px-4 py-1 rounded ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      Lancer
    </button>
    {children && <div className="ml-4 flex gap-1">{children}</div>}
  </div>
)

export default DiceRoller

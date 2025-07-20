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
  <div
    className="
      p-4
      flex items-center gap-2 justify-between
      rounded-xl
      border border-white/10
      bg-black/15
      backdrop-blur-[2px]
      shadow-lg shadow-black/10
      transition
    "
    style={{
      boxShadow: '0 4px 18px -8px rgba(0,0,0,0.24), 0 0 0 1px rgba(255,255,255,0.05)'
    }}
  >
    <label htmlFor="diceType" className="mr-2 font-semibold text-white/85">Type de dé :</label>
    <select
      id="diceType"
      className="border p-1 rounded text-white bg-gray-800/70"
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
      className={`ml-4 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1 rounded shadow ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
    >
      Lancer
    </button>
    {children && <div className="ml-auto flex gap-1">{children}</div>}
  </div>
)

export default DiceRoller

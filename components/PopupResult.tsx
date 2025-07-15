'use client'
import { FC } from 'react'

type Props = {
  show: boolean
  result: number | null
  diceType: number
}

const PopupResult: FC<Props> = ({ show, result, diceType }) => {
  if (!show || result === null) return null
  const bg =
    result === 1
      ? 'bg-red-600'
      : result === diceType
      ? 'bg-yellow-500'
      : 'bg-blue-600'

  return (
    <div
      className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
      px-8 py-6 rounded-lg shadow-xl text-4xl font-bold text-white ${bg}`}
      style={{ zIndex: 50 }}
    >
      🎲 {result}
      {result === 1 && <span> — Échec critique !</span>}
      {result === diceType && <span> — Réussite critique !</span>}
    </div>
  )
}

export default PopupResult

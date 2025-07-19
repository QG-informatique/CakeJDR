'use client'
import { useEffect, useState } from 'react'

type Roll = { player: string, dice: number, result: number }

type Props = { history: Roll[] }

function computeStats(history: Roll[]) {
  const stats: Record<string, { rolls: number, crit: number, fail: number, dist: Record<number, number> }> = {}
  for (const h of history) {
    if (!stats[h.player]) stats[h.player] = { rolls: 0, crit: 0, fail: 0, dist: {} }
    const s = stats[h.player]
    s.rolls++
    if (h.result === 1) s.fail++
    if (h.result === h.dice) s.crit++
    s.dist[h.dice] = (s.dist[h.dice] || 0) + 1
  }
  return stats
}

export default function DiceStats({ history }: Props) {
  const [selected, setSelected] = useState<string>('all')
  const [stats, setStats] = useState(() => computeStats(history))
  useEffect(() => {
    setStats(computeStats(history))
  }, [history])
  const players = Object.keys(stats)

  const renderRow = (player: string) => {
    const s = stats[player]
    return (
      <tr key={player} className="border-b border-gray-700">
        <td className="px-2 py-1 font-semibold">{player}</td>
        <td className="px-2 py-1 text-center">{s.rolls}</td>
        <td className="px-2 py-1 text-center">{s.crit}</td>
        <td className="px-2 py-1 text-center">{s.fail}</td>
        <td className="px-2 py-1 text-sm">{Object.entries(s.dist).map(([d,c]) => `D${d}:${c}`).join(' ')}</td>
      </tr>
    )
  }

  if (players.length === 0) return <div className="p-2 text-sm">Aucun jet enregistré.</div>

  return (
    <div className="p-2">
      <div className="mb-2">
        <label className="mr-2">Voir stats :</label>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="bg-gray-800 text-white rounded px-2 py-1 text-sm"
        >
          <option value="all">Tous les joueurs</option>
          {players.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <table className="text-sm w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="px-2 py-1">Joueur</th>
            <th className="px-2 py-1">Jets</th>
            <th className="px-2 py-1">Critiques</th>
            <th className="px-2 py-1">Echecs</th>
            <th className="px-2 py-1">Par dé</th>
          </tr>
        </thead>
        <tbody>
          {selected === 'all' ? players.map(renderRow) : renderRow(selected)}
        </tbody>
      </table>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useStorage } from '@liveblocks/react'

export default function MJPanel() {
  const map = useStorage(root => root.characters)
  const [active, setActive] = useState<string>('')
  if (!map) return null
  const entries = Array.from(map.entries())
  const current = active ? map.get(active) : null
  return (
    <div className="absolute left-4 top-4 z-50 bg-black/60 text-white rounded-xl p-3 max-w-sm overflow-auto max-h-[90vh]">
      <label className="block mb-2 text-sm font-semibold">Select character</label>
      <select
        value={active}
        onChange={e => setActive(e.target.value)}
        className="w-full mb-3 px-2 py-1 rounded bg-gray-800 text-white"
      >
        <option value="">---</option>
        {entries.map(([id, ch]) => (
          <option key={id} value={id}>{ch.nom || ch.name || id}</option>
        ))}
      </select>
      {current && (
        <pre className="text-xs whitespace-pre-wrap max-h-[70vh] overflow-y-auto">{JSON.stringify(current, null, 2)}</pre>
      )}
    </div>
  )
}

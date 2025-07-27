'use client'
import { useOthers } from '@liveblocks/react'
import Cursor from './Cursor'

export default function LiveCursors() {
  const others = useOthers()
  return (
    <>
      {others.map(({ connectionId, presence }) => {
        const cur = presence?.cursor
        if (!cur) return null
        return (
          <Cursor
            key={connectionId}
            x={cur.x}
            y={cur.y}
            color={presence.color || '#f97316'}
            name={presence.name}
          />
        )
      })}
    </>
  )
}

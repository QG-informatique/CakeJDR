'use client'
import { useOthers } from '@liveblocks/react'
import Cursor from './Cursor'

export default function LiveCursors({ canvasSize }: { canvasSize: { width: number; height: number } }) {
  const others = useOthers()
  return (
    <>
      {others.map(({ connectionId, presence }) => {
        const cur = presence?.cursor
        if (!cur) return null
        const isWorld = cur.x >= 0 && cur.x <= 1 && cur.y >= 0 && cur.y <= 1
        const x = isWorld && canvasSize.width ? cur.x * canvasSize.width : cur.x
        const y = isWorld && canvasSize.height ? cur.y * canvasSize.height : cur.y
        return (
          <Cursor
            key={connectionId}
            x={x}
            y={y}
            color={presence.color || '#f97316'}
            name={presence.name}
          />
        )
      })}
    </>
  )
}

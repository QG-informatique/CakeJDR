'use client'
import { useOthers, useSelf } from '@liveblocks/react'

export default function LiveAvatars() {
  const others = useOthers()
  const me = useSelf()
  const users = me ? [me, ...others] : others
  return (
    <div className="flex items-center gap-2">
      {users.map(user => {
        const color = user.presence?.color || '#777'
        const id = String(user.id || user.connectionId)
        const initial = id.charAt(0).toUpperCase()
        return (
          <div
            key={id}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-white"
            style={{ backgroundColor: color }}
          >
            {initial}
          </div>
        )
      })}
    </div>
  )
}

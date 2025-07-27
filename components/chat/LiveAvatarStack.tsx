'use client'
import { useOthers, useSelf } from '@liveblocks/react'

export default function LiveAvatarStack() {
  const others = useOthers()
  const self = useSelf()
  const all = [
    ...(self ? [{ id: self.connectionId, name: self.presence?.name as string || 'You', color: self.presence?.color as string || '#888' }] : []),
    ...others.map(o => ({ id: o.connectionId, name: (o.presence?.name as string) || '?', color: (o.presence?.color as string) || '#888' }))
  ]

  if (all.length === 0) return null

  return (
    <div className="fixed bottom-3 right-3 z-20 flex flex-row-reverse gap-2">
      {all.map(u => (
        <div
          key={u.id}
          className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-[10px] font-bold"
          style={{ backgroundColor: u.color, color: '#000' }}
        >
          {u.name.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  )
}

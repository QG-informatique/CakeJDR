'use client'
import { useOthers } from '@liveblocks/react'

interface Props {
  className?: string
  size?: number
}

export default function LiveAvatarStack({ className = 'fixed bottom-4 right-4 z-40 flex flex-row-reverse gap-2 items-center', size = 24 }: Props) {
  const others = useOthers()
  if (others.length === 0) return null

  const gmView = others.find((o) => o.presence?.gmView)?.presence?.gmView as { name?: string } | undefined

  const getTextColor = (hex: string) => {
    const c = hex.replace('#', '')
    const r = parseInt(c.substring(0,2),16)
    const g = parseInt(c.substring(2,4),16)
    const b = parseInt(c.substring(4,6),16)
    const yiq = (r*299 + g*587 + b*114)/1000
    return yiq >= 128 ? '#000' : '#fff'
  }

  return (
    <div className={className}>
      {others.map(({ connectionId, presence }) => {
        const name = presence?.name as string | undefined
        const color = (presence?.color as string) || '#888'
        if (!name) return null
        const text = getTextColor(color)
        return (
          <div key={connectionId} className="relative group">
            <div
              className="rounded-full border border-white flex items-center justify-center font-bold select-none"
              style={{ backgroundColor: color, color: text, width: size, height: size, fontSize: size * 0.42 }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute bottom-full right-0 mb-1 px-2 py-1 rounded bg-black text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none">
              {name}
            </div>
          </div>
        )
      })}
      {gmView?.name && (
        <div className="px-2 py-1 rounded bg-black/70 text-white text-xs mr-2">
          MJ consulte {gmView.name}
        </div>
      )}
    </div>
  )
}

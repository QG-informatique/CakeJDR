'use client'
import { useEffect } from 'react'
import { useMyPresence, useOthers, useSelf } from '@liveblocks/react'
import useProfile from '@/components/app/hooks/useProfile'

export default function LiveAvatars() {
  const profile = useProfile()
  const self = useSelf()
  const others = useOthers()
  const [, updateMyPresence] = useMyPresence()

  useEffect(() => {
    if (profile) {
      updateMyPresence({
        pseudo: profile.pseudo,
        color: profile.color
      })
    }
  }, [profile, updateMyPresence])

  const avatars: Array<{ pseudo: string; color: string }> = []
  if (self?.presence?.pseudo) {
    avatars.push({
      pseudo: self.presence.pseudo as string,
      color: (self.presence.color as string) || '#ffffff'
    })
  }
  others.forEach(o => {
    const p = o.presence as { pseudo?: string; color?: string } | undefined
    if (p?.pseudo) avatars.push({ pseudo: p.pseudo, color: p.color as string || '#ffffff' })
  })

  const unique = Array.from(new Map(avatars.map(a => [a.pseudo, a])).values())
  if (unique.length === 0) return null

  const getTextColor = (hex: string) => {
    const c = hex.replace('#', '')
    const r = parseInt(c.substring(0, 2), 16)
    const g = parseInt(c.substring(2, 4), 16)
    const b = parseInt(c.substring(4, 6), 16)
    const yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 128 ? '#000' : '#fff'
  }

  return (
    <div className="flex flex-row-reverse gap-2">
      {unique.map(({ pseudo, color }) => (
        <div
          key={pseudo}
          className="w-6 h-6 rounded-full border border-white flex items-center justify-center text-[10px] font-bold select-none"
          style={{ backgroundColor: color, color: getTextColor(color) }}
        >
          {pseudo.charAt(0).toUpperCase()}
        </div>
      ))}
    </div>
  )
}

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
      const hash = Array.from(profile.pseudo).reduce(
        (acc, ch) => acc + ch.charCodeAt(0),
        0
      )
      const avatar = `https://liveblocks.io/avatars/avatar-${hash % 30}.png`
      updateMyPresence({
        pseudo: profile.pseudo,
        color: profile.color,
        avatar
      })
    }
  }, [profile, updateMyPresence])

  const avatars: Array<{ pseudo: string; color: string; avatar: string }> = []
  if (self?.presence?.pseudo) {
    avatars.push({
      pseudo: self.presence.pseudo as string,
      color: (self.presence.color as string) || '#ffffff',
      avatar: (self.presence.avatar as string) || ''
    })
  }
  others.forEach((o) => {
    const p = o.presence as {
      pseudo?: string
      color?: string
      avatar?: string
    }
    if (p?.pseudo) {
      avatars.push({
        pseudo: p.pseudo,
        color: p.color as string || '#ffffff',
        avatar: p.avatar as string || ''
      })
    }
  })

  const unique = Array.from(new Map(avatars.map((a) => [a.pseudo, a])).values())
  if (unique.length === 0) return null

  return (
    <div className="flex flex-row-reverse gap-2">
      {unique.map(({ pseudo, color, avatar }) => (
        <div
          key={pseudo}
          className="w-6 h-6 rounded-full border border-white overflow-hidden select-none"
          style={{ boxShadow: `0 0 0 2px ${color}` }}
        >
          <img src={avatar} alt={pseudo} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  )
}

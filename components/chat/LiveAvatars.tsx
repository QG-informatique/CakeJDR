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
      const id =
        Array.from(profile.pseudo).reduce((a, c) => a + c.charCodeAt(0), 0) % 30
      updateMyPresence({
        pseudo: profile.pseudo,
        color: profile.color,
        avatar: `https://liveblocks.io/avatars/avatar-${id}.png`
      })
    }
  }, [profile, updateMyPresence])

  const avatars: Array<{ pseudo: string; avatar: string }> = []
  if (self?.presence?.pseudo) {
    avatars.push({
      pseudo: self.presence.pseudo as string,
      avatar: (self.presence.avatar as string) || ''
    })
  }
  others.forEach(o => {
    const p = o.presence as { pseudo?: string; avatar?: string } | undefined
    if (p?.pseudo) avatars.push({ pseudo: p.pseudo, avatar: p.avatar as string || '' })
  })

  const unique = Array.from(new Map(avatars.map(a => [a.pseudo, a])).values())
  if (unique.length === 0) return null

  return (
    <div className="flex flex-row-reverse gap-2">
      {unique.map(({ pseudo, avatar }) => (
        <img
          key={pseudo}
          src={avatar}
          alt={pseudo}
          className="w-6 h-6 rounded-full border border-white"
        />
      ))}
    </div>
  )
}

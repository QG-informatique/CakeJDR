'use client'
import { useOthers, useSelf } from '@liveblocks/react'
import { Crown } from 'lucide-react'
import { useT } from '@/lib/useT'

/** Noir ou blanc, selon ce qui se lit le mieux sur la couleur du joueur. */
export const getTextColor = (hex: string) => {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000
  return yiq >= 128 ? '#000' : '#fff'
}

type Player = { key: number; name: string; color: string; gm: boolean; self: boolean }

/**
 * Joueurs en ligne, soi compris : un rond par joueur avec son initiale, le
 * nom au survol. Le MJ porte une couronne.
 */
export default function LiveAvatarStack({ size = 28 }: { size?: number }) {
  const t = useT()
  const others = useOthers()
  const self = useSelf()

  const players: Player[] = []
  if (self) {
    players.push({
      key: self.connectionId,
      name: self.presence?.name || self.info?.pseudo || '?',
      color: self.presence?.color || self.info?.color || '#888',
      gm: self.info?.role === 'gm',
      self: true,
    })
  }
  for (const o of others) {
    const name = o.presence?.name || o.info?.pseudo
    if (!name) continue
    players.push({
      key: o.connectionId,
      name,
      color: o.presence?.color || o.info?.color || '#888',
      gm: o.info?.role === 'gm',
      self: false,
    })
  }
  if (players.length === 0) return null

  const gmView = others.find((o) => o.presence?.gmView)?.presence?.gmView as { name?: string } | undefined

  return (
    <div className="flex items-center gap-2">
      {gmView?.name && (
        <div className="hidden rounded-md border border-gm/40 px-2 py-1 text-xs text-gm-soft sm:block">
          {t('gmViewing').replace('{n}', gmView.name)}
        </div>
      )}
      <ul className="flex items-center gap-1.5" aria-label={t('playersOnline')}>
        {players.map((p) => {
          const label = `${p.name}${p.self ? ` (${t('playerYou')})` : ''}${p.gm ? ` · ${t('gmLabel')}` : ''}`
          return (
            <li key={p.key} className="group relative" aria-label={label}>
              <div
                className={`flex select-none items-center justify-center rounded-full font-bold ring-2 ${p.gm ? 'ring-gm' : 'ring-[var(--c-panel)]'}`}
                style={{ backgroundColor: p.color, color: getTextColor(p.color), width: size, height: size, fontSize: size * 0.42 }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              {p.gm && (
                <Crown
                  size={12}
                  className="absolute -top-2 left-1/2 -translate-x-1/2 fill-current text-gm"
                  aria-hidden
                />
              )}
              <div className="ui-panel ui-pop pointer-events-none absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded-md px-2 py-1 text-xs opacity-0 transition group-hover:opacity-100">
                {label}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

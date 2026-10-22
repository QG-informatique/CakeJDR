'use client'

import { useEffect, useRef, useState } from 'react'
import YouTube from 'react-youtube'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import { Square, Volume2 } from 'lucide-react'
import { useT } from '@/lib/useT'
import { playUiSound, useSoundVolume } from '@/lib/sound'

/** Durée de l'essai : le temps de régler le curseur à l'oreille. */
const PREVIEW_MS = 20_000

/**
 * « Tester le son » : un petit carillon, puis quelques secondes de musique
 * jouées pour soi seul, au volume du curseur (qui suit en direct). La musique
 * de la table, elle, ne part qu'au début de l'aventure.
 */
export default function MusicPreview({ trackId }: { trackId: string }) {
  const t = useT()
  const [volume] = useSoundVolume('music')
  const [on, setOn] = useState(false)
  const playerRef = useRef<YouTubePlayer | null>(null)

  useEffect(() => {
    if (!on) {
      playerRef.current = null
      return
    }
    const timer = window.setTimeout(() => setOn(false), PREVIEW_MS)
    return () => window.clearTimeout(timer)
  }, [on])

  useEffect(() => {
    void Promise.resolve(playerRef.current?.setVolume(volume)).catch(() => {})
  }, [volume])

  return (
    <>
      <button
        type="button"
        data-no-ui-sound
        onClick={() => {
          playUiSound('test')
          setOn((v) => !v)
        }}
        aria-pressed={on}
        className={`ui-btn !min-h-9 self-start text-sm ${on ? 'ui-btn-primary' : ''}`}
      >
        {on ? <Square size={13} aria-hidden /> : <Volume2 size={14} aria-hidden />}
        {t(on ? 'lobbyTestStop' : 'lobbyTestSound')}
      </button>
      {on && (
        <YouTube
          videoId={trackId}
          className="hidden"
          opts={{ height: '0', width: '0', playerVars: { autoplay: 1, rel: 0, playsinline: 1 } }}
          onReady={(e) => {
            playerRef.current = e.target
            void Promise.resolve(e.target.setVolume(volume)).catch(() => {})
            void Promise.resolve(e.target.playVideo()).catch(() => {})
          }}
          onEnd={() => setOn(false)}
          onError={() => setOn(false)}
        />
      )}
    </>
  )
}

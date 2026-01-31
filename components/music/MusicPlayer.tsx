'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useStorage } from '@liveblocks/react'
import { LiveList, LiveObject } from '@liveblocks/client'
import YouTube from 'react-youtube'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import { Plus, Pause, Play, SkipForward, Music2 } from 'lucide-react'

type QueueItem = { id: string }
type PlayerVideoData = { title?: string }
type PlayerWithData = YouTubePlayer & {
  getVideoData?: () => PlayerVideoData | Promise<PlayerVideoData>
}

const VOLUME_STORAGE_KEY = 'jdr_music_volume'
const DEFAULT_VOLUME = 5

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const parseYouTubeId = (input: string) => {
  const trimmed = input.trim()
  if (!trimmed) return null
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([a-zA-Z0-9_-]{11})/,
  )
  if (match?.[1]) return match[1]
  const fallback = trimmed.match(/v=([^&\n?#]+)/)
  if (fallback?.[1]) return fallback[1]
  return null
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

export default function MusicPlayer() {
  const musicObj = useStorage((root) => root.music)
  const queueObj = useStorage((root) => root.musicQueue) as LiveList<QueueItem> | null

  const [input, setInput] = useState('')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const hasSyncedRef = useRef(false)

  const [volume, setVolume] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_VOLUME
    try {
      const raw = localStorage.getItem(VOLUME_STORAGE_KEY)
      const parsed = raw ? Number(raw) : Number.NaN
      if (!Number.isFinite(parsed)) return DEFAULT_VOLUME
      return clamp(parsed, 0, 100)
    } catch {
      return DEFAULT_VOLUME
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(volume))
    } catch {}
  }, [volume])

  const musicReady = !!musicObj
  const musicId =
    musicObj instanceof LiveObject
      ? ((musicObj.get('id') as string | undefined) ?? undefined)
      : (musicObj as { id?: string } | null)?.id
  const musicPlaying =
    musicObj instanceof LiveObject
      ? ((musicObj.get('playing') as boolean | undefined) ?? undefined)
      : (musicObj as { playing?: boolean } | null)?.playing

  const queueCount = (() => {
    if (queueObj instanceof LiveList) return queueObj.length
    return 0
  })()

  const updateMusic = useMutation(
    ({ storage }, patch: Partial<{ id: string; playing: boolean }>) => {
      let obj = storage.get('music')
      if (!(obj instanceof LiveObject)) {
        obj = new LiveObject({ id: '', playing: false })
        storage.set('music', obj)
      }
      Object.entries(patch).forEach(([key, value]) => {
        ;(obj as LiveObject<{ id: string; playing: boolean }>).set(
          key as 'id' | 'playing',
          value,
        )
      })
    },
    [],
  )

  const enqueueTrack = useMutation(({ storage }, id: string) => {
    let list = storage.get('musicQueue')
    if (!(list instanceof LiveList)) {
      list = new LiveList<QueueItem>([])
      storage.set('musicQueue', list)
    }
    ;(list as LiveList<QueueItem>).push({ id })
  }, [])

  const playNextFromQueue = useMutation(({ storage }) => {
    let list = storage.get('musicQueue')
    if (!(list instanceof LiveList)) {
      list = new LiveList<QueueItem>([])
      storage.set('musicQueue', list)
    }
    let next: QueueItem | null = null
    if (list instanceof LiveList && list.length > 0) {
      const item = list.get(0) as QueueItem | undefined
      if (item?.id) next = item
      list.delete(0)
    }
    let obj = storage.get('music')
    if (!(obj instanceof LiveObject)) {
      obj = new LiveObject({ id: '', playing: false })
      storage.set('music', obj)
    }
    if (next?.id) {
      ;(obj as LiveObject<{ id: string; playing: boolean }>).set('id', next.id)
      ;(obj as LiveObject<{ id: string; playing: boolean }>).set('playing', true)
    } else {
      ;(obj as LiveObject<{ id: string; playing: boolean }>).set('playing', false)
    }
    return next?.id ?? null
  }, [])

  useEffect(() => {
    if (!musicReady) return
    const nextId =
      typeof musicId === 'string' && musicId.length > 0 ? musicId : null
    setCurrentId(nextId)
    if (!hasSyncedRef.current) {
      hasSyncedRef.current = true
      setIsPlaying(false)
    } else {
      setIsPlaying(!!musicPlaying)
    }
  }, [musicReady, musicId, musicPlaying])

  useEffect(() => {
    setCurrentTitle('')
    setCurrentTime(0)
    setDuration(0)
  }, [currentId])

  useEffect(() => {
    playerRef.current?.setVolume(volume)
  }, [volume])

  useEffect(() => {
    const p = playerRef.current
    if (!p || !currentId) return
    if (isPlaying) p.playVideo()
    else p.pauseVideo()
  }, [isPlaying, currentId])

  useEffect(() => {
    if (!currentId) return
    let cancelled = false
    const tick = async () => {
      if (seeking) return
      const p = playerRef.current
      if (!p) return
      try {
        const [nextDuration, nextTime] = await Promise.all([
          p.getDuration(),
          p.getCurrentTime(),
        ])
        if (cancelled) return
        if (Number.isFinite(nextDuration) && nextDuration > 0) {
          setDuration(nextDuration)
        }
        if (Number.isFinite(nextTime)) {
          setCurrentTime(nextTime)
        }
      } catch {}
    }
    const id = window.setInterval(() => {
      void tick()
    }, 500)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [currentId, seeking])

  const syncTitleFromPlayer = () => {
    const player = playerRef.current as PlayerWithData | null
    const result = player?.getVideoData?.()
    if (!result) return
    void Promise.resolve(result)
      .then((data) => {
        if (data?.title) setCurrentTitle(data.title)
      })
      .catch(() => {})
  }

  const handlePlayNow = () => {
    const id = parseYouTubeId(input)
    if (!id) return
    hasSyncedRef.current = true
    setInput('')
    setIsPlaying(true)
    updateMusic({ id, playing: true })
  }

  const handleAddToQueue = () => {
    const id = parseYouTubeId(input)
    if (!id) return
    hasSyncedRef.current = true
    setInput('')
    if (!currentId) {
      setIsPlaying(true)
      updateMusic({ id, playing: true })
      return
    }
    enqueueTrack(id)
  }

  const handlePlayPause = () => {
    if (!currentId) {
      if (queueCount > 0) {
        hasSyncedRef.current = true
        setIsPlaying(true)
        playNextFromQueue()
      }
      return
    }
    hasSyncedRef.current = true
    const next = !isPlaying
    setIsPlaying(next)
    updateMusic({ playing: next })
  }

  const handleNext = () => {
    if (queueCount === 0) return
    hasSyncedRef.current = true
    setIsPlaying(true)
    playNextFromQueue()
  }

  const progress =
    duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0

  const handleSeek = (value: number) => {
    if (!duration || !playerRef.current) return
    const nextTime = clamp((value / 100) * duration, 0, duration)
    setCurrentTime(nextTime)
    playerRef.current.seekTo(nextTime, true)
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm px-3 py-2 shadow-md min-w-[240px] max-w-[640px] w-full sm:w-auto">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Music2 size={16} className="text-purple-300 shrink-0" />
          <input
            type="text"
            placeholder="Lien YouTube"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handlePlayNow()
            }}
            className="w-full px-3 py-2 rounded-lg bg-black/40 text-white border border-white/20 placeholder:text-white/40"
          />
        </div>
        <button
          onClick={handlePlayNow}
          className="rounded-xl px-3 py-2 text-xs font-semibold shadow border-none bg-blue-600 text-white hover:bg-blue-700"
        >
          Lire
        </button>
        <button
          onClick={handleAddToQueue}
          className="rounded-xl px-3 py-2 text-xs font-semibold shadow border border-white/10 bg-black/30 text-white/90 hover:bg-purple-600 hover:text-white inline-flex items-center gap-1"
        >
          <Plus size={14} />
          Ajouter a la suite
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handlePlayPause}
          className="rounded-xl px-3 py-2 text-xs font-semibold shadow border border-white/10 bg-black/30 text-white/90 hover:bg-purple-600 hover:text-white inline-flex items-center gap-1"
          disabled={!currentId && queueCount === 0}
        >
          {isPlaying ? (
            <>
              <Pause size={14} /> Pause
            </>
          ) : (
            <>
              <Play size={14} /> Lecture
            </>
          )}
        </button>
        <button
          onClick={handleNext}
          disabled={queueCount === 0}
          className={`rounded-xl px-3 py-2 text-xs font-semibold shadow border border-white/10 bg-black/30 text-white/90 hover:bg-emerald-600 hover:text-white inline-flex items-center gap-1 ${
            queueCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={queueCount > 0 ? `Prochaine piste (${queueCount})` : 'Queue vide'}
        >
          <SkipForward size={14} />
          Next
        </button>

        <div className="flex flex-col flex-1 min-w-[220px]">
          <div className="text-xs text-white/80 truncate">
            {currentTitle || 'Aucune musique'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/60 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => handleSeek(Number(e.target.value))}
              onMouseDown={() => setSeeking(true)}
              onMouseUp={() => setSeeking(false)}
              onMouseLeave={() => setSeeking(false)}
              onTouchStart={() => setSeeking(true)}
              onTouchEnd={() => setSeeking(false)}
              onTouchCancel={() => setSeeking(false)}
              className="flex-1"
              disabled={!currentId || duration === 0}
            />
            <span className="text-[11px] text-white/60 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-[120px]">
          <span className="text-[11px] text-white/60">Vol</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(clamp(Number(e.target.value), 0, 100))}
            className="w-24"
          />
        </div>
      </div>

      {currentId && (
        <YouTube
          videoId={currentId}
          opts={{ height: '0', width: '0', playerVars: { autoplay: 0, rel: 0, playsinline: 1 } }}
          onReady={(e) => {
            playerRef.current = e.target
            e.target.setVolume(volume)
            e.target.pauseVideo()
            syncTitleFromPlayer()
          }}
          onStateChange={(e) => {
            if (!playerRef.current) playerRef.current = e.target
            if (e.data === 0) {
              playNextFromQueue()
              return
            }
            if (e.data === 1 || e.data === 5) {
              syncTitleFromPlayer()
              void e.target
                .getDuration()
                .then((nextDuration) => {
                  if (Number.isFinite(nextDuration) && nextDuration > 0) {
                    setDuration(nextDuration)
                  }
                })
                .catch(() => {})
            }
          }}
        />
      )}
    </div>
  )
}

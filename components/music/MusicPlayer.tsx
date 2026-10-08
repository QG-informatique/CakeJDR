'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useMutation, useOthers, useSelf, useStorage } from '@liveblocks/react'
import { LiveList, LiveObject } from '@liveblocks/client'
import YouTube from 'react-youtube'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import { MoreHorizontal, Music2, Pause, Play, Plus, SkipForward, Volume2, VolumeX, X } from 'lucide-react'
import { useT } from '@/lib/useT'
import type { TranslationKey } from '@/lib/translations'

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

// Codes d'erreur YouTube : 2 = identifiant invalide, 5 = erreur HTML5,
// 100 = vidéo introuvable, 101/150 = intégration refusée par l'auteur.
const YT_ERRORS: Record<number, TranslationKey> = {
  2: 'ytInvalidId',
  5: 'ytPlayerError',
  100: 'ytNotFound',
  101: 'ytEmbedDisabled',
  150: 'ytEmbedDisabled',
}

export default function MusicPlayer() {
  const t = useT()
  const musicObj = useStorage((root) => root.music)
  const queueObj = useStorage((root) => root.musicQueue) as LiveList<QueueItem> | null

  const [input, setInput] = useState('')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const hasSyncedRef = useRef(false)
  // Lu par les rappels du lecteur YouTube, qui ne voient pas l'état React à jour.
  const isPlayingRef = useRef(false)
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  // À la fin d'un morceau, un seul joueur passe au suivant : celui dont la
  // connexion porte le plus petit numéro. Avant, chacun avançait la file, et
  // une table de quatre joueurs sautait trois morceaux.
  const selfConnectionId = useSelf((me) => me.connectionId)
  const otherConnectionIds = useOthers((others) => others.map((o) => o.connectionId))
  const isQueueLeader =
    selfConnectionId != null && otherConnectionIds.every((id) => id > selfConnectionId)
  const optionsPanelId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)

  // Le panneau d'options se ferme au clic ailleurs ou avec Échap.
  useEffect(() => {
    if (!optionsOpen) return
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOptionsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOptionsOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [optionsOpen])

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

  // `expectedId` : le morceau qui vient de finir. Si un autre joueur a déjà
  // changé de morceau entre-temps, on ne touche à rien.
  const playNextFromQueue = useMutation(({ storage }, expectedId?: string) => {
    if (expectedId) {
      const current = storage.get('music')
      if (current instanceof LiveObject && current.get('id') !== expectedId) return null
    }
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- suit la musique partagée de la table (Liveblocks)
    setCurrentId(nextId)
    if (!hasSyncedRef.current) {
      hasSyncedRef.current = true
      setIsPlaying(false)
    } else {
      setIsPlaying(!!musicPlaying)
    }
  }, [musicReady, musicId, musicPlaying])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- remise à zéro au changement de morceau
    setCurrentTitle('')
    setCurrentTime(0)
    setDuration(0)
    setPlayerError(null)
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

  const canPlay = !!currentId || queueCount > 0

  const volumeControl = (className: string, rangeClass: string) => (
    <label className={`${className} items-center gap-1 text-ink/60`} title={`${t('musicVolume')} ${volume}`}>
      {volume === 0 ? <VolumeX size={14} aria-hidden /> : <Volume2 size={14} aria-hidden />}
      <span className="sr-only">{t('musicVolume')}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => setVolume(clamp(Number(e.target.value), 0, 100))}
        className={rangeClass}
      />
    </label>
  )

  return (
    <div ref={wrapRef} className="relative flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        onClick={canPlay ? handlePlayPause : () => setOptionsOpen(true)}
        className="ui-btn ui-btn-icon shrink-0"
        aria-label={!canPlay ? t('musicOptions') : isPlaying ? t('musicPause') : t('musicPlay')}
        title={!canPlay ? t('musicOptions') : isPlaying ? t('musicPause') : t('musicPlay')}
      >
        {!canPlay ? <Music2 size={16} /> : isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {playerError ? (
        <span className="hidden min-w-0 max-w-[14rem] truncate text-xs text-red-400 @lg:block" title={playerError}>
          ⚠ {playerError}
        </span>
      ) : (
        <span
          className={`hidden min-w-0 max-w-[14rem] truncate text-xs @lg:block ${currentTitle ? 'text-ink/85' : 'text-ink/55'}`}
          title={currentTitle || undefined}
        >
          {currentTitle || (currentId ? '…' : t('musicNone'))}
        </span>
      )}

      {/* Barre du bas étroite : le volume passe dans le menu « ⋯ ». */}
      {volumeControl('hidden shrink-0 @2xl:flex', 'w-20')}

      <button
        type="button"
        onClick={() => setOptionsOpen((open) => !open)}
        aria-expanded={optionsOpen}
        aria-controls={optionsPanelId}
        className="ui-btn ui-btn-ghost ui-btn-icon shrink-0"
        aria-label={optionsOpen ? t('musicCloseOptions') : t('musicOptions')}
        title={optionsOpen ? t('musicCloseOptions') : t('musicOptions')}
      >
        <MoreHorizontal size={16} />
      </button>

      {optionsOpen && (
        <div
          id={optionsPanelId}
          className="ui-panel ui-pop absolute bottom-full left-0 z-50 mb-2 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 p-3"
          style={{ background: 'var(--c-panel-head)' }}
        >
          <div className="flex items-center gap-2">
            <span className="ui-label">{t('musicOptions')}</span>
            <button
              type="button"
              onClick={() => setOptionsOpen(false)}
              className="ui-btn ui-btn-ghost ui-btn-icon ml-auto !h-7 !min-h-7 !w-7"
              aria-label={t('close')}
              title={t('close')}
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="text"
              placeholder={t('youtubeLink')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePlayNow()
              }}
              className="ui-input w-full"
            />
            <div className="flex gap-2">
              <button onClick={handlePlayNow} className="ui-btn ui-btn-primary flex-1" disabled={!input.trim()}>
                <Play size={14} />
                {t('musicPlayNow')}
              </button>
              <button onClick={handleAddToQueue} className="ui-btn flex-1" disabled={!input.trim()}>
                <Plus size={14} />
                {t('musicAddToQueue')}
              </button>
            </div>
          </div>

          {volumeControl('flex @2xl:hidden', 'flex-1')}

          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] tabular-nums text-ink/60">{formatTime(currentTime)}</span>
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
                aria-label={t('musicPosition')}
              />
              <span className="text-[11px] tabular-nums text-ink/60">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-ink/65">
              {queueCount > 0 ? t('musicQueued').replace('{n}', String(queueCount)) : t('musicQueueEmpty')}
            </span>
            <button
              onClick={handleNext}
              disabled={queueCount === 0}
              className="ui-btn ml-auto"
              title={queueCount > 0 ? t('musicNextTitle').replace('{n}', String(queueCount)) : t('musicQueueEmpty')}
            >
              <SkipForward size={14} />
              {t('musicNext')}
            </button>
          </div>
        </div>
      )}

      {currentId && (
        <YouTube
          videoId={currentId}
          opts={{ height: '0', width: '0', playerVars: { autoplay: 0, rel: 0, playsinline: 1 } }}
          onReady={(e) => {
            playerRef.current = e.target
            e.target.setVolume(volume)
            // « Lire » sur le tout premier morceau : le lecteur n'existait pas
            // encore quand on a demandé la lecture, on la lance maintenant.
            if (isPlayingRef.current) e.target.playVideo()
            else e.target.pauseVideo()
            syncTitleFromPlayer()
          }}
          onError={(e) => {
            const code = typeof e.data === 'number' ? e.data : -1
            const key = YT_ERRORS[code]
            setPlayerError(key ? t(key) : t('ytError').replace('{n}', String(code)))
            setIsPlaying(false)
          }}
          onStateChange={(e) => {
            try {
              if (!playerRef.current) playerRef.current = e.target
              if (e.data === 0) {
                if (isQueueLeader && currentId) playNextFromQueue(currentId)
                return
              }
              // Morceau changé pendant la lecture : YouTube le charge à l'arrêt.
              if (e.data === 5 && isPlayingRef.current) e.target.playVideo()
              if (e.data === 1 || e.data === 5) {
                setPlayerError(null) // lecture OK → effacer une erreur précédente
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
            } catch {
              // Le callback YouTube s'exécute hors du cycle React/Liveblocks,
              // on absorbe silencieusement pour éviter l'erreur non gérée.
            }
          }}
        />
      )}
    </div>
  )
}

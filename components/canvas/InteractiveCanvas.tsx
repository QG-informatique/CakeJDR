'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import {
  useBroadcastEvent,
  useEventListener,
  useStorage,
  useMutation,
  useMyPresence,
} from '@liveblocks/react'
import LiveCursors from './LiveCursors'
import YouTube from 'react-youtube'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import CanvasTools, { ToolMode } from './CanvasTools'
import { useT } from '@/lib/useT'
import MusicPanel from './MusicPanel'
import ImageItem, { ImageData } from './ImageItem'
import SideNotes from '@/components/misc/SideNotes'

// [FIX #5] Persisted stroke information
type LineSegment = {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  mode: ToolMode
}

export default function InteractiveCanvas() {
  // `images` map is created by RoomProvider but may be null until ready
  const imagesMap = useStorage((root) => root.images)
  const images = imagesMap
    ? (Array.from(imagesMap.values()) as ImageData[])
    : []

  const musicObj = useStorage((root) => root.music) // peut être null au démarrage
  const storageReady = Boolean(musicObj)

  const storedLines = useStorage(
    (root) => root.lines?.toArray() as LineSegment[] | undefined,
  )
  const lines = useMemo(() => storedLines ?? [], [storedLines])
  const linesRef = useRef<LineSegment[]>([]) // [FIX #5]

  const [isDrawing, setIsDrawing] = useState(false)
  const [drawMode, setDrawMode] = useState<ToolMode>('images')
  const [color, setColor] = useState('#000000')
  const [penSize, setPenSize] = useState(10)
  const [eraserSize, setEraserSize] = useState(20)
  const brushSize = drawMode === 'erase' ? eraserSize : penSize
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [toolsVisible, setToolsVisible] = useState(false)
  const [audioVisible, setAudioVisible] = useState(false)

  const [ytUrl, setYtUrl] = useState('')
  const [ytId, setYtId] = useState('')

  // Lecture: synchro globale
  const [isPlaying, setIsPlaying] = useState(false)

  // Volume: synchro globale (0..100), défaut 5%
  const [volume, setVolumeState] = useState(5)
  const setVolume = (v: number) => {
    setVolumeState(v)
    if (storageReady) updateMusic({ volume: v })
  }

  const broadcast = useBroadcastEvent()
  const lastSend = useRef(0)
  const THROTTLE = 0
  const [, updateMyPresence] = useMyPresence()

  const canvasRef = useRef<HTMLDivElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const t = useT()
  const initializedRef = useRef(false)

  useEffect(() => {
    return () => {
      updateMyPresence({ cursor: null })
    }
  }, [updateMyPresence])

  const addImage = useMutation(({ storage }, img: ImageData) => {
    storage.get('images').set(String(img.id), img)
  }, [])

  const updateImage = useMutation(({ storage }, img: ImageData) => {
    storage.get('images').set(String(img.id), img)
  }, [])

  const deleteImage = useMutation(({ storage }, id: number) => {
    storage.get('images').delete(String(id))
  }, [])

  const clearImages = useMutation(({ storage }) => {
    const map = storage.get('images')
    map.forEach((_v, key) => {
      map.delete(key)
    })
  }, [])

  const addLine = useMutation(({ storage }, line: LineSegment) => {
    storage.get('lines').push(line)
  }, [])

  const clearLines = useMutation(({ storage }) => {
    storage.get('lines').clear()
  }, []) // [FIX #5]

  // Mutation musique: gère l'état global (id, lecture, volume)
  const updateMusic = useMutation(
    (
      { storage },
      updates: { id?: string; playing?: boolean; volume?: number },
    ) => {
      storage.get('music').update(updates)
    },
    [],
  )

  // Events canvas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEventListener((payload: any) => {
    const { event } = payload
    if (event.type === 'clear-canvas') {
      clearCanvas(false)
    } else if (event.type === 'draw-line' && ctxRef.current) {
      const { x1, y1, x2, y2, color: c, width, mode } = event
      ctxRef.current.strokeStyle = mode === 'erase' ? 'rgba(0,0,0,1)' : c
      ctxRef.current.lineWidth = width
      ctxRef.current.globalCompositeOperation =
        mode === 'erase' ? 'destination-out' : 'source-over'
      ctxRef.current.beginPath()
      ctxRef.current.moveTo(x1, y1)
      ctxRef.current.lineTo(x2, y2)
      ctxRef.current.stroke()
    }
  })

  const dragState = useRef({
    id: null as number | null,
    type: null as 'move' | 'resize' | null,
    offsetX: 0,
    offsetY: 0,
  })

  const DRAW_MIN = 2
  const DRAW_MAX = 50
  const ERASE_MIN = DRAW_MIN * 4
  const ERASE_MAX = DRAW_MAX * 4

  const redrawLines = () => {
    const ctx = ctxRef.current
    const canvas = drawingCanvasRef.current
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    linesRef.current.forEach((l) => {
      ctx.strokeStyle = l.mode === 'erase' ? 'rgba(0,0,0,1)' : l.color
      ctx.lineWidth = l.width
      ctx.globalCompositeOperation =
        l.mode === 'erase' ? 'destination-out' : 'source-over'
      ctx.beginPath()
      ctx.moveTo(l.x1, l.y1)
      ctx.lineTo(l.x2, l.y2)
      ctx.stroke()
    })
  } // [FIX #5]

    useEffect(() => {
      const resize = () => {
        const canvas = drawingCanvasRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const dpr = window.devicePixelRatio || 1
          canvas.width = rect.width * dpr
          canvas.height = rect.height * dpr
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.scale(dpr, dpr)
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctxRef.current = ctx
            redrawLines() // [FIX #5]
          }
        }
      }
      resize()
      window.addEventListener('resize', resize)
      return () => window.removeEventListener('resize', resize)
    }, [toolsVisible, audioVisible])

  useEffect(() => {
    linesRef.current = lines
    redrawLines()
  }, [lines]) // [FIX #5]

  useEffect(() => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    canvas.style.zIndex = '2'
    canvas.style.pointerEvents = drawMode === 'images' ? 'none' : 'auto'
  }, [drawMode])

  useEffect(() => {
    if (drawMode === 'erase') {
      setEraserSize((s) => Math.min(Math.max(s, ERASE_MIN), ERASE_MAX))
    } else {
      setPenSize((s) => Math.min(Math.max(s, DRAW_MIN), DRAW_MAX))
    }
  }, [drawMode, DRAW_MIN, DRAW_MAX, ERASE_MIN, ERASE_MAX])

  // Volume: applique seulement au player
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume)
    }
  }, [volume])

  // Lecture: contrôle global (synchro via musicObj)
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) player.playVideo()
    else player.pauseVideo()
  }, [isPlaying])

  // Quand l’état global musique change (depuis Liveblocks), on s’aligne
  useEffect(() => {
    if (!musicObj) return
    setYtId(musicObj.id)
    setIsPlaying(!!musicObj.playing)
    setVolumeState(musicObj.volume ?? 5)
  }, [musicObj])

  // --------- DnD images: aperçu instantané + swap vers Cloudinary optimisé ---------

  function fileToObjectURL(file: File) {
    return URL.createObjectURL(file)
  }

  async function uploadImageOptimistic(
    file: File,
    dropX: number,
    dropY: number,
  ) {
    const localUrl = fileToObjectURL(file)
    const tempId = Date.now() + Math.random()
    const tempImg: ImageData = {
      id: tempId,
      src: localUrl,
      x: dropX - 100,
      y: dropY - 100,
      width: 200,
      height: 200,
    }
    addImage(tempImg)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('upload_preset', 'cakejdr-images')

      const res = await fetch('/api/cloudinary', { method: 'POST', body: form })
      const data = await res.json().catch(() => null)

      if (!res.ok || !data) {
        throw new Error(data?.error || 'Upload failed')
      }

      const finalUrl: string = data.deliveryUrl || data.url
      if (!finalUrl) {
        throw new Error('No URL returned by Cloudinary endpoint')
      }

      updateImage({ ...tempImg, src: finalUrl })
    } catch (err) {
      deleteImage(tempId)
      console.error(err)
    } finally {
      URL.revokeObjectURL(localUrl)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      await uploadImageOptimistic(
        file,
        e.clientX - rect.left,
        e.clientY - rect.top,
      )
    }
  }

  // --------------------------------------------------------------------------

  const [selectedImageId, setSelectedImageId] = useState<number | null>(null)

  const handlePointerDown = (
    e: React.PointerEvent,
    id?: number,
    type?: 'move' | 'resize',
  ) => {
    e.preventDefault()
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return

    if ((drawMode === 'draw' || drawMode === 'erase') && !id) {
      setIsDrawing(true)
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePos({ x, y })
      const ctx = ctxRef.current
      if (ctx) {
        ctx.strokeStyle = drawMode === 'erase' ? 'rgba(0,0,0,1)' : color
        ctx.lineWidth = brushSize
        ctx.globalCompositeOperation =
          drawMode === 'erase' ? 'destination-out' : 'source-over'
        ctx.beginPath()
        ctx.moveTo(x, y)
      }
      return
    }

    if (drawMode === 'images' && id && type) {
      const img = images.find((i) => i.id === id)
      if (!img) return

      dragState.current = {
        id,
        type,
        offsetX: e.clientX - rect.left - img.x,
        offsetY: e.clientY - rect.top - img.y,
      }
      setSelectedImageId(id)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })
    updateMyPresence({ cursor: { x, y } })

    if (
      isDrawing &&
      (drawMode === 'draw' || drawMode === 'erase') &&
      ctxRef.current
    ) {
      ctxRef.current.lineTo(x, y)
      ctxRef.current.stroke()
      const { x: px, y: py } = mousePos
      const now = Date.now()
      if (THROTTLE === 0 || now - lastSend.current > THROTTLE) {
        lastSend.current = now
        broadcast({
          type: 'draw-line',
          x1: px,
          y1: py,
          x2: x,
          y2: y,
          color,
          width: brushSize,
          mode: drawMode,
        } as Liveblocks['RoomEvent'])
        addLine({
          x1: px,
          y1: py,
          x2: x,
          y2: y,
          color,
          width: brushSize,
          mode: drawMode,
        }) // [FIX #5]
      }
    }

    const { id, type, offsetX, offsetY } = dragState.current
    if (!id || !type) return
    const img = images.find((i) => i.id === id)
    if (!img) return
    const updated =
      type === 'move'
        ? {
            ...img,
            x: Math.max(0, Math.min(x - offsetX, rect.width - img.width)),
            y: Math.max(0, Math.min(y - offsetY, rect.height - img.height)),
          }
        : {
            ...img,
            width: Math.max(50, x - img.x),
            height: Math.max(50, y - img.y),
          }
    updateImage(updated)
  }

  const handlePointerUp = () => {
    setIsDrawing(false)
    dragState.current = { id: null, type: null, offsetX: 0, offsetY: 0 }
  }

  const handlePointerLeave = () => {
    updateMyPresence({ cursor: null })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (drawMode !== 'images' || selectedImageId === null) return
    const img = images.find((i) => i.id === selectedImageId)
    if (!img) return
    const step = 5
    const updates: Partial<ImageData> = {}
    if (e.key === 'ArrowUp') updates.y = Math.max(0, img.y - step)
    else if (e.key === 'ArrowDown') updates.y = img.y + step
    else if (e.key === 'ArrowLeft') updates.x = Math.max(0, img.x - step)
    else if (e.key === 'ArrowRight') updates.x = img.x + step
    if (Object.keys(updates).length) {
      e.preventDefault()
      updateImage({ ...img, ...updates })
    }
  }

  const clearCanvas = (broadcastChange = true) => {
    clearImages()
    clearLines() // [FIX #5]
    const ctx = ctxRef.current
    if (ctx && drawingCanvasRef.current) {
      ctx.clearRect(
        0,
        0,
        drawingCanvasRef.current.width,
        drawingCanvasRef.current.height,
      )
    }
    if (broadcastChange) {
      broadcast({ type: 'clear-canvas' } as Liveblocks['RoomEvent'])
    }
  }

  const handleDeleteImage = (id: number) => {
    deleteImage(id)
  }

  const handleYtSubmit = () => {
    const match = ytUrl.match(/(?:youtube\.com.*v=|youtu\.be\/)([^&\n?#]+)/)
    if (match) {
      setYtId(match[1] ?? '') // local immédiat
      setIsPlaying(true)
      if (storageReady) {
        updateMusic({ id: match[1], playing: true })
      }
    }
  }

  const handlePlayPause = () => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) player.pauseVideo()
    else player.playVideo()

    const newPlaying = !isPlaying
    setIsPlaying(newPlaying)
    if (storageReady) {
      updateMusic({ playing: newPlaying })
    }
  }

  return (
    <>
      <div className="relative w-full h-full select-none">
        {/* TOOLBAR BUTTON */}
        <div className="absolute top-3 left-3 z-30 pointer-events-auto">
          <button
            onClick={() => setToolsVisible(!toolsVisible)}
            className="rounded-xl px-5 py-2 text-base font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-emerald-600 hover:text-white transition duration-100 flex items-center justify-center min-h-[38px]"
          >
            <span className="mr-1">🛠️</span>{' '}
            <span className="text-sm">{toolsVisible ? t('tools') : ''}</span>
          </button>
        </div>
        {toolsVisible && (
          <div className="absolute top-3 left-36 z-30 origin-top-left pointer-events-auto">
            <CanvasTools
              drawMode={drawMode}
              setDrawMode={setDrawMode}
              color={color}
              setColor={setColor}
              brushSize={brushSize}
              setPenSize={setPenSize}
              setEraserSize={setEraserSize}
              clearCanvas={clearCanvas}
            />
          </div>
        )}
        {/* BOUTON MUSIQUE */}
        <div className="absolute bottom-3 right-3 z-30 pointer-events-auto">
          <button
            onClick={() => setAudioVisible(!audioVisible)}
            className="relative rounded-xl px-5 py-2 text-base font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-purple-600 hover:text-white transition duration-100 flex items-center justify-center min-h-[38px]"
          >
            {isPlaying && (
              <span className="absolute inset-0 rounded-xl pointer-events-none animate-pulse-ring" />
            )}
            <span className="relative">🎵</span>
          </button>
        </div>
        {audioVisible && (
          <MusicPanel
            ytUrl={ytUrl}
            setYtUrl={setYtUrl}
            isPlaying={isPlaying}
            handleSubmit={handleYtSubmit}
            handlePlayPause={handlePlayPause}
            volume={volume}
            setVolume={setVolume}
          />
        )}
        {/* Player YouTube (toujours monté pour conserver la lecture) */}
        {ytId && (
          <YouTube
            videoId={ytId}
            opts={{
              height: '0',
              width: '0',
              playerVars: { autoplay: 0, rel: 0, playsinline: 1 },
            }}
            onReady={(e) => {
              playerRef.current = e.target
              if (!initializedRef.current) {
                initializedRef.current = true
              }
              e.target.setVolume(volume)
              if (isPlaying) e.target.playVideo()
              else e.target.pauseVideo()
            }}
          />
        )}
        {/* Zone de dessin + images */}
        <div
          ref={canvasRef}
          tabIndex={0}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onKeyDown={handleKeyDown}
          onWheel={(e) => e.preventDefault()}
          className="w-full h-full relative overflow-hidden z-0 touch-none"
          style={{ background: 'none', border: 'none', borderRadius: 0 }}
        >
          <canvas
            ref={drawingCanvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />

          {images.map((img) => (
            <ImageItem
              key={img.id}
              img={img}
              drawMode={drawMode}
              onPointerDown={handlePointerDown}
              onDelete={handleDeleteImage}
            />
          ))}

          {(drawMode === 'draw' || drawMode === 'erase') &&
            !dragState.current.id && (
              <div
                className="absolute rounded-full border border-emerald-500 pointer-events-none"
                style={{
                  top: mousePos.y - brushSize / 2,
                  left: mousePos.x - brushSize / 2,
                  width: brushSize,
                  height: brushSize,
                  zIndex: 2,
                }}
              />
            )}

          <LiveCursors />
          <SideNotes />

          {/* DiceHub supprimé : les lancers de dés ne sont plus synchronisés globalement */}
        </div>{' '}
        {/* ← fin du conteneur relatif */}
      </div>

      <style jsx>{`
        @keyframes pulseRing {
          0% {
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.6);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(168, 85, 247, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0);
          }
        }
        .animate-pulse-ring {
          animation: pulseRing 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  )
}

'use client'

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import {
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
import SideNotes from '@/components/misc/SideNotes'\r\n\r\ntype StrokeSegment = {\r\n  id: string\r\n  x1: number\r\n  y1: number\r\n  x2: number\r\n  y2: number\r\n  color: string\r\n  width: number\r\n  mode: 'draw' | 'erase'\r\n}\r\n\r\nconst MIN_IMAGE_SIZE = 40\r\n\r\nconst clamp = (value: number, min: number, max: number) => {\r\n  if (Number.isNaN(value)) return min\r\n  if (max < min) return min\r\n  return Math.min(Math.max(value, min), max)\r\n}\r\n\r\nconst roundRatio = (value: number) => Math.round(value * 1000) / 1000\r\n\r\nconst normalizeImageRect = (img: ImageData, canvasWidth: number, canvasHeight: number): ImageData => {\r\n  if (!canvasWidth || !canvasHeight) {\r\n    return { ...img }\r\n  }\r\n  const width = clamp(img.width, MIN_IMAGE_SIZE, canvasWidth)\r\n  const height = clamp(img.height, MIN_IMAGE_SIZE, canvasHeight)\r\n  const x = clamp(img.x, 0, canvasWidth - width)\r\n  const y = clamp(img.y, 0, canvasHeight - height)\r\n\r\n  return {\r\n    ...img,\r\n    x,\r\n    y,\r\n    width,\r\n    height,\r\n    xRatio: roundRatio(x / canvasWidth),\r\n    yRatio: roundRatio(y / canvasHeight),\r\n    widthRatio: roundRatio(width / canvasWidth),\r\n    heightRatio: roundRatio(height / canvasHeight),\r\n  }\r\n}\r\n\r\nconst resolveImageRect = (img: ImageData, canvasWidth: number, canvasHeight: number): ImageData => {\r\n  if (!canvasWidth || !canvasHeight) {\r\n    return { ...img }\r\n  }\r\n\r\n  if (\r\n    img.xRatio === undefined ||\r\n    img.yRatio === undefined ||\r\n    img.widthRatio === undefined ||\r\n    img.heightRatio === undefined\r\n  ) {\r\n    const width = clamp(img.width, MIN_IMAGE_SIZE, canvasWidth)\r\n    const height = clamp(img.height, MIN_IMAGE_SIZE, canvasHeight)\r\n    const x = clamp(img.x, 0, canvasWidth - width)\r\n    const y = clamp(img.y, 0, canvasHeight - height)\r\n    return { ...img, x, y, width, height }\r\n  }\r\n\r\n  const width = clamp(img.widthRatio * canvasWidth, MIN_IMAGE_SIZE, canvasWidth)\r\n  const height = clamp(img.heightRatio * canvasHeight, MIN_IMAGE_SIZE, canvasHeight)\r\n  const x = clamp(img.xRatio * canvasWidth, 0, canvasWidth - width)\r\n  const y = clamp(img.yRatio * canvasHeight, 0, canvasHeight - height)\r\n\r\n  return {\r\n    ...img,\r\n    x,\r\n    y,\r\n    width,\r\n    height,\r\n  }\r\n}\r\n

export default function InteractiveCanvas() {
  // `images` map is created by RoomProvider but may be null until ready
  const imagesMap = useStorage((root) => root.images)
  const images = imagesMap
    ? (Array.from(imagesMap.values()) as ImageData[])
    : []

  const strokesList = useStorage((root) => root.strokes)
  const strokes = useMemo<StrokeSegment[]>(() => {
    if (!strokesList) return []
    const result: StrokeSegment[] = []

  const displayImages = useMemo(() => {
    if (!canvasSize.width || !canvasSize.height) {
      return images.map((img) => ({ ...img }))
    }
    return images.map((img) => resolveImageRect(img, canvasSize.width, canvasSize.height))
  }, [images, canvasSize])

  const displayImageMap = useMemo(() => {
    const map = new Map<number, ImageData>()
    displayImages.forEach((img) => map.set(img.id, img))
    return map
  }, [displayImages])

    for (let i = 0; i < strokesList.length; i += 1) {
      const entry = strokesList.get(i)
      if (entry) {
        result.push(entry as StrokeSegment)
      }
    }
    return result
  }, [strokesList])

  const musicObj = useStorage((root) => root.music) // peut ÃƒÆ’Ã‚Âªtre null au dÃƒÆ’Ã‚Â©marrage
  const storageReady = Boolean(musicObj)

  const [isDrawing, setIsDrawing] = useState(false)
  const [drawMode, setDrawMode] = useState<ToolMode>('images')
  const [color, setColor] = useState('#000000')
  const [penSize, setPenSize] = useState(10)
  const [eraserSize, setEraserSize] = useState(20)
  const brushSize = drawMode === 'erase' ? eraserSize : penSize
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [toolsVisible, setToolsVisible] = useState(false)
  const [audioVisible, setAudioVisible] = useState(false)\r\n  const [pendingImages, setPendingImages] = useState<ImageData[]>([])
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  const [ytUrl, setYtUrl] = useState('')
  const [ytId, setYtId] = useState('')

  // Lecture: synchro globale
  const [isPlaying, setIsPlaying] = useState(false)

  // Volume: gestion locale du volume (0..100), valeur par dÃ©faut 30%\r\n  const [volume, setVolumeState] = useState(30)\r\n  const setVolume = useCallback((value: number) => {\r\n    const clamped = Math.max(0, Math.min(100, Math.round(value)))\r\n    setVolumeState(clamped)\r\n    if (typeof window !== 'undefined') {\r\n      window.localStorage.setItem('canvas_volume', String(clamped))\r\n    }\r\n  }, [])

  const [, updateMyPresence] = useMyPresence()\r\n  const lastPointRef = useRef<{ x: number; y: number } | null>(null)\r\n
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("canvas_volume")
    if (!stored) return
    const parsed = Number(stored)
    if (Number.isFinite(parsed)) {
      setVolumeState(Math.max(0, Math.min(100, Math.round(parsed))))
    }
  }, [])

  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const t = useT()
  const initializedRef = useRef(false)

  const createStrokeId = useCallback(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }, [])

  const redrawCanvas = useCallback(() => {
    const canvas = drawingCanvasRef.current
    const ctx = ctxRef.current
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()

    strokes.forEach((segment) => {
      ctx.save()
      ctx.lineWidth = segment.width
      ctx.strokeStyle = segment.mode === 'erase' ? 'rgba(0,0,0,1)' : segment.color
      ctx.globalCompositeOperation =
        segment.mode === 'erase' ? 'destination-out' : 'source-over'
      ctx.beginPath()
      ctx.moveTo(segment.x1, segment.y1)
      ctx.lineTo(segment.x2, segment.y2)
      ctx.stroke()
      ctx.restore()
    })

    ctx.globalCompositeOperation = 'source-over'
    ctx.beginPath()
  }, [strokes])

  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  useEffect(() => {
    const resize = () => {
      const canvas = drawingCanvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      setCanvasSize((prev) => (prev.width === rect.width && prev.height === rect.height ? prev : { width: rect.width, height: rect.height }))

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctxRef.current = ctx
      }

      redrawCanvas()
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [toolsVisible, audioVisible, redrawCanvas])

  useEffect(() => {
    return () => {
      updateMyPresence({ cursor: null })
    }
  }, [updateMyPresence])

  const addImage = useMutation(({ storage }, img: ImageData) => {
    storage.get('images').set(img.id, img)
  }, [])

  const updateImageTransform = useMutation(
    (
      { storage },
      id: string,
      updates: Partial<ImageData>,
    ) => {
      const map = storage.get('images')
      const current = map.get(id)
      if (current) {
        map.set(id, { ...current, ...updates })
      }
    },
    [],
  )

  const removeImage = useMutation(({ storage }, id: string) => {
    storage.get('images').delete(id)
  }, [])

  const clearImages = useMutation(({ storage }) => {
    const map = storage.get('images')
    map.forEach((_v, key) => {
      map.delete(key)
    })
  }, [])

  const addStrokeSegment = useMutation(({ storage }, segment: StrokeSegment) => {
    storage.get('strokes').push(segment as StrokeSegment)
  }, [])

  const clearStrokes = useMutation(({ storage }) => {
    storage.get('strokes').clear()
  }, [])

  // Mutation musique: gÃƒÆ’Ã‚Â¨re l'ÃƒÆ’Ã‚Â©tat global (id, lecture, volume)
  const updateMusic = useMutation(
    (
      { storage },
      updates: { id?: string; playing?: boolean },
    ) => {
      storage.get('music').update(updates)
    },
    [],
  )

  // Events canvas (compatibilitÃƒÂ© avec les anciennes diffusions d''ÃƒÂ©vÃƒÂ©nements)\r\n  // eslint-disable-next-line @typescript-eslint/no-explicit-any\r\n  useEventListener((payload: any) => {\r\n    const { event } = payload\r\n    if (event.type === 'clear-canvas') {\r\n      clearCanvas()\r\n    } else if (event.type === 'draw-line') {\r\n      addStrokeSegment({\r\n        id: createStrokeId(),\r\n        x1: event.x1,\r\n        y1: event.y1,\r\n        x2: event.x2,\r\n        y2: event.y2,\r\n        color: event.color,\r\n        width: event.width,\r\n        mode: event.mode,\r\n      })\r\n    }\r\n  })

  const dragState = useRef({
    id: null as string | null,
    type: null as 'move' | 'resize' | null,
    offsetX: 0,
    offsetY: 0,
  })

  const DRAW_MIN = 2
  const DRAW_MAX = 50
  const ERASE_MIN = DRAW_MIN * 4
  const ERASE_MAX = DRAW_MAX * 4

  const redrawStrokes = () => {
    const ctx = ctxRef.current
    if (!ctx) return
    for (const s of strokesRef.current) {
      ctx.strokeStyle = s.mode === 'erase' ? 'rgba(0,0,0,1)' : s.color
      ctx.lineWidth = s.width
      ctx.globalCompositeOperation =
        s.mode === 'erase' ? 'destination-out' : 'source-over'
      ctx.beginPath()
      ctx.moveTo(s.x1, s.y1)
      ctx.lineTo(s.x2, s.y2)
      ctx.stroke()
    }
  }



  useEffect(() => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    canvas.style.zIndex = '2'
    canvas.style.pointerEvents = drawMode === 'images' ? 'none' : 'auto'
  }, [drawMode])

  useEffect(() => {
    const handleResize = () => {
      const rect = drawingCanvasRef.current?.getBoundingClientRect()
      if (!rect) return
      imagesRef.current.forEach((img) => {
        const clamped = clampImage(img, rect)
        if (
          clamped.x !== img.x ||
          clamped.y !== img.y ||
          clamped.width !== img.width ||
          clamped.height !== img.height
        ) {
          updateImageTransform(img.id, clamped)
        }
      })
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [updateImageTransform])

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

  // Lecture: contrÃƒÆ’Ã‚Â´le global (synchro via musicObj)
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) player.playVideo()
    else player.pauseVideo()
  }, [isPlaying])

  // Quand lÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â©tat global musique change (depuis Liveblocks), on sÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢aligne
  useEffect(() => {
    if (!musicObj) return
    setYtId(musicObj.id)
    setIsPlaying(!!musicObj.playing)
  }, [musicObj])

  // --------- DnD images: aperÃƒÆ’Ã‚Â§u instantanÃƒÆ’Ã‚Â© + swap vers Cloudinary optimisÃƒÆ’Ã‚Â© ---------

  function fileToObjectURL(file: File) {
    return URL.createObjectURL(file)
  }

  async function uploadImage(
    file: File,
    dropX: number,
    dropY: number,
    rect: DOMRect,
  ) {
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert('Invalid image file')
      return
    }
    const localUrl = fileToObjectURL(file)
    const tempId = Date.now() + Math.random()
    const baseImg: ImageData = {
      id: tempId,
      src: localUrl,
      x: dropX - 100,
      y: dropY - 100,
      width: 200,
      height: 200,
    }
    setPendingImages((prev) => [...prev, baseImg])

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

      addImage({ ...baseImg, src: finalUrl })
    } catch (err) {
      console.error(err)
      alert('Image upload failed')
    } finally {
      setPendingImages((prev) => prev.filter((img) => img.id !== tempId))
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
      await uploadImage(
        file,
        e.clientX - rect.left,
        e.clientY - rect.top,
        rect,
      )
    }
  }

  // --------------------------------------------------------------------------

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  const handlePointerDown = (
    e: React.PointerEvent,
    id?: string,
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
        ctx.moveTo(x, y)\r\n      }\r\n      lastPointRef.current = { x, y }\r\n      return
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
      localTransforms.current.set(id, {
        x: img.x,
        y: img.y,
        width: img.width,
        height: img.height,
        scale: img.scale,
        rotation: img.rotation,
        createdAt: img.createdAt,
        url: img.url,
        id: img.id,
      })
      scheduleRender()
      setSelectedImageId(id)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const prev = mousePos
    setMousePos({ x, y })
    updateMyPresence({ cursor: { x, y } })

    if (drawMode !== 'draw' && drawMode !== 'erase' && isDrawing) {
      setIsDrawing(false)
    }

    if (\r\n      isDrawing &&\r\n      (drawMode === 'draw' || drawMode === 'erase') &&\r\n      ctxRef.current\r\n    ) {\r\n      const previous = lastPointRef.current\r\n      ctxRef.current.lineTo(x, y)\r\n      ctxRef.current.stroke()\r\n      if (!previous || previous.x !== x || previous.y !== y) {\r\n        addStrokeSegment({\r\n          id: createStrokeId(),\r\n          x1: previous?.x ?? x,\r\n          y1: previous?.y ?? y,\r\n          x2: x,\r\n          y2: y,\r\n          color,\r\n          width: brushSize,\r\n          mode: drawMode,\r\n        })\r\n      }\r\n      lastPointRef.current = { x, y }\r\n    }\r\n
    const { id, type, offsetX, offsetY } = dragState.current
    if (!id || !type) return
    const original = images.find((i) => i.id === id)
    if (!original) return
    const base = { ...original, ...localTransforms.current.get(id) }
    const updated =
      type === 'move'
        ? { ...base, x: x - offsetX, y: y - offsetY }
        : { ...base, width: x - base.x, height: y - base.y }
    const clamped = clampImage(updated as ImageData, rect)
    localTransforms.current.set(id, clamped)
    scheduleRender()
    const now = Date.now()
    if (now - lastMutation.current > MUTATION_THROTTLE) {
      lastMutation.current = now
      updateImageTransform(id, clamped)
    }
  }

  const handlePointerUp = () => {\r\n    setIsDrawing(false)\r\n    lastPointRef.current = null\r\n    dragState.current = { id: null, type: null, offsetX: 0, offsetY: 0 }\r\n  }

  const handlePointerLeave = () => {\r\n    lastPointRef.current = null\r\n    updateMyPresence({ cursor: null })\r\n  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (drawMode !== 'images' || selectedImageId === null) return
    const img = imagesToRender.find((i) => i.id === selectedImageId)
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!img || !rect) return
    const step = 5
    let updated = { ...img }
    if (e.key === 'ArrowUp') updated.y -= step
    else if (e.key === 'ArrowDown') updated.y += step
    else if (e.key === 'ArrowLeft') updated.x -= step
    else if (e.key === 'ArrowRight') updated.x += step
    updated = clampImage(updated, rect)
    if (updated.x !== img.x || updated.y !== img.y) {
      e.preventDefault()
      localTransforms.current.set(img.id, updated)
      scheduleRender()
      updateImageTransform(img.id, updated)
    }
  }

  const clearCanvas = () => {\r\n    clearImages()\r\n    clearStrokes()\r\n    setPendingImages([])\r\n    const ctx = ctxRef.current\r\n    if (ctx && drawingCanvasRef.current) {\r\n      ctx.clearRect(\r\n        0,\r\n        0,\r\n        drawingCanvasRef.current.width,\r\n        drawingCanvasRef.current.height,\r\n      )\r\n      ctx.beginPath()\r\n    }\r\n  }

  const handleDeleteImage = (id: string) => {
    removeImage(id)
  }

  const handleImageError = (id: string) => {
    removeImage(id)
    alert('Image failed to load')
  }

  const handleYtSubmit = () => {
    const match = ytUrl.match(/(?:youtube\.com.*v=|youtu\.be\/)([^&\n?#]+)/)
    if (match) {
      setYtId(match[1] ?? '') // local immÃƒÆ’Ã‚Â©diat
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
            <span className="mr-1">ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂºÃ‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â</span>{' '}
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
            <span className="relative">ÃƒÂ°Ã…Â¸Ã…Â½Ã‚Âµ</span>
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
        {/* Player YouTube (toujours montÃƒÆ’Ã‚Â© pour conserver la lecture) */}
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

          {pendingImages.map((img) => (
            <div
              key={`pending-${img.id}`}
              className="absolute rounded-2xl border border-dashed border-white/30 bg-black/30 pointer-events-none animate-pulse"
              style={{ top: img.y, left: img.x, width: img.width, height: img.height, zIndex: 2 }}
            >
              <img
                src={img.src}
                alt="Envoi en cours"
                className="w-full h-full object-contain rounded-2xl opacity-80"
              />
            </div>
          ))}

          {images.map((img) => (
            <ImageItem
              key={img.id}
              img={img}
              drawMode={drawMode}
              onPointerDown={handlePointerDown}
              onDelete={handleDeleteImage}
              onError={handleImageError}
              pending={pendingImages.some((p) => p.id === img.id)}
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

          {/* DiceHub supprimÃƒÆ’Ã‚Â© : les lancers de dÃƒÆ’Ã‚Â©s ne sont plus synchronisÃƒÆ’Ã‚Â©s globalement */}
        </div>{' '}
        {/* ÃƒÂ¢Ã¢â‚¬Â Ã‚Â fin du conteneur relatif */}
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






























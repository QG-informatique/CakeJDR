"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  useEventListener,
  useStorage,
  useMutation,
  useMyPresence,
} from '@liveblocks/react'
import type { LiveList } from '@liveblocks/client'
import YouTube from 'react-youtube'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import CanvasTools, { ToolMode } from './CanvasTools'
import { useT } from '@/lib/useT'
import MusicPanel from './MusicPanel'
import ImageItem, { ImageData } from './ImageItem'
import LiveCursors from './LiveCursors'
import SideNotes from '@/components/misc/SideNotes'

type StrokeSegment = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  mode: 'draw' | 'erase'
  canvasWidth?: number
  canvasHeight?: number
}

const MIN_IMAGE_SIZE = 40
const DRAW_MIN = 2
const DRAW_MAX = 50
const ERASE_MIN = DRAW_MIN * 4
const ERASE_MAX = DRAW_MAX * 4
const MUTATION_THROTTLE = 120

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min
  if (max < min) return min
  return Math.min(Math.max(value, min), max)
}

const roundRatio = (value: number) => Math.round(value * 1000) / 1000

const createStrokeId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

const normalizeImageRect = (img: ImageData, canvasWidth: number, canvasHeight: number): ImageData => {
  if (!canvasWidth || !canvasHeight) {
    return { ...img }
  }
  const width = clamp(img.width, MIN_IMAGE_SIZE, canvasWidth)
  const height = clamp(img.height, MIN_IMAGE_SIZE, canvasHeight)
  const x = clamp(img.x, 0, canvasWidth - width)
  const y = clamp(img.y, 0, canvasHeight - height)

  return {
    ...img,
    x,
    y,
    width,
    height,
    xRatio: roundRatio(x / canvasWidth),
    yRatio: roundRatio(y / canvasHeight),
    widthRatio: roundRatio(width / canvasWidth),
    heightRatio: roundRatio(height / canvasHeight),
  }
}

const resolveImageRect = (img: ImageData, canvasWidth: number, canvasHeight: number): ImageData => {
  if (!canvasWidth || !canvasHeight) {
    return { ...img }
  }

  if (
    img.xRatio === undefined ||
    img.yRatio === undefined ||
    img.widthRatio === undefined ||
    img.heightRatio === undefined
  ) {
    const width = clamp(img.width, MIN_IMAGE_SIZE, canvasWidth)
    const height = clamp(img.height, MIN_IMAGE_SIZE, canvasHeight)
    const x = clamp(img.x, 0, canvasWidth - width)
    const y = clamp(img.y, 0, canvasHeight - height)
    return { ...img, x, y, width, height }
  }

  const width = clamp(img.widthRatio * canvasWidth, MIN_IMAGE_SIZE, canvasWidth)
  const height = clamp(img.heightRatio * canvasHeight, MIN_IMAGE_SIZE, canvasHeight)
  const x = clamp(img.xRatio * canvasWidth, 0, canvasWidth - width)
  const y = clamp(img.yRatio * canvasHeight, 0, canvasHeight - height)

  return {
    ...img,
    x,
    y,
    width,
    height,
  }
}

const clampImage = (img: ImageData, rect: DOMRect): ImageData => {
  const width = Math.min(Math.max(img.width, MIN_IMAGE_SIZE), rect.width - img.x)
  const height = Math.min(Math.max(img.height, MIN_IMAGE_SIZE), rect.height - img.y)
  const x = Math.min(Math.max(img.x, 0), rect.width - width)
  const y = Math.min(Math.max(img.y, 0), rect.height - height)
  return { ...img, x, y, width, height }
}

const fileToObjectURL = (file: File) => URL.createObjectURL(file)

const drawSegment = (
  ctx: CanvasRenderingContext2D,
  segment: StrokeSegment,
  targetWidth: number,
  targetHeight: number,
) => {
  const sourceWidth = segment.canvasWidth ?? targetWidth
  const sourceHeight = segment.canvasHeight ?? targetHeight
  const scaleX = sourceWidth ? targetWidth / sourceWidth : 1
  const scaleY = sourceHeight ? targetHeight / sourceHeight : 1
  const scale = (scaleX + scaleY) / 2 || 1

  ctx.save()
  ctx.globalCompositeOperation =
    segment.mode === 'erase' ? 'destination-out' : 'source-over'
  if (segment.mode !== 'erase') {
    ctx.strokeStyle = segment.color
  }
  ctx.lineWidth = segment.width * scale
  ctx.beginPath()
  ctx.moveTo(segment.x1 * scaleX, segment.y1 * scaleY)
  ctx.lineTo(segment.x2 * scaleX, segment.y2 * scaleY)
  ctx.stroke()
  ctx.restore()
}

const redrawAllSegments = (
  ctx: CanvasRenderingContext2D,
  segments: StrokeSegment[],
  width: number,
  height: number,
) => {
  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  segments.forEach((segment) => {
    drawSegment(ctx, segment, width, height)
  })
}

export default function InteractiveCanvas() {
  const t = useT()

  const imagesMap = useStorage((root) => root.images)
  const images = useMemo(() => {
    if (!imagesMap) return [] as ImageData[]
    return Array.from(imagesMap.values()) as ImageData[]
  }, [imagesMap])

  const strokesList = useStorage((root) => root.strokes) as
    | LiveList<StrokeSegment>
    | null
  const strokes = useMemo<StrokeSegment[]>(() => {
    if (!strokesList) return []
    if (typeof (strokesList as LiveList<StrokeSegment>).toArray === 'function') {
      return (strokesList as LiveList<StrokeSegment>).toArray()
    }
    const fallback = [] as StrokeSegment[]
    for (let i = 0; i < (strokesList as LiveList<StrokeSegment>).length; i += 1) {
      const entry = (strokesList as LiveList<StrokeSegment>).get(i)
      if (entry) {
        fallback.push(entry as StrokeSegment)
      }
    }
    return fallback
  }, [strokesList])

  const musicObj = useStorage((root) => root.music)
  const storageReady = Boolean(musicObj)

  const [isDrawing, setIsDrawing] = useState(false)
  const [drawMode, setDrawMode] = useState<ToolMode>('images')
  const [color, setColor] = useState('#000000')
  const [penSize, setPenSize] = useState(10)
  const [eraserSize, setEraserSize] = useState(20)
  const brushSize = drawMode === 'erase' ? eraserSize : penSize
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [toolsVisible, setToolsVisible] = useState(false)
  const [audioVisible, setAudioVisible] = useState(false)
  const [pendingImages, setPendingImages] = useState<ImageData[]>([])
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [renderVersion, setRenderVersion] = useState(0)
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [ytUrl, setYtUrl] = useState('')
  const [ytId, setYtId] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(30)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const setVolume = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)))
    setVolumeState(clamped)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('canvas_volume', String(clamped))
    }
  }, [])

  const [, updateMyPresence] = useMyPresence()
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const initializedRef = useRef(false)
  const imagesRef = useRef<ImageData[]>([])
  const localTransforms = useRef(new Map<string, Partial<ImageData>>())
  const renderFrame = useRef<number | null>(null)
  const lastMutation = useRef(0)
  const strokesRef = useRef<StrokeSegment[]>([])

  const scheduleRender = useCallback(() => {
    if (renderFrame.current) cancelAnimationFrame(renderFrame.current)
    renderFrame.current = requestAnimationFrame(() => {
      renderFrame.current = null
      setRenderVersion((v) => v + 1)
    })
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('canvas_volume')
    if (!stored) return
    const parsed = Number(stored)
    if (Number.isFinite(parsed)) {
      setVolumeState(Math.max(0, Math.min(100, Math.round(parsed))))
    }
  }, [])

  useEffect(() => () => {
    if (renderFrame.current) cancelAnimationFrame(renderFrame.current)
  }, [])

  const imagesToRender = useMemo(() => {
    void renderVersion
    return images.map((img) => {
      const key = String(img.id)
      const overrides = localTransforms.current.get(key)
      const merged = overrides ? { ...img, ...overrides } : img
      return resolveImageRect(merged as ImageData, canvasSize.width, canvasSize.height)
    })
  }, [images, canvasSize, renderVersion])

  imagesRef.current = imagesToRender

  const renderedImageMap = useMemo(() => {
    const map = new Map<string, ImageData>()
    imagesToRender.forEach((img) => map.set(String(img.id), img))
    return map
  }, [imagesToRender])

  useEffect(() => {
    const ids = new Set(images.map((img) => String(img.id)))
    const transforms = localTransforms.current
    let changed = false
    for (const key of Array.from(transforms.keys())) {
      if (!ids.has(key)) {
        transforms.delete(key)
        changed = true
      }
    }
    if (changed) scheduleRender()
  }, [images, scheduleRender])

  useEffect(() => {
    return () => {
      updateMyPresence({ cursor: null })
    }
  }, [updateMyPresence])

  useEffect(() => {
    strokesRef.current = strokes
    const ctx = ctxRef.current
    const canvas = drawingCanvasRef.current
    if (!ctx || !canvas) return
    redrawAllSegments(ctx, strokes, canvasSize.width, canvasSize.height)
  }, [strokes, canvasSize])

  const addStrokeSegment = useMutation(
    ({ storage }, segment: StrokeSegment) => {
      const list = storage.get('strokes') as LiveList<StrokeSegment> | null
      if (!list) return
      if (typeof list.push === 'function') {
        list.push(segment)
      } else if (
        typeof (list as unknown as { insert?: (index: number, value: StrokeSegment) => void }).insert ===
        'function'
      ) {
        const helper = list as unknown as {
          insert: (index: number, value: StrokeSegment) => void
          length?: number
        }
        helper.insert((helper.length ?? 0) as number, segment)
      }
      strokesRef.current = [...strokesRef.current, segment]
    },
    [],
  )

  const clearStrokes = useMutation(({ storage }) => {
    const list = storage.get('strokes') as LiveList<StrokeSegment> | null
    if (!list) {
      strokesRef.current = []
      return
    }
    if (typeof list.clear === 'function') {
      list.clear()
    } else if (typeof list.delete === 'function') {
      for (let i = (list.length ?? 0) - 1; i >= 0; i -= 1) {
        list.delete(i)
      }
    }
    strokesRef.current = []
  }, [])

  const addImage = useMutation(({ storage }, img: ImageData) => {
    storage.get('images').set(String(img.id), img)
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
    storage.get('images').delete(String(id))
  }, [])

  const clearImages = useMutation(({ storage }) => {
    const map = storage.get('images')
    map.forEach((_v, key) => {
      map.delete(key)
    })
  }, [])

  const clearCanvas = useCallback(() => {
    clearImages()
    clearStrokes()
    setPendingImages([])
    const ctx = ctxRef.current
    const canvas = drawingCanvasRef.current
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.beginPath()
    }
  }, [clearImages, clearStrokes])

  useEffect(() => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    images.forEach((img) => {
      if (
        img.xRatio === undefined ||
        img.yRatio === undefined ||
        img.widthRatio === undefined ||
        img.heightRatio === undefined
      ) {
        const normalized = normalizeImageRect(img, rect.width, rect.height)
        updateImageTransform(String(img.id), {
          x: normalized.x,
          y: normalized.y,
          width: normalized.width,
          height: normalized.height,
          xRatio: normalized.xRatio,
          yRatio: normalized.yRatio,
          widthRatio: normalized.widthRatio,
          heightRatio: normalized.heightRatio,
        })
      }
    })
  }, [images, updateImageTransform])

  const updateMusic = useMutation(
    (
      { storage },
      updates: { id?: string; playing?: boolean; volume?: number },
    ) => {
      storage.get('music').update(updates)
    },
    [],
  )

  useEventListener((payload: { event: { type: string; [key: string]: unknown } }) => {
    const { event } = payload
    if (event.type === 'clear-canvas') {
      clearCanvas()
    } else if (event.type === 'draw-line') {
      addStrokeSegment({
        id: createStrokeId(),
        x1: Number(event.x1),
        y1: Number(event.y1),
        x2: Number(event.x2),
        y2: Number(event.y2),
        color: String(event.color ?? '#000000'),
        width: Number(event.width ?? brushSize),
        mode: (event.mode as 'draw' | 'erase') ?? 'draw',
        canvasWidth: canvasSize.width,
        canvasHeight: canvasSize.height,
      })
    }
  })

  const dragState = useRef({
    id: null as string | null,
    type: null as 'move' | 'resize' | null,
    offsetX: 0,
    offsetY: 0,
  })

  const updateCanvasSize = useCallback(() => {
    const container = canvasRef.current
    const canvas = drawingCanvasRef.current
    if (!container || !canvas) return
    const rect = container.getBoundingClientRect()
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctxRef.current = ctx
    setCanvasSize({ width: rect.width, height: rect.height })
    redrawAllSegments(ctx, strokesRef.current, rect.width, rect.height)
  }, [])

  useEffect(() => {
    updateCanvasSize()
    const handleResize = () => updateCanvasSize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [updateCanvasSize])

  useEffect(() => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    canvas.style.zIndex = '2'
    canvas.style.pointerEvents = drawMode === 'images' ? 'none' : 'auto'
  }, [drawMode])

  useEffect(() => {
    if (drawMode === 'erase') {
      setEraserSize((s) => clamp(s, ERASE_MIN, ERASE_MAX))
    } else {
      setPenSize((s) => clamp(s, DRAW_MIN, DRAW_MAX))
    }
  }, [drawMode])

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume)
    }
  }, [volume])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) player.playVideo()
    else player.pauseVideo()
  }, [isPlaying])

  useEffect(() => {
    if (!musicObj) return
    setYtId(musicObj.id)
    setIsPlaying(!!musicObj.playing)
    setVolumeState(musicObj.volume ?? 30)
  }, [musicObj])

  const commitImageTransform = useCallback(
    (id: string) => {
      const rect = drawingCanvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const stored = images.find((img) => String(img.id) === id)
      const override = localTransforms.current.get(id)
      if (!stored || !override) return
      const normalized = normalizeImageRect({ ...stored, ...override }, rect.width, rect.height)
      updateImageTransform(id, {
        x: normalized.x,
        y: normalized.y,
        width: normalized.width,
        height: normalized.height,
        xRatio: normalized.xRatio,
        yRatio: normalized.yRatio,
        widthRatio: normalized.widthRatio,
        heightRatio: normalized.heightRatio,
      })
      localTransforms.current.delete(id)
    },
    [images, updateImageTransform],
  )

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
        ctx.globalCompositeOperation = drawMode === 'erase' ? 'destination-out' : 'source-over'
        ctx.beginPath()
        ctx.moveTo(x, y)
      }
      lastPointRef.current = { x, y }
      return
    }

    if (drawMode === 'images' && id && type) {
      const key = String(id)
      const img = renderedImageMap.get(key)
      if (!img) return

      dragState.current = {
        id: key,
        type,
        offsetX: e.clientX - rect.left - img.x,
        offsetY: e.clientY - rect.top - img.y,
      }
      localTransforms.current.set(key, {
        x: img.x,
        y: img.y,
        width: img.width,
        height: img.height,
      })
      scheduleRender()
      setSelectedImageId(key)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })
    updateMyPresence({ cursor: { x, y } })

    if (drawMode !== 'draw' && drawMode !== 'erase' && isDrawing) {
      setIsDrawing(false)
    }

    if (isDrawing && (drawMode === 'draw' || drawMode === 'erase') && ctxRef.current) {
      const previous = lastPointRef.current
      ctxRef.current.lineTo(x, y)
      ctxRef.current.stroke()
      if (!previous || previous.x !== x || previous.y !== y) {
        addStrokeSegment({
          id: createStrokeId(),
          x1: previous?.x ?? x,
          y1: previous?.y ?? y,
          x2: x,
          y2: y,
          color,
          width: brushSize,
          mode: drawMode,
          canvasWidth: canvasSize.width,
          canvasHeight: canvasSize.height,
        })
      }
      lastPointRef.current = { x, y }
    }

    const { id, type, offsetX, offsetY } = dragState.current
    if (!id || !type) return
    const stored = renderedImageMap.get(id)
    if (!stored) return
    const base = localTransforms.current.get(id) ?? stored
    const next =
      type === 'move'
        ? { ...base, x: x - offsetX, y: y - offsetY }
        : { ...base, width: x - base.x, height: y - base.y }
    const clamped = clampImage(next as ImageData, rect)
    localTransforms.current.set(id, clamped)
    scheduleRender()
    const now = Date.now()
    if (now - lastMutation.current > MUTATION_THROTTLE) {
      lastMutation.current = now
      const normalized = normalizeImageRect({ ...stored, ...clamped }, rect.width, rect.height)
      updateImageTransform(id, {
        x: normalized.x,
        y: normalized.y,
        width: normalized.width,
        height: normalized.height,
        xRatio: normalized.xRatio,
        yRatio: normalized.yRatio,
        widthRatio: normalized.widthRatio,
        heightRatio: normalized.heightRatio,
      })
    }
  }

  const handlePointerUp = () => {
    setIsDrawing(false)
    const { id } = dragState.current
    lastPointRef.current = null
    dragState.current = { id: null, type: null, offsetX: 0, offsetY: 0 }
    if (!id) return
    commitImageTransform(id)
  }

  const handlePointerLeave = () => {
    lastPointRef.current = null
    updateMyPresence({ cursor: null })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (drawMode !== 'images' || selectedImageId === null) return
    const img = renderedImageMap.get(selectedImageId)
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!img || !rect) return
    const step = 5
    let updated = { ...img }
    if (e.key === 'ArrowUp') updated.y -= step
    else if (e.key === 'ArrowDown') updated.y += step
    else if (e.key === 'ArrowLeft') updated.x -= step
    else if (e.key === 'ArrowRight') updated.x += step
    else return
    updated = clampImage(updated, rect)
    if (updated.x !== img.x || updated.y !== img.y) {
      e.preventDefault()
      localTransforms.current.set(selectedImageId, updated)
      scheduleRender()
      commitImageTransform(selectedImageId)
    }
  }

  const handleDeleteImage = (id: string) => {
    localTransforms.current.delete(String(id))
    removeImage(id)
  }

  const handleImageError = (id: string) => {
    removeImage(id)
    alert('Image failed to load')
  }

  const processImageFile = useCallback(
    async (file: File, position: { x: number; y: number }) => {
      const rect = drawingCanvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
      const MAX_SIZE_MB = 5
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert('Invalid image file')
        return
      }
      const localUrl = fileToObjectURL(file)
      const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const baseImg: ImageData = {
        id: tempId,
        url: localUrl,
        x: position.x - 100,
        y: position.y - 100,
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
        const normalized = normalizeImageRect(
          { ...baseImg, url: finalUrl, createdAt: Date.now() },
          rect.width,
          rect.height,
        )
        addImage(normalized)
      } catch (err) {
        console.error(err)
        alert('Image upload failed')
      } finally {
        setPendingImages((prev) => prev.filter((i) => i.id !== tempId))
        URL.revokeObjectURL(localUrl)
      }
    },
    [addImage],
  )

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith('image/'))
    for (const [index, file] of files.entries()) {
      const offset = index * 30
      await processImageFile(file, {
        x: e.clientX - rect.left + offset,
        y: e.clientY - rect.top + offset,
      })
    }
  }

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const files = e.target.files ? Array.from(e.target.files) : []
    for (const [index, file] of files.entries()) {
      const offset = index * 30
      await processImageFile(file, {
        x: rect.width / 2 + offset,
        y: rect.height / 2 + offset,
      })
    }
    e.target.value = ''
  }

  const handleYtSubmit = () => {
    const match = ytUrl.match(/(?:youtube\.com.*v=|youtu\.be\/)([^&\n?#]+)/)
    if (match) {
      setYtId(match[1] ?? '')
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

  const handleImagesButtonClick = () => {
    setDrawMode('images')
    requestAnimationFrame(() => {
      fileInputRef.current?.click()
    })
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
      <div className="relative w-full h-full select-none">
        <div className="absolute top-3 left-3 z-30 pointer-events-auto">
          <button
            onClick={() => setToolsVisible(!toolsVisible)}
            className="rounded-xl px-5 py-2 text-base font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-emerald-600 hover:text-white transition duration-100 flex items-center justify-center min-h-[38px]"
          >
            <span className="mr-1">🛠️</span>
            <span className="text-sm">{t('tools')}</span>
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
              onImageButtonClick={handleImagesButtonClick}
            />
          </div>
        )}

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
                src={img.url}
                alt="Envoi en cours"
                className="w-full h-full object-contain rounded-2xl opacity-80"
              />
            </div>
          ))}

          {imagesToRender.map((img) => (
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

          {(drawMode === 'draw' || drawMode === 'erase') && !dragState.current.id && (
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
        </div>
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

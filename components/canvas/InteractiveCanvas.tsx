'use client'

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Music, Wrench } from 'lucide-react'
import {
  useEventListener,
  useStorage,
  useMutation,
  useMyPresence,
} from '@liveblocks/react'
import type { LiveList } from '@liveblocks/client'
import LiveCursors from './LiveCursors'
import YouTube from 'react-youtube'
import type { YouTubePlayer } from 'youtube-player/dist/types'

import CanvasTools, { ToolMode } from './CanvasTools'
import LiveCursors from './LiveCursors'
import MusicPanel from './MusicPanel'
import ImageItem, { ImageData } from './ImageItem'
import SideNotes from '@/components/misc/SideNotes'
import { useT } from '@/lib/useT'

type StrokeSegment = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  mode: 'draw' | 'erase'
}

const MIN_IMAGE_SIZE = 40
const MUTATION_THROTTLE = 120
const IMAGE_MIN_SIZE = 50
const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]
const MAX_IMAGE_SIZE_MB = 5

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

const normalizeImageRect = (
  img: ImageData,
  canvasWidth: number,
  canvasHeight: number,
): ImageData => {
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

const resolveImageRect = (
  img: ImageData,
  canvasWidth: number,
  canvasHeight: number,
): ImageData => {
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
  const height = clamp(
    img.heightRatio * canvasHeight,
    MIN_IMAGE_SIZE,
    canvasHeight,
  )
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
  const width = Math.min(Math.max(img.width, IMAGE_MIN_SIZE), rect.width - img.x)
  const height = Math.min(Math.max(img.height, IMAGE_MIN_SIZE), rect.height - img.y)
  const x = Math.min(Math.max(img.x, 0), rect.width - width)
  const y = Math.min(Math.max(img.y, 0), rect.height - height)
  return { ...img, x, y, width, height }
}

export default function InteractiveCanvas() {
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

  const musicObj = useStorage((root) => root.music) // peut tre null au dmarrage
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
  const imagesRef = useRef<ImageData[]>([])
  const localTransforms = useRef(new Map<string, Partial<ImageData>>())
  const renderFrame = useRef<number | null>(null)
  const lastMutation = useRef(0)

  const [ytUrl, setYtUrl] = useState('')
  const [ytId, setYtId] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)

  // Volume: gestion locale du volume (0..100), valeur par dfaut 30%
  const [volume, setVolumeState] = useState(30)
  const setVolume = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)))
    setVolumeState(clamped)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('canvas_volume', String(clamped))
    }
  }, [])

  const canvasRef = useRef<HTMLDivElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const initializedRef = useRef(false)
  const strokesRef = useRef<StrokeSegment[]>([])

  const t = useT()

  const redrawStrokes = useCallback(
    (explicitCtx?: CanvasRenderingContext2D | null) => {
      const ctx = explicitCtx ?? ctxRef.current
      const canvas = drawingCanvasRef.current
      if (!ctx || !canvas) return

      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()

      strokes.forEach((segment) => {
        ctx.beginPath()
        ctx.globalCompositeOperation =
          segment.mode === 'erase' ? 'destination-out' : 'source-over'
        ctx.strokeStyle =
          segment.mode === 'erase' ? 'rgba(0,0,0,1)' : segment.color
        ctx.lineWidth = segment.width
        ctx.moveTo(segment.x1, segment.y1)
        ctx.lineTo(segment.x2, segment.y2)
        ctx.stroke()
      })

      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath()
    },
    [strokes],
  )

  const updateCanvasMetrics = useCallback(() => {
    const container = canvasRef.current
    const canvas = drawingCanvasRef.current
    if (!container || !canvas) return null

    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))

    setCanvasSize({ width, height })

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctxRef.current = ctx
      redrawStrokes(ctx)
    }

    return rect
  }, [redrawStrokes])

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    segments.forEach((segment) => {
      ctx.strokeStyle = segment.mode === 'erase' ? 'rgba(0,0,0,1)' : segment.color
      ctx.lineWidth = segment.width
      ctx.globalCompositeOperation =
        segment.mode === 'erase' ? 'destination-out' : 'source-over'
      ctx.beginPath()
      ctx.moveTo(segment.x1, segment.y1)
      ctx.lineTo(segment.x2, segment.y2)
      ctx.stroke()
    })

    ctx.globalCompositeOperation = 'source-over'
  }, [])

  const updateCanvasMetrics = useCallback(() => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    setCanvasSize({ width: rect.width, height: rect.height })

    const canvas = drawingCanvasRef.current
    if (!canvas) return

    const width = Math.max(1, Math.round(rect.width))
    const height = Math.max(1, Math.round(rect.height))

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctxRef.current = ctx
    drawSegments(strokesRef.current)
  }, [drawSegments])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('canvas_volume')
    if (!stored) return
    const parsed = Number(stored)
    if (Number.isFinite(parsed)) {
      setVolumeState(Math.max(0, Math.min(100, Math.round(parsed))))
    }
  }, [])

  useEffect(() => {
    updateCanvasMetrics()
    window.addEventListener('resize', updateCanvasMetrics)
    window.addEventListener('orientationchange', updateCanvasMetrics)
    return () => {
      window.removeEventListener('resize', updateCanvasMetrics)
      window.removeEventListener('orientationchange', updateCanvasMetrics)
    }
  }, [updateCanvasMetrics])

  useEffect(() => () => {
    if (renderFrame.current) cancelAnimationFrame(renderFrame.current)
  }, [])

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

  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const t = useT()
  const initializedRef = useRef(false)
  const strokesRef = useRef<StrokeSegment[]>([])

  useEffect(() => {
    return () => {
      updateMyPresence({ cursor: null })
    }
  }, [updateMyPresence])

  useEffect(() => {
    strokesRef.current = strokes
  }, [strokes])

  useEffect(() => {
    redrawStrokes()
  }, [redrawStrokes])

  const addStrokeSegment = useMutation(
    ({ storage }, segment: StrokeSegment) => {
      const list = storage.get('strokes') as LiveList<StrokeSegment> | null
      if (!list) return
      if (typeof list.push === 'function') {
        list.push(segment)
      } else if (typeof (list as unknown as { insert?: (index: number, value: StrokeSegment) => void }).insert === 'function') {
        const helper = list as unknown as {
          insert: (index: number, value: StrokeSegment) => void
          length?: number
        }
        helper.insert((helper.length ?? 0) as number, segment)
      }
      strokesRef.current = [...strokesRef.current, segment]
      drawSegments(strokesRef.current)
    },
    [drawSegments],
  )

  const clearStrokes = useMutation(({ storage }) => {
    const list = storage.get('strokes') as LiveList<StrokeSegment> | null
    if (!list) {
      strokesRef.current = []
      drawSegments([])
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
    drawSegments([])
  }, [drawSegments])

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

  // Mutation musique: gre l'tat global (id, lecture, volume)
  const updateMusic = useMutation(
    (
      { storage },
      updates: { id?: string; playing?: boolean; volume?: number },
    ) => {
      storage.get('music').update(updates)
    },
    [],
  )

  useEventListener((payload: { event: unknown }) => {
    const { event } = payload as {
      event: { type: string; [key: string]: unknown }
    }
  })

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

  useEffect(() => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return
    canvas.style.zIndex = '2'
    canvas.style.pointerEvents = drawMode === 'images' ? 'none' : 'auto'
  }, [drawMode])

  const handleResize = useCallback(() => {
    const rect = updateCanvasMetrics() ?? canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const map = new Map<string, ImageData>()
    images.forEach((img) => map.set(String(img.id), img))
    imagesRef.current.forEach((img) => {
      const key = String(img.id)
      const stored = map.get(key)
      if (!stored) return
      const normalized = normalizeImageRect(
        { ...stored, ...img },
        rect.width,
        rect.height,
      )
      updateImageTransform(key, {
        x: normalized.x,
        y: normalized.y,
        width: normalized.width,
        height: normalized.height,
        xRatio: normalized.xRatio,
        yRatio: normalized.yRatio,
        widthRatio: normalized.widthRatio,
        heightRatio: normalized.heightRatio,
      })
    })
  }, [images, updateCanvasMetrics, updateImageTransform])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [handleResize])

  useEffect(() => {
    if (drawMode === 'erase') {
      setEraserSize((s) => Math.min(Math.max(s, ERASE_MIN), ERASE_MAX))
    } else {
      setPenSize((s) => Math.min(Math.max(s, DRAW_MIN), DRAW_MAX))
    }
  }, [drawMode, DRAW_MIN, DRAW_MAX, ERASE_MIN, ERASE_MAX])

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume)
    }
  }, [volume])

  // Lecture: contrle global (synchro via musicObj)
  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) player.playVideo()
    else player.pauseVideo()
  }, [isPlaying])

  // Quand ltat global musique change (depuis Liveblocks), on saligne
  useEffect(() => {
    if (!musicObj) return
    setYtId(musicObj.id ?? '')
    setIsPlaying(!!musicObj.playing)
    setVolumeState(musicObj.volume ?? 5)
  }, [musicObj])

  // --------- DnD images: aperu instantan + swap vers Cloudinary optimis ---------

  const uploadImage = useCallback(
    async (file: File, dropX: number, dropY: number, rect: DOMRect) => {
      if (
        !ALLOWED_IMAGE_TYPES.includes(file.type) ||
        file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024
      ) {
        alert('Invalid image file')
        return
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
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const baseImg: ImageData = {
      id: tempId,
      url: localUrl,
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
  }
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      await uploadImage(file, e.clientX - rect.left, e.clientY - rect.top, rect)
    }
  }

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  const handlePointerDown = (
    e: PointerEvent<Element>,
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

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })
    updateMyPresence({ cursor: { x, y } })

    if (drawMode !== 'draw' && drawMode !== 'erase' && isDrawing) {
      setIsDrawing(false)
    }

    if (
      isDrawing &&
      (drawMode === 'draw' || drawMode === 'erase') &&
      ctxRef.current
    ) {
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
        })
      }
      lastPointRef.current = { x, y }
    }

    const { id, type, offsetX, offsetY } = dragState.current
    if (!id || !type) return
    const stored = storedImageMap.get(id)
    const baseSource =
      localTransforms.current.get(id) ?? renderedImageMap.get(id)
    if (!stored || !baseSource) return

    const base = {
      ...baseSource,
      x: baseSource.x ?? stored.x ?? 0,
      y: baseSource.y ?? stored.y ?? 0,
      width: baseSource.width ?? stored.width ?? MIN_IMAGE_SIZE,
      height: baseSource.height ?? stored.height ?? MIN_IMAGE_SIZE,
    }
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
      const normalized = normalizeImageRect(
        { ...stored, ...clamped },
        rect.width,
        rect.height,
      )
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
    if (isDrawing) {
      const ctx = ctxRef.current
      if (ctx) {
        ctx.beginPath()
        ctx.globalCompositeOperation = 'source-over'
      }
    }
    setIsDrawing(false)
    if (ctxRef.current) {
      ctxRef.current.globalCompositeOperation = 'source-over'
      ctxRef.current.beginPath()
    }
    const { id } = dragState.current
    lastPointRef.current = null
    dragState.current = { id: null, type: null, offsetX: 0, offsetY: 0 }
    if (!id) return
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const stored = storedImageMap.get(id)
    const override = localTransforms.current.get(id)
    if (!stored || !override) return
    const normalized = normalizeImageRect(
      { ...stored, ...override },
      rect.width,
      rect.height,
    )
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

  const handlePointerLeave = () => {
    lastPointRef.current = null
    updateMyPresence({ cursor: null })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
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
      const stored = storedImageMap.get(selectedImageId)
      if (stored) {
        const normalized = normalizeImageRect(
          { ...stored, ...updated },
          rect.width,
          rect.height,
        )
        updateImageTransform(selectedImageId, {
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
  }

  const clearCanvas = () => {
    clearImages()
    clearStrokes()
    setPendingImages([])
    localTransforms.current.clear()
    const ctx = ctxRef.current
    if (ctx && drawingCanvasRef.current) {
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(
        0,
        0,
        drawingCanvasRef.current.width,
        drawingCanvasRef.current.height,
      )
      ctx.restore()
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath()
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

  const handleYtSubmit = () => {
    const match = ytUrl.match(/(?:youtube\.com.*v=|youtu\.be\/)([^&\n?#]+)/)
    if (match) {
      setYtId(match[1] ?? '') // local immdiat
      setIsPlaying(true)
      if (storageReady) {
        updateMusic({ id: nextId, playing: true })
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
            className="rounded-xl px-5 py-2 text-base font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-emerald-600 hover:text-white transition duration-100 flex items-center justify-center min-h-[38px] gap-2"
            aria-label={t('tools')}
          >
            <Wrench aria-hidden className="h-5 w-5" />
            {toolsVisible && <span className="text-sm">{t('tools')}</span>}
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
            aria-label={t('music')}
          >
            {isPlaying && (
              <span className="absolute inset-0 rounded-xl pointer-events-none animate-pulse-ring" />
            )}
            <Music aria-hidden className="relative h-5 w-5" />
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
        {/* Player YouTube (toujours mont pour conserver la lecture) */}
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

          {/* DiceHub supprim : les lancers de ds ne sont plus synchroniss globalement */}
        </div>{' '}
        {/*  fin du conteneur relatif */}
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

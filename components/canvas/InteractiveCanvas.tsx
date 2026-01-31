"use client"

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useStorage, useMutation, useMyPresence } from '@liveblocks/react'
import { LiveList } from '@liveblocks/client'
import CanvasTools, { ToolMode } from './CanvasTools'
import LiveCursors from './LiveCursors'
import ImageItem, { ImageRenderData } from './ImageItem'
import SideNotes from '@/components/misc/SideNotes'
import { useT } from '@/lib/useT'
import {
  extractUploadErrorInfo,
  uploadImageToCloudinary,
  UploadError,
} from '@/lib/uploadImage'

type StrokeSegment = {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  width: number
  mode: 'draw' | 'erase'
  space?: 'world' | 'px'
}

type StoredImageData = {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
  scale?: number
  rotation?: number
  createdAt?: number
  xRatio?: number
  yRatio?: number
  widthRatio?: number
  heightRatio?: number
}

type CanvasSize = { width: number; height: number }

const MIN_IMAGE_SIZE = 40
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const roundRatio = (v: number) => Math.round(v * 1000) / 1000

export default function InteractiveCanvas() {
  const t = useT()
  const isDev = process.env.NODE_ENV !== 'production'
  // Storage
  const imagesMap = useStorage((root) => root.images)
  const strokesList = useStorage((root) => root.strokes) as LiveList<StrokeSegment> | null
  const images = useMemo(() => (imagesMap ? Array.from(imagesMap.values()) as StoredImageData[] : []), [imagesMap])
  const strokes = useMemo<StrokeSegment[]>(() => {
    if (!strokesList) return []
    const anyList = strokesList as unknown as { toArray?: () => unknown; get?: (i: number) => unknown; length?: number }
    try {
      if (typeof anyList.toArray === 'function') {
        return (anyList.toArray() as unknown as StrokeSegment[]) || []
      }
    } catch {}
    const out: StrokeSegment[] = []
    if (typeof anyList.get === 'function' && typeof anyList.length === 'number') {
      for (let i = 0; i < (anyList.length ?? 0); i += 1) {
        const entry = anyList.get(i) as StrokeSegment | undefined
        if (entry) out.push(entry)
      }
      return out
    }
    if (Array.isArray(strokesList)) return strokesList as unknown as StrokeSegment[]
    return []
  }, [strokesList])
  const strokesRef = useRef<StrokeSegment[]>([])
  useEffect(() => { strokesRef.current = strokes }, [strokes])

  // Presence
  const [, updateMyPresence] = useMyPresence()
  useEffect(() => () => { updateMyPresence({ cursor: null }) }, [updateMyPresence])

  // Local state
  const canvasRef = useRef<HTMLDivElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const canvasSizeRef = useRef<CanvasSize>({ width: 0, height: 0 })
  const [drawMode, setDrawMode] = useState<ToolMode>('images')
  const [color, setColor] = useState('#ffffff')
  const [penSize, setPenSize] = useState(6)
  const [eraserSize, setEraserSize] = useState(24)
  const brushSize = drawMode === 'erase' ? eraserSize : penSize
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [toolsVisible, setToolsVisible] = useState(true)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Images helpers
  const [pendingImages, setPendingImages] = useState<ImageRenderData[]>([])
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [uploadDebug, setUploadDebug] = useState<string | null>(null)
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 })
  const [renderVersion, setRenderVersion] = useState(0)
  const renderRaf = useRef<number | null>(null)
  const scheduleRender = useCallback(() => {
    if (renderRaf.current !== null) return
    renderRaf.current = requestAnimationFrame(() => {
      renderRaf.current = null
      setRenderVersion((v) => v + 1)
    })
  }, [])
  const localTransforms = useRef(new Map<string, Partial<ImageRenderData>>())
  useEffect(() => () => { if (renderRaf.current !== null) cancelAnimationFrame(renderRaf.current) }, [])

  const resolveSize = useCallback((size?: CanvasSize) => {
    const current = size ?? canvasSizeRef.current
    return {
      width: current.width || canvasSize.width,
      height: current.height || canvasSize.height,
    }
  }, [canvasSize])
  const getMinDim = useCallback((size?: CanvasSize) => {
    const { width, height } = resolveSize(size)
    return Math.max(1, Math.min(width, height))
  }, [resolveSize])
  const screenToWorldPoint = useCallback((x: number, y: number, size?: CanvasSize) => {
    const { width, height } = resolveSize(size)
    return {
      x: width ? clamp01(x / width) : 0,
      y: height ? clamp01(y / height) : 0,
    }
  }, [resolveSize])
  const worldToScreenPoint = useCallback((x: number, y: number, size?: CanvasSize) => {
    const { width, height } = resolveSize(size)
    return {
      x: x * width,
      y: y * height,
    }
  }, [resolveSize])
  const screenToWorldSize = useCallback((w: number, h: number, size?: CanvasSize) => {
    const { width, height } = resolveSize(size)
    return {
      w: width ? w / width : 0,
      h: height ? h / height : 0,
    }
  }, [resolveSize])
  const worldToScreenSize = useCallback((w: number, h: number, size?: CanvasSize) => {
    const { width, height } = resolveSize(size)
    return {
      w: w * width,
      h: h * height,
    }
  }, [resolveSize])
  const screenToWorldStroke = useCallback((w: number, size?: CanvasSize) => w / getMinDim(size), [getMinDim])
  const resolveImageWorld = useCallback((img: StoredImageData, size?: CanvasSize) => {
    const hasWorld =
      Number.isFinite(img.x) &&
      Number.isFinite(img.y) &&
      Number.isFinite(img.width) &&
      Number.isFinite(img.height) &&
      img.x >= 0 &&
      img.y >= 0 &&
      img.width >= 0 &&
      img.height >= 0 &&
      img.x <= 1 &&
      img.y <= 1 &&
      img.width <= 1 &&
      img.height <= 1
    if (hasWorld) {
      return { x: img.x, y: img.y, width: img.width, height: img.height }
    }
    const hasRatio =
      Number.isFinite(img.xRatio) &&
      Number.isFinite(img.yRatio) &&
      Number.isFinite(img.widthRatio) &&
      Number.isFinite(img.heightRatio)
    if (hasRatio) {
      return {
        x: clamp01(img.xRatio ?? 0),
        y: clamp01(img.yRatio ?? 0),
        width: clamp01(img.widthRatio ?? 0),
        height: clamp01(img.heightRatio ?? 0),
      }
    }
    const { width, height } = resolveSize(size)
    const safeX = Number.isFinite(img.x) ? img.x : 0
    const safeY = Number.isFinite(img.y) ? img.y : 0
    const safeW = Number.isFinite(img.width) ? img.width : 0
    const safeH = Number.isFinite(img.height) ? img.height : 0
    return {
      x: width ? clamp01(safeX / width) : 0,
      y: height ? clamp01(safeY / height) : 0,
      width: width ? clamp01(safeW / width) : 0,
      height: height ? clamp01(safeH / height) : 0,
    }
  }, [resolveSize])

  const imagesToRender = useMemo<ImageRenderData[]>(() => {
    void renderVersion
    const size = resolveSize()
    const minWorldW = size.width ? MIN_IMAGE_SIZE / size.width : 0
    const minWorldH = size.height ? MIN_IMAGE_SIZE / size.height : 0
    return images.map((img) => {
      const key = String(img.id)
      const world = resolveImageWorld(img, size)
      const wWorld = clamp(world.width, minWorldW, 1)
      const hWorld = clamp(world.height, minWorldH, 1)
      const xWorld = clamp(world.x, 0, Math.max(0, 1 - wWorld))
      const yWorld = clamp(world.y, 0, Math.max(0, 1 - hWorld))
      let { w, h } = worldToScreenSize(wWorld, hWorld, size)
      let { x, y } = worldToScreenPoint(xWorld, yWorld, size)
      const overrides = localTransforms.current.get(key)
      if (overrides) {
        x = overrides.x ?? x
        y = overrides.y ?? y
        w = overrides.width ?? w
        h = overrides.height ?? h
      }
      if (size.width || size.height) {
        w = clamp(w, MIN_IMAGE_SIZE, size.width || w)
        h = clamp(h, MIN_IMAGE_SIZE, size.height || h)
        x = clamp(x, 0, Math.max(0, (size.width || x + w) - w))
        y = clamp(y, 0, Math.max(0, (size.height || y + h) - h))
      }
      return {
        ...img,
        x,
        y,
        width: w,
        height: h,
      }
    })
  }, [images, canvasSize, renderVersion, resolveSize, resolveImageWorld, worldToScreenSize, worldToScreenPoint])

  const renderedImageMap = useMemo(() => {
    const map = new Map<string, ImageRenderData>()
    imagesToRender.forEach((img) => map.set(String(img.id), img))
    return map
  }, [imagesToRender])

  // Keep transforms map in sync
  useEffect(() => {
    const ids = new Set(images.map((i) => String(i.id)))
    const transforms = localTransforms.current
    let changed = false
    for (const key of Array.from(transforms.keys())) {
      if (!ids.has(key)) { transforms.delete(key); changed = true }
    }
    if (changed) scheduleRender()
  }, [images, scheduleRender])

  // Mutations
  const addImage = useMutation(({ storage }, img: StoredImageData) => {
    const imagesMap = storage.get('images') as unknown as {
      set: (key: string, value: StoredImageData) => void
    }
    imagesMap.set(String(img.id), img)
  }, [])
  const updateImageTransform = useMutation(({ storage }, id: string, patch: Partial<StoredImageData>) => {
    const map = storage.get('images') as unknown as {
      get: (key: string) => StoredImageData | undefined
      set: (key: string, value: StoredImageData) => void
    }
    const prev = map.get(id)
    if (!prev) return
    map.set(id, { ...prev, ...patch })
  }, [])
  const deleteImage = useMutation(({ storage }, id: string) => {
    const map = storage.get('images') as unknown as { delete: (key: string) => void }
    map.delete(id)
  }, [])
  const addStrokeSegment = useMutation(({ storage }, segment: StrokeSegment) => {
    let list = storage.get('strokes') as unknown
    const hasPush = !!(list && typeof (list as { push?: unknown }).push === 'function')
    const hasInsert = !!(list && typeof (list as { insert?: unknown }).insert === 'function')
    if (!list || (!hasPush && !hasInsert)) {
      storage.set('strokes', new LiveList<StrokeSegment>([]))
      list = storage.get('strokes') as unknown
    }
    if (typeof (list as { push?: (v: StrokeSegment) => void }).push === 'function') {
      ;(list as { push: (v: StrokeSegment) => void }).push(segment)
    } else if (typeof (list as { insert?: (i: number, v: StrokeSegment) => void; length?: number }).insert === 'function') {
      const helper = list as { insert: (i: number, v: StrokeSegment) => void; length?: number }
      helper.insert((helper.length ?? 0) as number, segment)
    }
  }, [])
  const clearStrokes = useMutation(({ storage }) => {
    const list = storage.get('strokes') as unknown
    if (!list) return
    if (typeof (list as { clear?: () => void }).clear === 'function') {
      ;(list as { clear: () => void }).clear()
      return
    }
    if (typeof (list as { delete?: (idx: number) => void; length?: number }).delete === 'function') {
      const helper = list as { delete: (idx: number) => void; length?: number }
      for (let i = (helper.length ?? 0) - 1; i >= 0; i -= 1) helper.delete(i)
      return
    }
    // As a fallback, reset the list
    storage.set('strokes', new LiveList<StrokeSegment>([]))
  }, [])
  // Drawing handlers
  const drawStrokeSegment = useCallback(
    (ctx: CanvasRenderingContext2D, s: StrokeSegment, sizeOverride?: CanvasSize) => {
      const size = sizeOverride ?? canvasSizeRef.current
      if (!size.width || !size.height) return
      const isWorld =
        s.space === 'world' ||
        (s.x1 >= 0 && s.x1 <= 1 && s.y1 >= 0 && s.y1 <= 1 && s.x2 >= 0 && s.x2 <= 1 && s.y2 >= 0 && s.y2 <= 1)
      const x1 = isWorld ? s.x1 * size.width : s.x1
      const y1 = isWorld ? s.y1 * size.height : s.y1
      const x2 = isWorld ? s.x2 * size.width : s.x2
      const y2 = isWorld ? s.y2 * size.height : s.y2
      const minDim = Math.max(1, Math.min(size.width, size.height))
      const lineWidth = isWorld ? s.width * minDim : s.width
      ctx.save()
      ctx.strokeStyle = s.mode === 'erase' ? 'rgba(0,0,0,1)' : s.color
      ctx.lineWidth = lineWidth
      ctx.globalCompositeOperation = s.mode === 'erase' ? 'destination-out' : 'source-over'
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
      ctx.restore()
    },
    [],
  )
  const resizeCanvas = useCallback(() => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const ratio = window.devicePixelRatio || 1
    const canvas = drawingCanvasRef.current!
    canvas.width = Math.max(1, Math.floor(rect.width * ratio))
    canvas.height = Math.max(1, Math.floor(rect.height * ratio))
    const nextSize = { width: rect.width, height: rect.height }
    canvasSizeRef.current = nextSize
    setCanvasSize(nextSize)
    const ctx = canvas.getContext('2d')!
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctxRef.current = ctx
    ctx.clearRect(0, 0, rect.width, rect.height)
    strokesRef.current.forEach((s) => drawStrokeSegment(ctx, s, nextSize))
  }, [drawStrokeSegment])

  useEffect(() => {
    resizeCanvas()
    const onResize = () => resizeCanvas()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => resizeCanvas()) : null
    if (observer && canvasRef.current) observer.observe(canvasRef.current)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      if (observer) observer.disconnect()
    }
  }, [resizeCanvas])

  useEffect(() => {
    const ctx = ctxRef.current
    const size = canvasSizeRef.current
    if (!ctx || !size.width || !size.height) return
    ctx.clearRect(0, 0, size.width, size.height)
    strokes.forEach((s) => drawStrokeSegment(ctx, s, size))
  }, [strokes, drawStrokeSegment])
  const handlePointerDown = (e: React.PointerEvent, id?: string, type?: 'move' | 'resize') => {
    e.preventDefault()
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const world = screenToWorldPoint(x, y, { width: rect.width, height: rect.height })
    if ((drawMode === 'draw' || drawMode === 'erase') && !id) {
      setIsDrawing(true)
      setMousePos({ x, y })
      lastPointRef.current = world
      const ctx = ctxRef.current
      if (ctx) { ctx.strokeStyle = drawMode === 'erase' ? 'rgba(0,0,0,1)' : color; ctx.lineWidth = brushSize; ctx.globalCompositeOperation = drawMode === 'erase' ? 'destination-out' : 'source-over'; ctx.beginPath(); ctx.moveTo(x, y) }
      return
    }
    if (drawMode === 'images' && id && type) {
      const key = String(id)
      const img = renderedImageMap.get(key)
      if (!img) return
      dragState.current = { id: key, type, offsetX: x - img.x, offsetY: y - img.y }
      localTransforms.current.set(key, { x: img.x, y: img.y, width: img.width, height: img.height })
      scheduleRender()
      setSelectedImageId(key)
    }
  }
  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const world = screenToWorldPoint(x, y, { width: rect.width, height: rect.height })
    const pos = { x, y }
    if (drawMode === 'draw' || drawMode === 'erase') setMousePos(pos)
    updateMyPresence({ cursor: world })
    if ((drawMode === 'draw' || drawMode === 'erase') && isDrawing && lastPointRef.current) {
      const prev = lastPointRef.current
      const seg: StrokeSegment = {
        id: crypto.randomUUID(),
        x1: prev.x,
        y1: prev.y,
        x2: world.x,
        y2: world.y,
        color,
        width: screenToWorldStroke(brushSize, { width: rect.width, height: rect.height }),
        mode: drawMode,
        space: 'world',
      }
      const ctx = ctxRef.current
      if (ctx) drawStrokeSegment(ctx, seg, { width: rect.width, height: rect.height })
      addStrokeSegment(seg)
      lastPointRef.current = world
    }
    if (drawMode === 'images' && dragState.current.id) {
      const key = dragState.current.id
      const img = localTransforms.current.get(key)
      if (!img) return
      if (dragState.current.type === 'move') {
        const nx = clamp(x - dragState.current.offsetX, 0, Math.max(0, canvasSize.width - (img.width ?? 0)))
        const ny = clamp(y - dragState.current.offsetY, 0, Math.max(0, canvasSize.height - (img.height ?? 0)))
        localTransforms.current.set(key, { ...img, x: nx, y: ny })
      } else {
        const w = clamp(x - (img.x ?? 0), MIN_IMAGE_SIZE, canvasSize.width)
        const h = clamp(y - (img.y ?? 0), MIN_IMAGE_SIZE, canvasSize.height)
        localTransforms.current.set(key, { ...img, width: w, height: h })
      }
      scheduleRender()
    }
  }
  const handlePointerUp = () => {
    if ((drawMode === 'draw' || drawMode === 'erase') && isDrawing) { setIsDrawing(false); lastPointRef.current = null }
    if (drawMode === 'images' && dragState.current.id) {
      const key = dragState.current.id
      const img = localTransforms.current.get(key)
      localTransforms.current.delete(key)
      scheduleRender()
      dragState.current = { id: null, type: null, offsetX: 0, offsetY: 0 }
      if (img) {
        const size = resolveSize()
        const minWorldW = size.width ? MIN_IMAGE_SIZE / size.width : 0
        const minWorldH = size.height ? MIN_IMAGE_SIZE / size.height : 0
        const rawWorldX = size.width ? img.x! / size.width : 0
        const rawWorldY = size.height ? img.y! / size.height : 0
        const rawWorldW = size.width ? img.width! / size.width : 0
        const rawWorldH = size.height ? img.height! / size.height : 0
        const widthWorld = clamp(rawWorldW, minWorldW, 1)
        const heightWorld = clamp(rawWorldH, minWorldH, 1)
        const xWorld = clamp(rawWorldX, 0, Math.max(0, 1 - widthWorld))
        const yWorld = clamp(rawWorldY, 0, Math.max(0, 1 - heightWorld))
        const patch: Partial<StoredImageData> = {
          x: roundRatio(xWorld),
          y: roundRatio(yWorld),
          width: roundRatio(widthWorld),
          height: roundRatio(heightWorld),
        }
        updateImageTransform(key, patch)
      }
      setSelectedImageId(null)
    }
  }
  const handlePointerLeave = () => { if (isDrawing) handlePointerUp() }
  const handleKeyDown = (e: React.KeyboardEvent) => { if ((e.key === 'Delete' || e.key === 'Backspace') && selectedImageId) deleteImage(selectedImageId) }

  const handleDeleteImage = (id: string) => deleteImage(id)
  const handleImageError = (id: string) => deleteImage(id)

  // Upload helpers
  const fileToObjectURL = (file: File) => URL.createObjectURL(file)
  const resetUploadFeedback = useCallback(() => {
    setUploadMessage(null)
    setUploadDebug(null)
  }, [])
  const handleUploadError = useCallback(
    (error: unknown) => {
      const info = extractUploadErrorInfo(error)
      setUploadMessage(info.userMessage)
      const debugParts: string[] = []
      if (info.step) debugParts.push(info.step)
      if (info.code) debugParts.push(info.code)
      const debugMessage = debugParts.length ? debugParts.join(' | ') : null
      setUploadDebug(isDev ? debugMessage : null)
      if (isDev) {
        console.error('Image upload failed', error, info.details ?? info)
      }
    },
    [isDev],
  )
  async function uploadOneImage(file: File, dropX: number, dropY: number, rect: { width: number; height: number }) {
    resetUploadFeedback()
    const localUrl = fileToObjectURL(file)
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const baseSize = 200
    const worldDrop = screenToWorldPoint(dropX, dropY, rect)
    const baseWorldSize = screenToWorldSize(baseSize, baseSize, rect)
    const minWorldW = rect.width ? MIN_IMAGE_SIZE / rect.width : 0
    const minWorldH = rect.height ? MIN_IMAGE_SIZE / rect.height : 0
    const baseWidthWorld = clamp(baseWorldSize.w, minWorldW, 1)
    const baseHeightWorld = clamp(baseWorldSize.h, minWorldH, 1)
    const baseXWorld = clamp(worldDrop.x - baseWidthWorld / 2, 0, Math.max(0, 1 - baseWidthWorld))
    const baseYWorld = clamp(worldDrop.y - baseHeightWorld / 2, 0, Math.max(0, 1 - baseHeightWorld))
    const baseImgWorld: StoredImageData = {
      id: tempId,
      url: localUrl,
      x: baseXWorld,
      y: baseYWorld,
      width: baseWidthWorld,
      height: baseHeightWorld,
    }
    const baseImgRender: ImageRenderData = {
      id: tempId,
      url: localUrl,
      x: dropX - baseSize / 2,
      y: dropY - baseSize / 2,
      width: baseSize,
      height: baseSize,
    }
    setPendingImages((prev) => [...prev, baseImgRender])
    try {
      const uploadResult = await uploadImageToCloudinary(file)
      const finalUrl = uploadResult.deliveryUrl ?? uploadResult.url
      const uploadWorldSize = screenToWorldSize(
        uploadResult.width ?? baseSize,
        uploadResult.height ?? baseSize,
        rect,
      )
      const widthWorld = clamp(uploadWorldSize.w, minWorldW, 1)
      const heightWorld = clamp(uploadWorldSize.h, minWorldH, 1)
      const normalized: StoredImageData = {
        ...baseImgWorld,
        url: finalUrl,
        width: widthWorld,
        height: heightWorld,
        x: clamp(baseImgWorld.x, 0, Math.max(0, 1 - widthWorld)),
        y: clamp(baseImgWorld.y, 0, Math.max(0, 1 - heightWorld)),
        createdAt: Date.now(),
      }
      try {
        addImage(normalized)
        resetUploadFeedback()
      } catch (integrationError) {
        const message =
          integrationError instanceof Error ? integrationError.message : 'Integration failed'
        throw new UploadError({
          code: 'POST_UPLOAD_FAILED',
          step: 'POST_UPLOAD',
          userMessage: "Impossible d'ajouter l'image au canvas.",
          details: { message },
        })
      }
    } catch (error) {
      handleUploadError(error)
    } finally {
      setPendingImages((prev) => prev.filter((i) => i.id !== tempId))
      URL.revokeObjectURL(localUrl)
    }
  }
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      await uploadOneImage(file, e.clientX - rect.left, e.clientY - rect.top, rect)
    }
  }

  // Drag state
  const dragState = useRef({ id: null as string | null, type: null as 'move' | 'resize' | null, offsetX: 0, offsetY: 0 })
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)

  // Brush limits + canvas interactivity
  useEffect(() => {
    if (drawMode === 'erase') setEraserSize((s) => Math.min(Math.max(s, 8), 200))
    else setPenSize((s) => Math.min(Math.max(s, 2), 50))
    const canvas = drawingCanvasRef.current
    if (canvas) { canvas.style.zIndex = '2'; canvas.style.pointerEvents = drawMode === 'images' ? 'none' : 'auto' }
  }, [drawMode])

  return (
    <>
      <div className="relative w-full h-full select-none">
        {/* Tools */}
        <div className="absolute top-3 left-3 z-30 pointer-events-auto">
          <button onClick={() => setToolsVisible(!toolsVisible)} className="rounded-xl px-5 py-2 text-base font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-emerald-600 hover:text-white transition duration-100 flex items-center justify-center min-h-[38px]">
            <span className="text-sm">{t('tools')}</span>
          </button>
        </div>
        {uploadMessage && (
          <div className="absolute top-3 right-3 z-40 max-w-sm pointer-events-auto rounded-xl bg-black/80 text-white px-4 py-3 shadow-lg border border-white/10 backdrop-blur-sm">
            <p className="text-sm font-semibold leading-snug">{uploadMessage}</p>
            {isDev && uploadDebug && (
              <p className="mt-1 text-xs text-amber-100/80">[{uploadDebug}]</p>
            )}
          </div>
        )}
        {toolsVisible && (
          <div className="absolute top-3 left-36 z-30 origin-top-left pointer-events-auto">
            <CanvasTools drawMode={drawMode} setDrawMode={setDrawMode} color={color} setColor={setColor} brushSize={brushSize} setPenSize={setPenSize} setEraserSize={setEraserSize} clearCanvas={clearStrokes} onAddImage={() => imageInputRef.current?.click()} />
          </div>
        )}
        {/* Surface */}
        <div ref={canvasRef} tabIndex={0} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerLeave} onKeyDown={handleKeyDown} onWheel={(e) => e.preventDefault()} className="w-full h-full relative overflow-hidden z-0 touch-none" style={{ background: 'none', border: 'none', borderRadius: 0 }}>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; e.currentTarget.value = ''; if (!file) return; const rect = drawingCanvasRef.current?.getBoundingClientRect(); if (!rect) return; await uploadOneImage(file, rect.width / 2, rect.height / 2, rect) }} />
          <canvas ref={drawingCanvasRef} className="absolute top-0 left-0 w-full h-full" />
          {pendingImages.map((img) => (
            <div key={`pending-${img.id}`} className="absolute rounded-2xl border border-dashed border-white/30 bg-black/30 pointer-events-none animate-pulse" style={{ top: img.y, left: img.x, width: img.width, height: img.height, zIndex: 2 }}>
              <img src={img.url} alt="Upload" className="w-full h-full object-contain rounded-2xl opacity-80" />
            </div>
          ))}
          {imagesToRender.map((img) => (
            <ImageItem key={img.id} img={img} drawMode={drawMode} onPointerDown={handlePointerDown} onDelete={handleDeleteImage} onError={handleImageError} pending={pendingImages.some((p) => p.id === img.id)} />
          ))}
          {(drawMode === 'draw' || drawMode === 'erase') && !dragState.current.id && (
            <div className="absolute rounded-full border border-emerald-500 pointer-events-none" style={{ top: mousePos.y - brushSize / 2, left: mousePos.x - brushSize / 2, width: brushSize, height: brushSize, zIndex: 2 }} />
          )}
          <LiveCursors canvasSize={canvasSize} />
          <SideNotes />
        </div>
      </div>
    </>
  )
}

"use client"

import { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { useStorage, useMutation, useMyPresence } from '@liveblocks/react'
import type { LiveList } from '@liveblocks/client'
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
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const roundRatio = (v: number) => Math.round(v * 1000) / 1000

export default function InteractiveCanvas() {
  const t = useT()
  // Storage
  const imagesMap = useStorage((root) => root.images)
  const strokesList = useStorage((root) => root.strokes) as LiveList<StrokeSegment> | null
  const musicObj = useStorage((root) => root.music)
  const storageReady = !!imagesMap && !!strokesList

  const images = useMemo(() => (imagesMap ? Array.from(imagesMap.values()) as ImageData[] : []), [imagesMap])
  const strokes = useMemo<StrokeSegment[]>(() => {
    if (!strokesList) return []
    const out: StrokeSegment[] = []
    for (let i = 0; i < (strokesList.length ?? 0); i += 1) {
      const entry = (strokesList as unknown as { get: (idx: number) => StrokeSegment | undefined }).get(i)
      if (entry) out.push(entry)
    }
    return out
  }, [strokesList])

  // Presence
  const [, updateMyPresence] = useMyPresence()
  useEffect(() => () => { updateMyPresence({ cursor: null }) }, [updateMyPresence])

  // Local state
  const canvasRef = useRef<HTMLDivElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const [drawMode, setDrawMode] = useState<ToolMode>('images')
  const [color, setColor] = useState('#ffffff')
  const [penSize, setPenSize] = useState(6)
  const [eraserSize, setEraserSize] = useState(24)
  const brushSize = drawMode === 'erase' ? eraserSize : penSize
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [isDrawing, setIsDrawing] = useState(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [toolsVisible, setToolsVisible] = useState(true)
  const [audioVisible, setAudioVisible] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Music state
  const [ytUrl, setYtUrl] = useState('')
  const [ytId, setYtId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(50)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const initializedRef = useRef(false)

  // Images helpers
  const [pendingImages, setPendingImages] = useState<ImageData[]>([])
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [renderVersion, setRenderVersion] = useState(0)
  const scheduleRender = useCallback(() => setRenderVersion((v) => v + 1), [])
  const localTransforms = useRef(new Map<string, Partial<ImageData>>())
  const imagesRef = useRef<ImageData[]>([])

  const imagesToRender = useMemo(() => {
    void renderVersion
    return images.map((img) => {
      const key = String(img.id)
      const overrides = localTransforms.current.get(key)
      const merged = overrides ? { ...img, ...overrides } : img
      const w = clamp(merged.width, MIN_IMAGE_SIZE, canvasSize.width || merged.width)
      const h = clamp(merged.height, MIN_IMAGE_SIZE, canvasSize.height || merged.height)
      const x = clamp(merged.x, 0, Math.max(0, (canvasSize.width || merged.x + w) - w))
      const y = clamp(merged.y, 0, Math.max(0, (canvasSize.height || merged.y + h) - h))
      return {
        ...merged,
        x,
        y,
        width: w,
        height: h,
        xRatio: canvasSize.width ? roundRatio(x / canvasSize.width) : merged.xRatio,
        yRatio: canvasSize.height ? roundRatio(y / canvasSize.height) : merged.yRatio,
        widthRatio: canvasSize.width ? roundRatio(w / canvasSize.width) : merged.widthRatio,
        heightRatio: canvasSize.height ? roundRatio(h / canvasSize.height) : merged.heightRatio,
      }
    })
  }, [images, canvasSize, renderVersion])
  imagesRef.current = imagesToRender

  const renderedImageMap = useMemo(() => {
    const map = new Map<string, ImageData>()
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

  // Canvas sizing + redraw
  useEffect(() => {
    const handleResize = () => {
      const rect = drawingCanvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const ratio = window.devicePixelRatio || 1
      const canvas = drawingCanvasRef.current!
      canvas.width = Math.max(1, Math.floor(rect.width * ratio))
      canvas.height = Math.max(1, Math.floor(rect.height * ratio))
      setCanvasSize({ width: rect.width, height: rect.height })
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctxRef.current = ctx
      ctx.clearRect(0, 0, rect.width, rect.height)
      strokes.forEach((s) => drawStrokeSegment(ctx, s))
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [strokes])

  useEffect(() => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    const ctx = ctxRef.current
    if (!rect || !ctx) return
    ctx.clearRect(0, 0, rect.width, rect.height)
    strokes.forEach((s) => drawStrokeSegment(ctx, s))
  }, [strokes])

  // Mutations
  const addImage = useMutation(({ storage }, img: ImageData) => {
    // @ts-expect-error Liveblocks Lson typing vs runtime value
    storage.get('images').set(String(img.id), img)
  }, [])
  const updateImageTransform = useMutation(({ storage }, id: string, patch: Partial<ImageData>) => {
    // @ts-expect-error Liveblocks Lson typing vs runtime value
    const map = storage.get('images')
    const prev = map.get(id) as ImageData | undefined
    if (!prev) return
    map.set(id, { ...prev, ...patch })
  }, [])
  const deleteImage = useMutation(({ storage }, id: string) => {
    // @ts-expect-error Liveblocks Lson typing vs runtime value
    storage.get('images').delete(id)
  }, [])
  const addStrokeSegment = useMutation(({ storage }, segment: StrokeSegment) => {
    const list = storage.get('strokes') as LiveList<StrokeSegment> | null
    if (!list) return
    if (typeof list.push === 'function') list.push(segment)
    else { const helper = list as unknown as { insert: (idx: number, value: StrokeSegment) => void, length?: number }; helper.insert((helper.length ?? 0) as number, segment) }
  }, [])
  const clearStrokes = useMutation(({ storage }) => {
    const list = storage.get('strokes') as LiveList<StrokeSegment> | null
    if (!list) return
    if (typeof list.clear === 'function') list.clear()
    else if (typeof list.delete === 'function') { for (let i = (list.length ?? 0) - 1; i >= 0; i -= 1) { /* @ts-expect-error Liveblocks delete signature */ list.delete(i) } }
  }, [])
  const updateMusic = useMutation(({ storage }, patch: Partial<{ id: string; playing: boolean; volume: number }>) => {
    // @ts-expect-error Liveblocks Lson typing vs runtime value
    const obj = storage.get('music')
    Object.entries(patch).forEach(([k, v]) => { obj.set(k, v as never) })
  }, [])

  // Drawing handlers
  const drawStrokeSegment = (ctx: CanvasRenderingContext2D, s: StrokeSegment) => {
    ctx.save()
    ctx.strokeStyle = s.mode === 'erase' ? 'rgba(0,0,0,1)' : s.color
    ctx.lineWidth = s.width
    ctx.globalCompositeOperation = s.mode === 'erase' ? 'destination-out' : 'source-over'
    ctx.beginPath()
    ctx.moveTo(s.x1, s.y1)
    ctx.lineTo(s.x2, s.y2)
    ctx.stroke()
    ctx.restore()
  }
  const handlePointerDown = (e: React.PointerEvent, id?: string, type?: 'move' | 'resize') => {
    e.preventDefault()
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if ((drawMode === 'draw' || drawMode === 'erase') && !id) {
      setIsDrawing(true)
      setMousePos({ x, y })
      lastPointRef.current = { x, y }
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
    setMousePos({ x, y })
    updateMyPresence({ cursor: { x, y } })
    if ((drawMode === 'draw' || drawMode === 'erase') && isDrawing && lastPointRef.current) {
      const prev = lastPointRef.current
      const seg: StrokeSegment = { id: crypto.randomUUID(), x1: prev.x, y1: prev.y, x2: x, y2: y, color, width: brushSize, mode: drawMode }
      const ctx = ctxRef.current
      if (ctx) drawStrokeSegment(ctx, seg)
      addStrokeSegment(seg)
      lastPointRef.current = { x, y }
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
        const patch: Partial<ImageData> = {
          x: img.x!, y: img.y!, width: img.width!, height: img.height!,
          xRatio: roundRatio((img.x! / (canvasSize.width || 1))),
          yRatio: roundRatio((img.y! / (canvasSize.height || 1))),
          widthRatio: roundRatio((img.width! / (canvasSize.width || 1))),
          heightRatio: roundRatio((img.height! / (canvasSize.height || 1))),
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
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const MAX_SIZE_MB = 20
  const fileToObjectURL = (file: File) => URL.createObjectURL(file)
  async function uploadOneImage(file: File, dropX: number, dropY: number) {
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE_MB * 1024 * 1024) { alert('Invalid image file'); return }
    const localUrl = fileToObjectURL(file)
    const tempId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const baseImg: ImageData = { id: tempId, url: localUrl, x: dropX - 100, y: dropY - 100, width: 200, height: 200 }
    setPendingImages((prev) => [...prev, baseImg])
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('upload_preset', 'cakejdr-images')
      const res = await fetch('/api/cloudinary', { method: 'POST', body: form })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data) throw new Error(data?.error || 'Upload failed')
      const finalUrl: string = data.deliveryUrl || data.url
      if (!finalUrl) throw new Error('No URL returned by Cloudinary endpoint')
      const normalized = { ...baseImg, url: finalUrl, createdAt: Date.now() }
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
    const rect = drawingCanvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const files = Array.from(e.dataTransfer.files)
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      await uploadOneImage(,,)
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

  // Music sync from storage
  useEffect(() => { if (!musicObj) return; setYtId(musicObj.id); setIsPlaying(!!musicObj.playing); setVolumeState(musicObj.volume ?? 50) }, [musicObj])
  const handleYtSubmit = () => { const match = ytUrl.match(/(?:youtube\.com.*v=|youtu\.be\/)([^&\n?#]+)/); if (!match) return; const id = match[1] ?? ''; setYtId(id); setIsPlaying(true); if (storageReady) updateMusic({ id, playing: true }) }
  const handlePlayPause = () => { const p = playerRef.current; if (!p) return; if (isPlaying) p.pauseVideo(); else p.playVideo(); const newPlaying = !isPlaying; setIsPlaying(newPlaying); if (storageReady) updateMusic({ playing: newPlaying }) }
  useEffect(() => { playerRef.current?.setVolume(volume) }, [volume])
  useEffect(() => { const p = playerRef.current; if (!p) return; if (isPlaying) p.playVideo(); else p.pauseVideo() }, [isPlaying])

  return (
    <>
      <div className="relative w-full h-full select-none">
        {/* Tools */}
        <div className="absolute top-3 left-3 z-30 pointer-events-auto">
          <button onClick={() => setToolsVisible(!toolsVisible)} className="rounded-xl px-5 py-2 text-base font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-emerald-600 hover:text-white transition duration-100 flex items-center justify-center min-h-[38px]">
            <span className="text-sm">{t('tools')}</span>
          </button>
        </div>
        {toolsVisible && (
          <div className="absolute top-3 left-36 z-30 origin-top-left pointer-events-auto">
            <CanvasTools drawMode={drawMode} setDrawMode={setDrawMode} color={color} setColor={setColor} brushSize={brushSize} setPenSize={setPenSize} setEraserSize={setEraserSize} clearCanvas={clearStrokes} onAddImage={() => imageInputRef.current?.click()} />
          </div>
        )}
        {/* Music */}
        <div className="absolute bottom-3 right-3 z-30 pointer-events-auto">
          <button onClick={() => setAudioVisible(!audioVisible)} className="relative rounded-xl px-5 py-2 text-base font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-purple-600 hover:text-white transition duration-100 flex items-center justify-center min-h-[38px]">
            {isPlaying && (<span className="absolute inset-0 rounded-xl pointer-events-none animate-pulse-ring" />)}
            <span className="relative">Musique</span>
          </button>
        </div>
        {audioVisible && (<MusicPanel ytUrl={ytUrl} setYtUrl={setYtUrl} isPlaying={isPlaying} handleSubmit={handleYtSubmit} handlePlayPause={handlePlayPause} volume={volume} setVolume={setVolumeState} />)}
        {ytId && (
          <YouTube videoId={ytId} opts={{ height: '0', width: '0', playerVars: { autoplay: 0, rel: 0, playsinline: 1 } }} onReady={(e) => { playerRef.current = e.target; if (!initializedRef.current) initializedRef.current = true; e.target.setVolume(volume); if (isPlaying) e.target.playVideo(); else e.target.pauseVideo() }} />
        )}

        {/* Surface */}
        <div ref={canvasRef} tabIndex={0} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerLeave} onKeyDown={handleKeyDown} onWheel={(e) => e.preventDefault()} className="w-full h-full relative overflow-hidden z-0 touch-none" style={{ background: 'none', border: 'none', borderRadius: 0 }}>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const file = e.target.files?.[0]; e.currentTarget.value = ''; if (!file) return; const rect = drawingCanvasRef.current?.getBoundingClientRect(); if (!rect) return; await uploadOneImage(,,) }} />
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
          <LiveCursors />
          <SideNotes />
        </div>
      </div>
      <style jsx>{`
        @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.6);} 70% { box-shadow: 0 0 0 12px rgba(168, 85, 247, 0);} 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0);} }
        .animate-pulse-ring { animation: pulseRing 1.6s cubic-bezier(0.4,0,0.6,1) infinite; }
      `}</style>
    </>
  )
}


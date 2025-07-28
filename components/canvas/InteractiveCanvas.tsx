'use client'

import { useRef, useState, useEffect } from 'react'
import { useBroadcastEvent, useEventListener, useStorage, useMutation, useMyPresence } from '@liveblocks/react'
import LiveCursors from './LiveCursors'
import YouTube from 'react-youtube'
import type { YouTubePlayer } from 'youtube-player/dist/types'
import CanvasTools, { ToolMode } from './CanvasTools'
import MusicPanel from './MusicPanel'
import ImageItem, { ImageData } from './ImageItem'

export default function InteractiveCanvas() {
  // `images` map is created by RoomProvider but may be null until ready
  const imagesMap = useStorage(root => root.images)
  const images = imagesMap ? (Array.from(imagesMap.values()) as ImageData[]) : []
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawMode, setDrawMode] = useState<ToolMode>('images')
  const [color, setColor] = useState('#000000')
  const [penSize, setPenSize] = useState(10)
  const [eraserSize, setEraserSize] = useState(20)
  const brushSize = drawMode === 'erase' ? eraserSize : penSize
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [toolsVisible, setToolsVisible] = useState(false)
  const [audioVisible, setAudioVisible] = useState(false)
  const musicObj = useStorage(root => root.music)
  const [ytUrl, setYtUrl] = useState('')
  const [ytId, setYtId] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(5)

  const broadcast = useBroadcastEvent()
  const lastSend = useRef(0)
  const THROTTLE = 0
  const [, updateMyPresence] = useMyPresence()

  const canvasRef = useRef<HTMLDivElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const v = localStorage.getItem('ytVolume')
    if (v) setVolume(parseInt(v, 10))
    else localStorage.setItem('ytVolume', '5')
    const p = localStorage.getItem('ytPlaying')
    if (p === 'false') setIsPlaying(false)
    else if (p === 'true') setIsPlaying(true)
  }, [])

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

  const updateMusic = useMutation(({ storage }, updates: { id?: string; playing?: boolean }) => {
    const m = storage.get('music')
    m.update(updates)
  }, [])

  // Listen to incoming canvas events
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useEventListener((payload: any) => {
    const { event } = payload
    if (event.type === 'clear-canvas') {
      // On efface localement sans re-broadcaster pour éviter une boucle
      clearCanvas(false)
    } else if (event.type === 'draw-line' && ctxRef.current) {
      const { x1, y1, x2, y2, color: c, width, mode } = event
      ctxRef.current.strokeStyle = mode === 'erase' ? 'rgba(0,0,0,1)' : c
      ctxRef.current.lineWidth = width
      ctxRef.current.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over'
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

  useEffect(() => {
    const canvas = drawingCanvasRef.current
    if (canvas) {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctxRef.current = ctx
      }
    }
  }, [])

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

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume)
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('ytVolume', String(volume))
    }
  }, [volume])

  useEffect(() => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) player.playVideo()
    else player.pauseVideo()
    if (typeof window !== 'undefined') {
      localStorage.setItem('ytPlaying', String(isPlaying))
    }
  }, [isPlaying])

  useEffect(() => {
    if (musicObj) {
      setYtId(musicObj.id)
      setIsPlaying(musicObj.playing)
      if (typeof window !== 'undefined') {
        localStorage.setItem('ytPlaying', String(musicObj.playing))
      }
    }
  }, [musicObj])



  const uploadImage = async (file: File) => {
    const form = new FormData()
    form.append('file', file)
    form.append('upload_preset', 'cakejdr-images')
    try {
      const res = await fetch('/api/cloudinary', { method: 'POST', body: form })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data && data.url) return data.url as string
      }
    } catch {
      // ignore
    }
    return null
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const url = await uploadImage(file)
      if (!url) {
        console.error('Image upload failed')
        continue
      }
      const newImg: ImageData = {
        id: Date.now() + Math.random(),
        src: url,
        x: e.clientX - rect.left - 100,
        y: e.clientY - rect.top - 100,
        width: 200,
        height: 200,
      }
      addImage(newImg)
    }
  }


  const handleMouseDown = (e: React.MouseEvent, id?: number, type?: 'move' | 'resize') => {
    const rect = canvasRef.current?.getBoundingClientRect()
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
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })
    updateMyPresence({ cursor: { x, y } })

    if (isDrawing && (drawMode === 'draw' || drawMode === 'erase') && ctxRef.current) {
      ctxRef.current.lineTo(x, y)
      ctxRef.current.stroke()
      const { x: px, y: py } = mousePos
      const now = Date.now()
      if (THROTTLE === 0 || now - lastSend.current > THROTTLE) {
        lastSend.current = now
        broadcast({ type: 'draw-line', x1: px, y1: py, x2: x, y2: y, color, width: brushSize, mode: drawMode } as Liveblocks['RoomEvent'])
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

  const handleMouseUp = () => {
    setIsDrawing(false)
    dragState.current = { id: null, type: null, offsetX: 0, offsetY: 0 }
  }

  const handleMouseLeave = () => {
    updateMyPresence({ cursor: null })
  }

  // Efface tout le canvas. Si broadcastChange=false, on ne renvoie pas
  // l'événement Liveblocks pour éviter une boucle infinie lorsque
  // l'on reçoit justement cet événement depuis un autre client.
  const clearCanvas = (broadcastChange = true) => {
    clearImages()
    const ctx = ctxRef.current
    if (ctx && drawingCanvasRef.current) {
      ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height)
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
      updateMusic({ id: match[1], playing: true })
      setIsPlaying(true)
      if (typeof window !== 'undefined') {
        localStorage.setItem('ytPlaying', 'true')
      }
    }
  }

  const handlePlayPause = () => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) player.pauseVideo()
    else player.playVideo()
    updateMusic({ playing: !isPlaying })
    setIsPlaying(!isPlaying)
    if (typeof window !== 'undefined') {
      localStorage.setItem('ytPlaying', String(!isPlaying))
    }
  }


  return (
    <div className="relative w-full h-full select-none">
      {/* TOOLBAR BUTTON */}
      <div className="absolute top-3 left-3 z-30 pointer-events-auto">
        <button
          onClick={() => setToolsVisible(!toolsVisible)}
          className="rounded-xl px-5 py-2 text-base font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-emerald-600 hover:text-white transition duration-100 flex items-center justify-center min-h-[38px]"
        >
          <span className="mr-1">🛠️</span> <span className="text-sm">{toolsVisible ? 'Outils' : ''}</span>
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
          className="rounded-xl px-5 py-2 text-base font-semibold shadow border-none bg-black/30 text-white/90 hover:bg-purple-600 hover:text-white transition duration-100 flex items-center justify-center min-h-[38px]"
        >
          <span>🎵</span>
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
          opts={{ height: '0', width: '0', playerVars: { autoplay: 1 } }}
          onReady={(e) => {
            playerRef.current = e.target
            if (!initializedRef.current) {
              initializedRef.current = true
              e.target.setVolume(volume)
              if (!isPlaying) e.target.pauseVideo()
            }
          }}
        />
      )}

      {/* Zone de dessin + images - sans fond, ni border, ni rien */}
      <div
        ref={canvasRef}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className="w-full h-full relative overflow-hidden z-0"
        style={{ background: 'none', border: 'none', borderRadius: 0 }}
      >
        <canvas ref={drawingCanvasRef} className="absolute top-0 left-0 w-full h-full" />

        {images.map((img) => (
          <ImageItem
            key={img.id}
            img={img}
            drawMode={drawMode}
            onMouseDown={handleMouseDown}
            onDelete={handleDeleteImage}
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

        {images.length === 0 && (
          <p className="absolute bottom-4 left-5 text-xs text-white/70 z-10">Glisse une image ici</p>
        )}
        <LiveCursors />
      </div>
    </div>
  )
}

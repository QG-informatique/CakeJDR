'use client'

import { useRef, useState, useEffect } from 'react'
import YouTube from 'react-youtube'

// Définition du type pour les images
type ImageData = {
  id: number
  src: string
  x: number
  y: number
  width: number
  height: number
}


export default function InteractiveCanvas() {
  const [images, setImages] = useState<ImageData[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawMode, setDrawMode] = useState<'images' | 'draw' | 'erase'>('images')
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(10)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [toolsVisible, setToolsVisible] = useState(false)
  const [audioVisible, setAudioVisible] = useState(false)
  const [ytUrl, setYtUrl] = useState('')
  const [ytId, setYtId] = useState('')
  const [isPlaying, setIsPlaying] = useState(true)
  const [volume, setVolume] = useState(50)

  const canvasRef = useRef<HTMLDivElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const idCounter = useRef(0)
  const playerRef = useRef<any>(null)

  const dragState = useRef({
    id: null as number | null,
    type: null as 'move' | 'resize' | null,
    offsetX: 0,
    offsetY: 0,

    
  })

  // Constantes pour les tailles de pinceau/gomme
  const DRAW_MIN = 2
  const DRAW_MAX = 50
  const ERASE_MIN = DRAW_MIN * 4    // 8
  const ERASE_MAX = DRAW_MAX * 4    // 200

  // Initialise le canvas de dessin
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

  // Gestion du z-index et des pointer-events selon le mode
  useEffect(() => {
    const canvas = drawingCanvasRef.current
    if (!canvas) return

    if (drawMode === 'draw' || drawMode === 'erase') {
      canvas.style.zIndex = '2'
      canvas.style.pointerEvents = 'auto'
    } else {
      canvas.style.zIndex = '0'
      canvas.style.pointerEvents = 'none'
    }
  }, [drawMode])

  // Clamp de brushSize quand on change de mode (pour rester dans les bornes)
  useEffect(() => {
    const min = drawMode === 'erase' ? ERASE_MIN : DRAW_MIN
    const max = drawMode === 'erase' ? ERASE_MAX : DRAW_MAX
    setBrushSize((bs) => Math.min(Math.max(bs, min), max))
  }, [drawMode])

  // Met à jour le volume sur le player YouTube
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume)
    }
  }, [volume])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const rect = canvasRef.current?.getBoundingClientRect()

    files.forEach((file) => {
      if (file.type.startsWith('image/') && rect) {
        const reader = new FileReader()
        reader.onload = () => {
          idCounter.current += 1
          setImages((prev) => [
            ...prev,
            {
              id: idCounter.current,
              src: reader.result as string,
              x: e.clientX - rect.left - 100,
              y: e.clientY - rect.top - 100,
              width: 200,
              height: 200,
            },
          ])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleMouseDown = (e: React.MouseEvent, id?: number, type?: 'move' | 'resize') => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    if ((drawMode === 'draw' || drawMode === 'erase') && !id) {
      setIsDrawing(true)
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
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

    if (isDrawing && (drawMode === 'draw' || drawMode === 'erase') && ctxRef.current) {
      ctxRef.current.lineTo(x, y)
      ctxRef.current.stroke()
    }

    const { id, type, offsetX, offsetY } = dragState.current
    if (!id || !type) return

    setImages((prev) =>
      prev.map((img) => {
        if (img.id !== id) return img
        if (type === 'move') {
          return {
            ...img,
            x: Math.max(0, Math.min(x - offsetX, rect.width - img.width)),
            y: Math.max(0, Math.min(y - offsetY, rect.height - img.height)),
          }
        } else {
          return {
            ...img,
            width: Math.max(50, x - img.x),
            height: Math.max(50, y - img.y),
          }
        }
      })
    )
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    dragState.current = { id: null, type: null, offsetX: 0, offsetY: 0 }
  }

  const clearCanvas = () => {
    setImages([])
    const ctx = ctxRef.current
    if (ctx && drawingCanvasRef.current) {
      ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height)
    }
  }

  const handleYtSubmit = () => {
    const match = ytUrl.match(/(?:youtube\.com.*v=|youtu\.be\/)([^&\n?#]+)/)
    if (match) {
      setYtId(match[1])
      setIsPlaying(true)
    }
  }

  const handlePlayPause = () => {
    const player = playerRef.current
    if (!player) return
    if (isPlaying) player.pauseVideo()
    else player.playVideo()
    setIsPlaying(!isPlaying)
  }

  const COLORS = [
    '#000000', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'
  ]

  return (
    <div className="relative w-full h-full">
      {/* Bouton outils */}
      <div className="absolute top-2 left-2 z-30 pointer-events-auto">
        <button
          onClick={() => setToolsVisible(!toolsVisible)}
          className="bg-gray-300 dark:bg-gray-700 rounded px-2 py-1 text-sm shadow flex items-center"
        >
          🛠️ {toolsVisible ? '◀' : '▶'}
        </button>
      </div>

      {/* Barre outils */}
      <div
        className={`
          absolute top-2 left-24 z-20 transition-all duration-300
          ${toolsVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
          origin-top-left pointer-events-auto
        `}
      >
        <div className="flex gap-2 flex-wrap items-center p-2 bg-white/90 dark:bg-gray-800 rounded shadow-lg">
          <button
            onClick={() => setDrawMode('images')}
            className={`px-3 py-1 rounded ${
              drawMode === 'images' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            🖼️ Images
          </button>
          <button
            onClick={() => setDrawMode('draw')}
            className={`px-3 py-1 rounded ${
              drawMode === 'draw' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            ✏️ Dessin
          </button>
          <button
            onClick={() => setDrawMode('erase')}
            className={`px-3 py-1 rounded ${
              drawMode === 'erase' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'
            }`}
          >
            🧹 Gomme
          </button>
          <input
            type="range"
            min={drawMode === 'erase' ? ERASE_MIN : DRAW_MIN}
            max={drawMode === 'erase' ? ERASE_MAX : DRAW_MAX}
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
            className="w-24"
          />
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-6 h-6 rounded-full border-2"
              style={{ backgroundColor: c, borderColor: color === c ? 'black' : 'white' }}
            />
          ))}
          <button
            onClick={clearCanvas}
            className="ml-4 bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Bouton musique */}
      <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
        <button
          onClick={() => setAudioVisible(!audioVisible)}
          className="bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded shadow"
        >
          🎵
        </button>
      </div>

      {/* Barre musique */}
      {audioVisible && (
        <div className="absolute bottom-2 right-14 z-30 bg-white/90 dark:bg-gray-800 p-3 rounded shadow-md w-64 pointer-events-auto">
          <input
            type="text"
            placeholder="Lien YouTube"
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            className="w-full px-2 py-1 rounded border text-black"
          />
          <button
            onClick={handleYtSubmit}
            className="w-full bg-blue-500 text-white px-2 py-1 mt-2 rounded"
          >
            Charger
          </button>
          <div className="flex items-center justify-between mt-2">
            <button onClick={handlePlayPause} className="bg-gray-600 text-white px-3 py-1 rounded">
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value, 10))}
              className="ml-2 flex-1"
            />
          </div>
        </div>
      )}

      {/* Player YouTube (toujours monté pour conserver la lecture) */}
      {ytId && (
        <YouTube
          videoId={ytId}
          opts={{ height: '0', width: '0', playerVars: { autoplay: 1 } }}
          onReady={(e) => {
            playerRef.current = e.target
          }}
        />
      )}

      {/* Zone de dessin + images */}
      <div
        ref={canvasRef}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full bg-gray-100 relative overflow-hidden border rounded z-0"
      >
        <canvas ref={drawingCanvasRef} className="absolute top-0 left-0 w-full h-full" />

        {images.map((img) => (
          <div
            key={img.id}
            className="absolute border border-gray-500 shadow-md"
            style={{ top: img.y, left: img.x, width: img.width, height: img.height, zIndex: 1 }}
          >
            <img
              src={img.src}
              alt="Dropped"
              className="w-full h-full object-contain pointer-events-none"
            />
            {drawMode === 'images' && (
              <>
                <div
                  onMouseDown={(e) => handleMouseDown(e, img.id, 'move')}
                  className="absolute top-0 left-0 w-full h-full cursor-move"
                  style={{ zIndex: 3 }}
                />
                <div
                  onMouseDown={(e) => handleMouseDown(e, img.id, 'resize')}
                  className="absolute bottom-0 right-0 w-4 h-4 bg-white/30 border border-gray-400 rounded-sm cursor-se-resize"
                  style={{ zIndex: 4 }}
                />
              </>
            )}
          </div>
        ))}

        {(drawMode === 'draw' || drawMode === 'erase') && !dragState.current.id && (
          <div
            className="absolute rounded-full border border-black pointer-events-none"
            style={{
              top: mousePos.y - brushSize / 2,
              left: mousePos.x - brushSize / 2,
              width: brushSize,
              height: brushSize,
              zIndex: 2,
            }}
          />
        )}

        <p className="absolute bottom-2 left-2 text-sm text-gray-600 z-10">Glisse une image ici</p>
      </div>
    </div>
  )
}

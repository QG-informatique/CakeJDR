'use client'

import { useRef, useState, useEffect } from 'react'
import YouTube from 'react-youtube'
import CanvasToolbar from './CanvasToolbar'
import AudioBar from './AudioBar'
import ImageLayer from './ImageLayer'
import DrawingCanvas from './DrawingCanvas'

// Type image partagé
export type ImageData = {
  id: number
  src: string
  x: number
  y: number
  width: number
  height: number
}

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'
]

// Min/max
const DRAW_MIN = 2
const DRAW_MAX = 50
const ERASE_MIN = DRAW_MIN * 4
const ERASE_MAX = DRAW_MAX * 4

export default function InteractiveCanvas() {
  // STATES principaux (on pourra extraire des useReducer après si besoin)
  const [images, setImages] = useState<ImageData[]>([])
  const [drawMode, setDrawMode] = useState<'images' | 'draw' | 'erase'>('images')
  const [color, setColor] = useState('#000000')
  const [brushSize, setBrushSize] = useState(10)
  const [toolsVisible, setToolsVisible] = useState(false)
  const [audioVisible, setAudioVisible] = useState(false)
  const [ytUrl, setYtUrl] = useState('')
  const [ytId, setYtId] = useState('')
  const [isPlaying, setIsPlaying] = useState(true)
  const [volume, setVolume] = useState(50)

  // Réfs
  const canvasRef = useRef<HTMLDivElement>(null)
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const idCounter = useRef(0)
  const playerRef = useRef<any>(null)
  const dragState = useRef({ id: null as number | null, type: null as 'move' | 'resize' | null, offsetX: 0, offsetY: 0 })

  // Logique pour brush size clamp
  useEffect(() => {
    const min = drawMode === 'erase' ? ERASE_MIN : DRAW_MIN
    const max = drawMode === 'erase' ? ERASE_MAX : DRAW_MAX
    setBrushSize((bs) => Math.min(Math.max(bs, min), max))
  }, [drawMode])

  // Met à jour le volume sur le player YouTube
  useEffect(() => {
    if (playerRef.current) playerRef.current.setVolume(volume)
  }, [volume])

  // ---- Les handlers pour les events seront déplacés dans les sous-composants
  // Par souci de clarté on ne les recopie pas ici, ils vont dans chaque fichier correspondant

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
      <CanvasToolbar
        visible={toolsVisible}
        drawMode={drawMode}
        setDrawMode={setDrawMode}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        color={color}
        setColor={setColor}
        clearCanvas={() => {
          setImages([])
          const ctx = ctxRef.current
          if (ctx && drawingCanvasRef.current) ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height)
        }}
        COLORS={COLORS}
        DRAW_MIN={DRAW_MIN}
        DRAW_MAX={DRAW_MAX}
        ERASE_MIN={ERASE_MIN}
        ERASE_MAX={ERASE_MAX}
      />

      {/* Bouton musique + AudioBar */}
      <div className="absolute bottom-2 right-2 z-30 pointer-events-auto">
        <button
          onClick={() => setAudioVisible(!audioVisible)}
          className="bg-gray-300 dark:bg-gray-700 px-2 py-1 rounded shadow"
        >
          🎵
        </button>
      </div>
      {audioVisible && (
        <AudioBar
          ytUrl={ytUrl}
          setYtUrl={setYtUrl}
          ytId={ytId}
          setYtId={setYtId}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          playerRef={playerRef}
          volume={volume}
          setVolume={setVolume}
        />
      )}
      {ytId && (
        <YouTube
          videoId={ytId}
          opts={{ height: '0', width: '0', playerVars: { autoplay: 1 } }}
          onReady={(e) => { playerRef.current = e.target }}
        />
      )}

      {/* Canvas et images */}
      <div
        ref={canvasRef}
        className="w-full h-full bg-gray-100 relative overflow-hidden border rounded z-0"
      >
        {/* Canvas de dessin */}
        <DrawingCanvas
          drawingCanvasRef={drawingCanvasRef}
          ctxRef={ctxRef}
          drawMode={drawMode}
          color={color}
          brushSize={brushSize}
        />
        {/* Couches d'images et gestion */}
        <ImageLayer
          images={images}
          setImages={setImages}
          drawMode={drawMode}
          canvasRef={canvasRef}
          dragState={dragState}
          idCounter={idCounter}
        />
        <p className="absolute bottom-2 left-2 text-sm text-gray-600 z-10">Glisse une image ici</p>
      </div>
    </div>
  )
}

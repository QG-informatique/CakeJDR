'use client'

import React from 'react'
import { useT } from '@/lib/useT'
import { Image as ImageIcon, Pencil, Eraser, Upload, Trash2 } from 'lucide-react'

export type ToolMode = 'images' | 'draw' | 'erase'

interface CanvasToolsProps {
  drawMode: ToolMode
  setDrawMode: (mode: ToolMode) => void
  color: string
  setColor: (color: string) => void
  brushSize: number
  setPenSize: (v: number) => void
  setEraserSize: (v: number) => void
  clearCanvas: () => void
  onAddImage?: () => void
}

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'
]

const CanvasTools: React.FC<CanvasToolsProps> = ({
  drawMode,
  setDrawMode,
  color,
  setColor,
  brushSize,
  setPenSize,
  setEraserSize,
  clearCanvas,
  onAddImage,
}) => {
  const DRAW_MIN = 2
  const DRAW_MAX = 50
  const ERASE_MIN = DRAW_MIN * 4
  const ERASE_MAX = DRAW_MAX * 4
  const t = useT()
  return (
    <div className="flex gap-2 flex-wrap items-center p-3 bg-black/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/10">
      <button
        onClick={() => {
          if (drawMode === 'images' && onAddImage) onAddImage();
          setDrawMode('images');
        }}
        className={`rounded-xl px-3 py-2 text-xs font-semibold shadow border border-white/10 transition duration-100 ${drawMode === 'images' ? 'bg-blue-600 text-white shadow-md' : 'bg-black/20 text-blue-100/85 hover:bg-blue-900/30 hover:text-white/80'}`}
        title={t('images')}
      >
        <span className="inline-flex items-center gap-1"><ImageIcon size={14} /> {t('images')}</span>
      </button>
      <button
        onClick={() => setDrawMode('draw')}
        className={`rounded-xl px-3 py-2 text-xs font-semibold shadow border border-white/10 transition duration-100 ${drawMode === 'draw' ? 'bg-blue-600 text-white shadow-md' : 'bg-black/20 text-blue-100/85 hover:bg-blue-900/30 hover:text-white/80'}`}
        title={t('draw')}
      >
        <span className="inline-flex items-center gap-1"><Pencil size={14} /> {t('draw')}</span>
      </button>
      <button
        onClick={() => setDrawMode('erase')}
        className={`rounded-xl px-3 py-2 text-xs font-semibold shadow border border-white/10 transition duration-100 ${drawMode === 'erase' ? 'bg-blue-600 text-white shadow-md' : 'bg-black/20 text-blue-100/85 hover:bg-blue-900/30 hover:text-white/80'}`}
        title={t('erase')}
      >
        <span className="inline-flex items-center gap-1"><Eraser size={14} /> {t('erase')}</span>
      </button>
      <input
        type="range"
        min={drawMode === 'erase' ? ERASE_MIN : DRAW_MIN}
        max={drawMode === 'erase' ? ERASE_MAX : DRAW_MAX}
        value={brushSize}
        onChange={e => {
          const v = parseInt(e.target.value, 10)
          if (drawMode === 'erase') setEraserSize(v)
          else setPenSize(v)
        }}
        className="w-24 mx-2"
      />
      {COLORS.map(c => (
        <button
          key={c}
          onClick={() => setColor(c)}
          className="w-6 h-6 rounded-full border-2 mx-1"
          style={{ backgroundColor: c, borderColor: color === c ? '#4f9ddf' : 'white', boxShadow: color === c ? '0 0 0 2px #4f9ddf' : 'none' }}
          title={c}
        />
      ))}
      {/* Import button removed; Images button already opens picker */}
      <button
        onClick={clearCanvas}
        className="rounded-xl px-3 py-2 text-xs font-semibold shadow border-none bg-red-600 text-white hover:bg-red-700 ml-4"
        title={t('clearAll')}
      >
        <span className="inline-flex items-center gap-1"><Trash2 size={14} /> {t('clearAll')}</span>
      </button>
    </div>
  )
}

export default CanvasTools

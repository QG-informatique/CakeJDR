'use client'

import React from 'react'
import { useT } from '@/lib/useT'
import { Image as ImageIcon, Pencil, Eraser, Trash2 } from 'lucide-react' // FIX: remove unused Upload

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
  const modes: { mode: ToolMode; label: string; Icon: typeof Pencil }[] = [
    { mode: 'images', label: t('images'), Icon: ImageIcon },
    { mode: 'draw', label: t('draw'), Icon: Pencil },
    { mode: 'erase', label: t('erase'), Icon: Eraser },
  ]
  return (
    <div
      className="ui-panel flex flex-wrap items-center gap-x-3 gap-y-2 p-1.5 shadow-lg !backdrop-blur-md"
      style={{ background: 'var(--c-panel-head)' }}
    >
      <div className="ui-seg" role="group">
        {modes.map(({ mode, label, Icon }) => (
          <button
            key={mode}
            aria-pressed={drawMode === mode}
            onClick={() => {
              // Un second clic sur « Images » ouvre le choix de fichier.
              if (mode === 'images' && drawMode === 'images' && onAddImage) onAddImage()
              setDrawMode(mode)
            }}
            className="!flex-none inline-flex items-center gap-1.5"
            title={label}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>
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
        className="w-24"
        aria-label={t('brushSize')}
      />
      <div className="flex items-center gap-1.5">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`h-5 w-5 rounded-full border border-ink/30 transition ${color === c ? 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--c-surface-deep)]' : 'hover:scale-110'}`}
            style={{ backgroundColor: c }}
            title={c}
            aria-label={c}
            aria-pressed={color === c}
          />
        ))}
      </div>
      <button
        onClick={clearCanvas}
        className="ui-btn ui-btn-danger !text-red-300"
        title={t('clearAll')}
      >
        <Trash2 size={14} /> {t('clearAll')}
      </button>
    </div>
  )
}

export default CanvasTools

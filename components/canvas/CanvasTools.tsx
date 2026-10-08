'use client'

import React, { useRef, useState } from 'react'
import { useT } from '@/lib/useT'
import { Pencil, Eraser, Trash2, Plus } from 'lucide-react'

/** « images » : rien n'est dessiné, on déplace les pions (palette fermée). */
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
}

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'
]

/** Emplacements de couleurs choisies par le joueur, gardés dans son navigateur. */
const SLOTS = 4
const SLOTS_KEY = 'cakejdr:draw-colors'

function readSlots(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(SLOTS_KEY) || '[]')
    if (Array.isArray(saved)) {
      return Array.from({ length: SLOTS }, (_, i) =>
        typeof saved[i] === 'string' && /^#[0-9a-f]{6}$/i.test(saved[i]) ? saved[i] : '')
    }
  } catch { /* stockage indisponible : emplacements vides */ }
  return Array(SLOTS).fill('')
}

const ring = (on: boolean) =>
  on ? 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--c-surface-deep)]' : 'hover:scale-110'

const CanvasTools: React.FC<CanvasToolsProps> = ({
  drawMode,
  setDrawMode,
  color,
  setColor,
  brushSize,
  setPenSize,
  setEraserSize,
  clearCanvas,
}) => {
  const DRAW_MIN = 2
  const DRAW_MAX = 50
  const ERASE_MIN = DRAW_MIN * 4
  const ERASE_MAX = DRAW_MAX * 4
  const t = useT()
  const [slots, setSlots] = useState(readSlots)
  const pickers = useRef<(HTMLInputElement | null)[]>([])
  const fillSlot = (i: number, c: string) => {
    const next = slots.map((s, j) => (j === i ? c : s))
    setSlots(next)
    setColor(c)
    try { localStorage.setItem(SLOTS_KEY, JSON.stringify(next)) } catch { /* rien à garder */ }
  }
  const modes: { mode: ToolMode; label: string; Icon: typeof Pencil }[] = [
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
            onClick={() => setDrawMode(mode)}
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
      <div className="flex flex-wrap items-center gap-1.5">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`h-5 w-5 rounded-full border border-ink/30 transition ${ring(color === c)}`}
            style={{ backgroundColor: c }}
            title={c}
            aria-label={c}
            aria-pressed={color === c}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5 border-l border-ink/20 pl-3">
        {/* Vide : ouvre le sélecteur. Rempli : prend la couleur ; cliqué une
            seconde fois quand elle est déjà prise, rouvre le sélecteur. */}
        {slots.map((c, i) => {
          const on = !!c && color.toLowerCase() === c.toLowerCase()
          return (
            <span key={i} className="relative inline-flex">
              <button
                onClick={() => (c && !on ? setColor(c) : pickers.current[i]?.click())}
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full transition ${c ? 'border border-ink/30' : 'border border-dashed border-ink/40 text-ink/50'} ${ring(on)}`}
                style={c ? { backgroundColor: c } : undefined}
                title={c ? (on ? t('drawColorChange') : c) : t('drawColorAdd')}
                aria-label={c ? (on ? t('drawColorChange') : c) : t('drawColorAdd')}
                aria-pressed={on}
              >
                {!c && <Plus size={11} />}
              </button>
              <input
                ref={(el) => { pickers.current[i] = el }}
                type="color"
                value={c || color}
                onChange={(e) => fillSlot(i, e.target.value)}
                className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
                tabIndex={-1}
                aria-hidden
              />
            </span>
          )
        })}
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

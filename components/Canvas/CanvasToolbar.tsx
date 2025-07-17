import React from 'react'

type Props = {
  visible: boolean
  drawMode: 'images' | 'draw' | 'erase'
  setDrawMode: (mode: 'images' | 'draw' | 'erase') => void
  brushSize: number
  setBrushSize: (size: number) => void
  color: string
  setColor: (col: string) => void
  clearCanvas: () => void
  COLORS: string[]
  DRAW_MIN: number
  DRAW_MAX: number
  ERASE_MIN: number
  ERASE_MAX: number
}

export default function CanvasToolbar({
  visible, drawMode, setDrawMode, brushSize, setBrushSize,
  color, setColor, clearCanvas, COLORS, DRAW_MIN, DRAW_MAX, ERASE_MIN, ERASE_MAX
}: Props) {
  return (
    <div
      className={`
        absolute top-2 left-24 z-20 transition-all duration-300
        ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
        origin-top-left pointer-events-auto
      `}
    >
      <div className="flex gap-2 flex-wrap items-center p-2 bg-white/90 dark:bg-gray-800 rounded shadow-lg">
        <button onClick={() => setDrawMode('images')} className={`px-3 py-1 rounded ${drawMode === 'images' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>🖼️ Images</button>
        <button onClick={() => setDrawMode('draw')} className={`px-3 py-1 rounded ${drawMode === 'draw' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>✏️ Dessin</button>
        <button onClick={() => setDrawMode('erase')} className={`px-3 py-1 rounded ${drawMode === 'erase' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>🧹 Gomme</button>
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
  )
}

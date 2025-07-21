'use client'
import { FC, useRef, useState, useEffect } from 'react'

interface Props {
  color: string
  onChange: (hex: string) => void
}

const CustomColorPicker: FC<Props> = ({ color, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentColor, setCurrentColor] = useState(color)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Dégradé horizontal (teinte)
    const hueGrad = ctx.createLinearGradient(0, 0, width, 0)
    for (let i = 0; i <= 360; i += 10) {
      hueGrad.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`)
    }
    ctx.fillStyle = hueGrad
    ctx.fillRect(0, 0, width, height)

    // Dégradé vertical (saturation/luminosité)
    const whiteGrad = ctx.createLinearGradient(0, 0, 0, height)
    whiteGrad.addColorStop(0, 'rgba(255,255,255,1)')
    whiteGrad.addColorStop(0.5, 'rgba(255,255,255,0)')
    whiteGrad.addColorStop(0.5, 'rgba(0,0,0,0)')
    whiteGrad.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = whiteGrad
    ctx.fillRect(0, 0, width, height)
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const data = ctx.getImageData(x, y, 1, 1).data
    const hex = `#${[...data].slice(0, 3).map(v => v.toString(16).padStart(2, '0')).join('')}`

    setCurrentColor(hex)
  }

  const handleValidate = () => {
    onChange(currentColor)
  }

  return (
    <div className="flex flex-col items-center gap-3 p-3 bg-zinc-900 rounded-xl shadow-lg">
      <canvas
        ref={canvasRef}
        width={200}
        height={150}
        onClick={handleClick}
        className="rounded cursor-crosshair border border-white/10"
      />
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-full border border-white/30"
          style={{ background: currentColor }}
        />
        <span className="text-white text-sm font-mono">{currentColor.toUpperCase()}</span>
        <button
          onClick={handleValidate}
          className="px-3 py-1 text-sm rounded bg-emerald-600 text-white hover:bg-emerald-500"
        >
          Valider
        </button>
      </div>
    </div>
  )
}

export default CustomColorPicker

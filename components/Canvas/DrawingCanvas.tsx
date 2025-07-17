import React, { useRef, useEffect, useState } from 'react'

type Props = {
  drawMode: 'draw' | 'erase'
  color: string
  brushSize: number
  className?: string // Permet de personnaliser la position/style
  clearSignal?: number // Pour clear le canvas via changement de valeur
}

const DrawingCanvas: React.FC<Props> = ({
  drawMode,
  color,
  brushSize,
  className = '',
  clearSignal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Initialisation canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      // Taille responsive (plein parent)
      const resize = () => {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
        setDimensions({ width: canvas.offsetWidth, height: canvas.offsetHeight })
      }
      resize()
      window.addEventListener('resize', resize)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctxRef.current = ctx
      }
      return () => window.removeEventListener('resize', resize)
    }
  }, [])

  // Reset canvas externe si clearSignal change
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = ctxRef.current
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
  }, [clearSignal])

  // Gère le curseur rond personnalisé (optionnel)
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })

    if (isDrawing && ctxRef.current) {
      ctxRef.current.lineTo(x, y)
      ctxRef.current.stroke()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (drawMode !== 'draw' && drawMode !== 'erase') return
    setIsDrawing(true)
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
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
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
    if (ctxRef.current) {
      ctxRef.current.closePath()
      // Reset mode pour éviter bugs sur le globalCompositeOperation
      ctxRef.current.globalCompositeOperation = 'source-over'
    }
  }

  return (
    <div className={`absolute top-0 left-0 w-full h-full pointer-events-auto ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: 'none', background: 'transparent' }}
      />
      {/* Curseur rond custom */}
      {(drawMode === 'draw' || drawMode === 'erase') && !isDrawing && (
        <div
          className="absolute pointer-events-none border border-black rounded-full"
          style={{
            top: mousePos.y - brushSize / 2,
            left: mousePos.x - brushSize / 2,
            width: brushSize,
            height: brushSize,
            zIndex: 100,
            background: drawMode === 'erase' ? 'rgba(255,255,255,0.3)' : 'transparent',
            boxShadow: drawMode === 'draw' ? `0 0 0 1.5px ${color}` : undefined,
          }}
        />
      )}
    </div>
  )
}

export default DrawingCanvas

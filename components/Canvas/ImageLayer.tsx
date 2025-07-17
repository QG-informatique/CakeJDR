import React, { useRef } from 'react'
import type { ImageData } from './InteractiveCanvas'

type Props = {
  images: ImageData[]
  setImages: React.Dispatch<React.SetStateAction<ImageData[]>>
  drawMode: 'images' | 'draw' | 'erase'
  canvasRef: React.RefObject<HTMLDivElement>
  dragState: React.MutableRefObject<{
    id: number | null,
    type: 'move' | 'resize' | null,
    offsetX: number,
    offsetY: number
  }>
  idCounter: React.MutableRefObject<number>
}

const ImageLayer: React.FC<Props> = ({
  images, setImages, drawMode, canvasRef, dragState, idCounter
}) => {
  // Drag and drop image handler
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

  // Mouse event handlers pour le move/resize
  const handleMouseDown = (
    e: React.MouseEvent,
    id: number,
    type: 'move' | 'resize'
  ) => {
    e.stopPropagation()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const img = images.find((i) => i.id === id)
    if (!img) return
    dragState.current = {
      id,
      type,
      offsetX: e.clientX - rect.left - img.x,
      offsetY: e.clientY - rect.top - img.y,
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const { id, type, offsetX, offsetY } = dragState.current
    if (!id || !type) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

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
    dragState.current = { id: null, type: null, offsetX: 0, offsetY: 0 }
  }

  // Events globaux pour drag sur toute la zone
  React.useEffect(() => {
    if (drawMode !== 'images') return
    const onMove = (e: MouseEvent) => handleMouseMove(e as any)
    const onUp = () => handleMouseUp()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    // eslint-disable-next-line
  }, [drawMode, images])

  return (
    <>
      {/* Gestion du drop */}
      <div
        className="absolute top-0 left-0 w-full h-full"
        style={{ zIndex: 2, pointerEvents: drawMode === 'images' ? 'auto' : 'none' }}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        {images.map((img) => (
          <div
            key={img.id}
            className="absolute border border-gray-500 shadow-md bg-white"
            style={{
              top: img.y,
              left: img.x,
              width: img.width,
              height: img.height,
              zIndex: 3,
              pointerEvents: drawMode === 'images' ? 'auto' : 'none',
              userSelect: 'none'
            }}
          >
            <img
              src={img.src}
              alt="Dropped"
              className="w-full h-full object-contain pointer-events-none select-none"
              draggable={false}
            />
            {drawMode === 'images' && (
              <>
                <div
                  onMouseDown={(e) => handleMouseDown(e, img.id, 'move')}
                  className="absolute top-0 left-0 w-full h-full cursor-move"
                  style={{ zIndex: 4 }}
                />
                <div
                  onMouseDown={(e) => handleMouseDown(e, img.id, 'resize')}
                  className="absolute bottom-0 right-0 w-4 h-4 bg-white/70 border border-gray-400 rounded-sm cursor-se-resize"
                  style={{ zIndex: 5 }}
                />
              </>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

export default ImageLayer

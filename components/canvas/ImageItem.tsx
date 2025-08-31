'use client'

import { Trash2 } from 'lucide-react'
import React from 'react'
import { ToolMode } from './CanvasTools'

// Single image element on canvas with move/resize handles.
// Metadata for a canvas image. Width/height are derived from natural size * scale.
export interface ImageData {
  id: string
  url: string
  x: number
  y: number
  scale: number
  rotation: number
  naturalWidth: number
  naturalHeight: number
  createdAt: number
}

interface Props {
  img: ImageData
  drawMode: ToolMode
  onPointerDown: (
    e: React.PointerEvent,
    id: string,
    type: 'move' | 'resize',
  ) => void
  onDelete: (id: string) => void
  onError: (id: string) => void
  pending?: boolean
}

const ImageItem: React.FC<Props> = ({
  img,
  drawMode,
  onPointerDown,
  onDelete,
  onError,
  pending,
}) => (
  <div
    className="absolute border border-white/20 rounded-2xl shadow-md group touch-none transition-all duration-300"
    // Keep a single GPU-friendly transform for position & scale
    style={{
      width: img.naturalWidth,
      height: img.naturalHeight,
      transform: `translate3d(${img.x}px, ${img.y}px, 0) scale(${img.scale}) rotate(${img.rotation}deg)`,
      transformOrigin: 'top left',
      willChange: 'transform',
      zIndex: 1,
    }}
  >
    {drawMode === 'images' && !pending && (
      <button
        onClick={() => onDelete(img.id)}
        className="absolute top-1 left-1 z-20 p-1 rounded-full bg-black/60 hover:bg-red-600 transition text-white opacity-80 group-hover:opacity-100"
        title="Delete image"
        style={{ cursor: 'pointer' }}
      >
        <Trash2 size={18} />
      </button>
    )}
    <img
      src={img.url}
      alt="Dropped"
      width={img.naturalWidth}
      height={img.naturalHeight}
      className="pointer-events-none select-none rounded-2xl"
      onError={() => onError(img.id)}
    />
    {drawMode === 'images' && !pending && (
      <>
        <div
          onPointerDown={(e) => onPointerDown(e, img.id, 'move')}
          className="absolute top-0 left-0 w-full h-full cursor-move"
          style={{ zIndex: 3 }}
        />
        <div
          onPointerDown={(e) => onPointerDown(e, img.id, 'resize')}
          className="absolute bottom-0 right-0 w-4 h-4 bg-white/40 border border-white rounded-full cursor-se-resize"
          style={{ zIndex: 4 }}
        />
      </>
    )}
  </div>
)

export default React.memo(
  ImageItem,
  (prev, next) => prev.img === next.img && prev.drawMode === next.drawMode,
)

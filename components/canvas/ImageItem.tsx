'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import React from 'react'
import { ToolMode } from './CanvasTools'

// Single image element on canvas with move/resize handles.

export interface ImageData {
  id: number
  src: string
  x: number
  y: number
  width: number
  height: number
}

interface Props {
  img: ImageData
  drawMode: ToolMode
  onPointerDown: (e: React.PointerEvent, id: number, type: 'move' | 'resize') => void
  onDelete: (id: number) => void
  /** Whether this image is currently selected */
  selected: boolean
}

const ImageItem: React.FC<Props> = ({ img, drawMode, onPointerDown, onDelete, selected }) => (
  <div
    className="absolute border border-white/20 rounded-2xl shadow-md group touch-none"
    /* Keep images below drawing canvas even when selected */
    style={{ top: img.y, left: img.x, width: img.width, height: img.height, zIndex: selected ? 5 : 4 }}
  >
    {drawMode === 'images' && (
      <button
        onClick={() => onDelete(img.id)}
        className="absolute top-1 left-1 z-20 p-1 rounded-full bg-black/60 hover:bg-red-600 transition text-white opacity-80 group-hover:opacity-100"
        title="Delete image"
        style={{ cursor: 'pointer' }}
      >
        <Trash2 size={18} />
      </button>
    )}
    <Image
      src={img.src}
      alt="Dropped"
      width={img.width}
      height={img.height}
      className="w-full h-full object-contain pointer-events-none select-none rounded-2xl"
      style={{ borderRadius: '1rem' }}
      unoptimized
    />
    {drawMode === 'images' && (
      <>
        <div
          onPointerDown={e => onPointerDown(e, img.id, 'move')}
          className="absolute top-0 left-0 w-full h-full cursor-move"
          style={{ zIndex: 3 }}
        />
        <div
          onPointerDown={e => onPointerDown(e, img.id, 'resize')}
          className="absolute bottom-0 right-0 w-4 h-4 bg-white/40 border border-white rounded-full cursor-se-resize"
          style={{ zIndex: 4 }}
        />
      </>
    )}
  </div>
)

export default ImageItem

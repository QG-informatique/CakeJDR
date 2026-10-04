'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import React, { useState } from 'react'
import { useT } from '@/lib/useT'
import { ToolMode } from './CanvasTools'

// Single image element on canvas with move/resize handles.
export interface ImageRenderData {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
  scale?: number
  rotation?: number
  createdAt?: number
}

interface Props {
  img: ImageRenderData
  drawMode: ToolMode
  onPointerDown: (
    e: React.PointerEvent,
    id: string,
    type: 'move' | 'resize',
  ) => void
  onDelete: (id: string) => void
  pending?: boolean
}

// Une image qui ne charge pas chez un joueur (réseau, bloqueur) reste sur la
// table : seul ce joueur voit un cadre « indisponible ». La supprimer ici
// l'effacerait pour tout le monde.
const ImageItem: React.FC<Props> = ({
  img,
  drawMode,
  onPointerDown,
  onDelete,
  pending,
}) => {
  const t = useT()
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const src = img.url || (img as unknown as { src?: string }).src || ''
  return (
  <div
    className="absolute border border-ink/20 rounded-2xl shadow-md group touch-none"
    style={{
      top: img.y,
      left: img.x,
      width: img.width,
      height: img.height,
      zIndex: 1,
    }}
  >
    {drawMode === 'images' && !pending && (
      <button
        onClick={() => onDelete(img.id)}
        className="absolute top-1 left-1 z-20 p-1 rounded-full bg-shade/60 hover:bg-red-600 transition text-white opacity-80 group-hover:opacity-100"
        title={t('delete')}
        style={{ cursor: 'pointer' }}
      >
        <Trash2 size={18} />
      </button>
    )}
    {failedUrl === src ? (
      <div className="w-full h-full flex items-center justify-center rounded-2xl border border-dashed border-ink/30 bg-shade/40 text-xs text-ink/70 text-center p-2 select-none">
        {t('imageUnavailable')}
      </div>
    ) : (
      <Image
        src={src}
        alt=""
        width={img.width}
        height={img.height}
        className="w-full h-full object-contain pointer-events-none select-none rounded-2xl"
        style={{ borderRadius: '1rem' }}
        onError={() => setFailedUrl(src)}
        unoptimized
      />
    )}
    {drawMode === 'images' && !pending && (
      <>
        <div
          onPointerDown={(e) => onPointerDown(e, img.id, 'move')}
          className="absolute top-0 left-0 w-full h-full cursor-move"
          style={{ zIndex: 3 }}
        />
        <div
          onPointerDown={(e) => onPointerDown(e, img.id, 'resize')}
          className="absolute bottom-0 right-0 w-4 h-4 bg-ink/40 border border-ink rounded-full cursor-se-resize"
          style={{ zIndex: 4 }}
        />
      </>
    )}
  </div>
  )
}

export default ImageItem

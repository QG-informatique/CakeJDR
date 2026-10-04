'use client'

import Image from 'next/image'
import React, { useState } from 'react'
import { useT } from '@/lib/useT'
import { ToolMode } from './CanvasTools'

// Pion ou rencontre posé sur le plateau : on le déplace et le redimensionne
// quand on ne dessine pas. On le retire depuis la bibliothèque.
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
}

// Une image qui ne charge pas chez un joueur (réseau, bloqueur) reste sur la
// table : seul ce joueur voit un cadre « indisponible ». La supprimer ici
// l'effacerait pour tout le monde.
const ImageItem: React.FC<Props> = ({
  img,
  drawMode,
  onPointerDown,
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
    {drawMode === 'images' && (
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

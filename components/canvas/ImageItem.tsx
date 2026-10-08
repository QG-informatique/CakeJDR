'use client'

import Image from 'next/image'
import React, { useState } from 'react'
import { X } from 'lucide-react'
import { useT } from '@/lib/useT'
import { ToolMode } from './CanvasTools'

// Pion ou rencontre posé sur le plateau : on le déplace et le redimensionne
// quand on ne dessine pas. On le retire depuis la bibliothèque, ou avec la
// croix qui apparaît au survol.
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
  ownerId?: string
  token?: { text: string; color: string }
}

interface Props {
  img: ImageRenderData
  drawMode: ToolMode
  /** Faux pour le pion d'un autre joueur : on le voit sans pouvoir le prendre. */
  movable?: boolean
  onRemove?: () => void
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
  movable = true,
  onRemove,
  onPointerDown,
}) => {
  const t = useT()
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const src = img.url || (img as unknown as { src?: string }).src || ''
  return (
  <div
    className={`absolute group touch-none ${img.token ? '' : 'border border-ink/20 rounded-2xl shadow-md'}`}
    style={{
      top: img.y,
      left: img.x,
      width: img.width,
      height: img.height,
      zIndex: 1,
    }}
  >
    {img.token ? (
      // Le rond reste rond même si on étire le cadre.
      <div className="flex h-full w-full items-center justify-center">
        <div
          className="flex aspect-square max-h-full max-w-full items-center justify-center rounded-full border-2 border-white/80 font-bold text-white shadow-lg select-none"
          style={{
            background: img.token.color,
            width: Math.min(img.width, img.height),
            fontSize: Math.min(img.width, img.height) * 0.48,
            textShadow: '0 1px 2px rgba(0,0,0,.45)',
          }}
        >
          {img.token.text}
        </div>
      </div>
    ) : failedUrl === src ? (
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
    {drawMode === 'images' && movable && (
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
        {onRemove && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-shade/80 text-white opacity-0 shadow transition hover:bg-red-600 focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            style={{ zIndex: 5 }}
            aria-label={t('removeFromBoard')}
            title={t('removeFromBoard')}
          >
            <X size={13} />
          </button>
        )}
      </>
    )}
  </div>
  )
}

export default ImageItem

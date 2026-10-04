'use client'

import { FC } from 'react'
import Portal from '@/components/Portal'
import { useT } from '@/lib/useT'

interface Props {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Affiche le bouton de confirmation en rouge (action destructrice) */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modal de confirmation glass-morphism — remplace window.confirm().
 * Rendu via Portal pour éviter tout problème de z-index/overflow.
 */
const ConfirmDialog: FC<Props> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}) => {
  const t = useT()
  if (!open) return null

  return (
    <Portal>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-shade/60 backdrop-blur-sm"
        onPointerDown={(e) => { if (e.target === e.currentTarget) onCancel() }}
      >
        {/* Card */}
        <div
          className="w-full max-w-sm mx-4 rounded-2xl border border-ink/12 bg-shade/60 backdrop-blur-[16px] shadow-2xl p-6 text-ink animate-fadeInScale"
          style={{ boxShadow: '0 8px 40px -8px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)' }}
        >
          {title && (
            <h2 className="text-base font-semibold mb-2 text-ink">{title}</h2>
          )}
          <p className="text-sm text-ink/80 mb-6 leading-relaxed">{message}</p>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-ink/10 bg-ink/5 text-ink/70 hover:bg-ink/10 hover:text-ink transition-all active:scale-95"
            >
              {cancelLabel ?? t('cancel')}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 border ${
                danger
                  ? 'bg-red-600/80 border-red-500/40 text-ink hover:bg-red-500/90 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                  : 'bg-indigo-600/80 border-indigo-500/40 text-ink hover:bg-indigo-500/90 shadow-[0_0_12px_rgba(99,102,241,0.3)]'
              }`}
            >
              {confirmLabel ?? t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}

export default ConfirmDialog

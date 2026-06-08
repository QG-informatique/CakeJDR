import { useState, useCallback } from 'react'

interface ConfirmState {
  message: string
  title?: string
  danger?: boolean
  confirmLabel?: string
  cancelLabel?: string
  resolve: (value: boolean) => void
}

/**
 * Hook impératif pour afficher un ConfirmDialog et attendre la réponse.
 *
 * Usage :
 * ```tsx
 * const { confirm, confirmState, handleConfirm, handleCancel } = useConfirm()
 *
 * // Dans une action :
 * const ok = await confirm('Supprimer cette page ?', { danger: true })
 * if (!ok) return
 * // ... procéder
 *
 * // Dans le JSX :
 * <ConfirmDialog
 *   open={!!confirmState}
 *   message={confirmState?.message ?? ''}
 *   title={confirmState?.title}
 *   danger={confirmState?.danger}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 * ```
 */
export function useConfirm() {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const confirm = useCallback(
    (
      message: string,
      options?: { title?: string; danger?: boolean; confirmLabel?: string; cancelLabel?: string },
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        setConfirmState({ message, ...options, resolve })
      })
    },
    [],
  )

  const handleConfirm = useCallback(() => {
    confirmState?.resolve(true)
    setConfirmState(null)
  }, [confirmState])

  const handleCancel = useCallback(() => {
    confirmState?.resolve(false)
    setConfirmState(null)
  }, [confirmState])

  return { confirm, confirmState, handleConfirm, handleCancel }
}

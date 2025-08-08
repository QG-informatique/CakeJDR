'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import Portal from '@/components/Portal'
import { useT } from '@/lib/useT'

type AlertState = { type: 'alert'; message: string; resolve: () => void }
type ConfirmState = { type: 'confirm'; message: string; resolve: (v: boolean) => void }
type PromptState = {
  type: 'prompt'
  message: string
  value: string
  resolve: (v: string | null) => void
}

type DialogState = AlertState | ConfirmState | PromptState | null

interface DialogContextType {
  alert: (msg: string) => Promise<void>
  confirm: (msg: string) => Promise<boolean>
  prompt: (msg: string, def?: string) => Promise<string | null>
}

const DialogContext = createContext<DialogContextType | null>(null)

export function DialogProvider({ children }: { children: ReactNode }) {
  const t = useT()
  const [state, setState] = useState<DialogState>(null)

  const alert = (msg: string) =>
    new Promise<void>(resolve => setState({ type: 'alert', message: msg, resolve }))

  const confirm = (msg: string) =>
    new Promise<boolean>(resolve => setState({ type: 'confirm', message: msg, resolve }))

  const prompt = (msg: string, def = '') =>
    new Promise<string | null>(resolve => setState({ type: 'prompt', message: msg, value: def, resolve }))

  const close = () => setState(null)

  const handleConfirm = useCallback(() => {
    if (!state) return
    switch (state.type) {
      case 'alert':
        state.resolve()
        break
      case 'confirm':
        state.resolve(true)
        break
      case 'prompt':
        state.resolve(state.value)
        break
    }
    close()
  }, [state])

  const handleCancel = useCallback(() => {
    if (!state) return
    switch (state.type) {
      case 'alert':
        state.resolve()
        break
      case 'confirm':
        state.resolve(false)
        break
      case 'prompt':
        state.resolve(null)
        break
    }
    close()
  }, [state])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel()
      if (e.key === 'Enter' && state && state.type !== 'prompt') handleConfirm()
    }
    if (state) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [state, handleCancel, handleConfirm])

  const value = { alert, confirm, prompt }

  return (
    <DialogContext.Provider value={value}>
      {children}
      {state && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
            onClick={handleCancel}
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={e => e.stopPropagation()}
              className="bg-black/80 text-white rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md p-5 w-80"
            >
              <p className="mb-4 whitespace-pre-wrap">{state.message}</p>
              {state.type === 'prompt' && (
                <input
                  autoFocus
                  className="w-full mb-4 px-2 py-1 rounded bg-gray-800 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-400/30"
                  value={state.value}
                  onChange={e => setState(s => (s && s.type === 'prompt') ? { ...s, value: e.target.value } : s)}
                  onKeyDown={e => { if (e.key === 'Enter') handleConfirm() }}
                />
              )}
              <div className="flex justify-end gap-2">
                {state.type !== 'alert' && (
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
                  >
                    {t('cancel')}
                  </button>
                )}
                <button
                  onClick={handleConfirm}
                  autoFocus={state.type !== 'prompt'}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500"
                >
                  {t('confirm')}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used within DialogProvider')
  return ctx
}


'use client'

import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Trash2, X } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { LIBRARY, libraryUrl } from '@/lib/library'
import { extractUploadErrorInfo, uploadImageToCloudinary } from '@/lib/uploadImage'

const PORTRAITS = LIBRARY.find((c) => c.id === 'portraits')

/**
 * Choix du portrait d'une fiche : un tiroir sur le côté gauche, avec les
 * portraits de la bibliothèque et l'envoi de sa propre image.
 */
export default function PortraitPicker({
  current,
  onPick,
  onClose,
}: {
  current?: string
  /** Adresse du portrait choisi ; une chaîne vide retire le portrait. */
  onPick: (url: string) => void
  onClose: () => void
}) {
  const t = useT()
  const { lang } = useLanguage()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const upload = async (file: File) => {
    setError('')
    setUploading(true)
    try {
      const res = await uploadImageToCloudinary(file)
      onPick(res.deliveryUrl || res.url)
    } catch (e) {
      const info = extractUploadErrorInfo(e)
      setError(info.code === 'SIGN_IN_REQUIRED' ? t('portraitUploadSignIn') : info.userMessage)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex" role="dialog" aria-modal="true" aria-label={t('portraitPickerTitle')}>
      <div
        className="flex h-full w-[min(26rem,100vw)] flex-col gap-3 border-r border-[var(--c-panel-line)] p-4 shadow-2xl backdrop-blur-md"
        style={{ background: 'var(--c-panel-head)' }}
      >
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">{t('portraitPickerTitle')}</h2>
          <button
            onClick={onClose}
            className="ui-btn ui-btn-ghost ui-btn-icon ml-auto"
            aria-label={t('close')}
            title={t('close')}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="ui-btn ui-btn-primary"
          >
            <ImagePlus size={15} />
            {uploading ? t('portraitUploading') : t('portraitUploadOwn')}
          </button>
          {current && (
            <button onClick={() => onPick('')} className="ui-btn ui-btn-ghost ui-btn-danger">
              <Trash2 size={14} />
              {t('portraitRemove')}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) void upload(file)
            }}
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-2 overflow-y-auto">
          {PORTRAITS?.items.map((item) => {
            const url = libraryUrl('portraits', item.id)
            const label = item.label[lang === 'fr' ? 'fr' : 'en']
            const selected = current === url
            return (
              <button
                key={item.id}
                onClick={() => onPick(url)}
                className={`ui-well group flex flex-col items-center gap-1 p-1.5 transition hover:!border-accent ${selected ? '!border-accent ring-1 ring-accent' : ''}`}
                title={label}
                aria-pressed={selected}
              >
                <img
                  src={libraryUrl('portraits', item.id, true)}
                  alt={label}
                  loading="lazy"
                  className="aspect-square w-full rounded-md object-cover"
                />
                <span className="w-full truncate text-center text-[11px] text-ink/70 group-hover:text-ink">
                  {label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      {/* Le reste de l'écran ferme le tiroir. */}
      <button className="flex-1 bg-black/40" onClick={onClose} aria-label={t('close')} tabIndex={-1} />
    </div>
  )
}

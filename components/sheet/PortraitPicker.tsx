'use client'

import { useEffect, useRef, useState } from 'react'
import { useSelf } from '@liveblocks/react'
import { Check, ImagePlus, Trash2, X } from 'lucide-react'
import { useT } from '@/lib/useT'
import { useLanguage } from '@/components/context/LanguageContext'
import { LIBRARY, libraryUrl, tokenInitial } from '@/lib/library'
import { extractUploadErrorInfo, uploadImageToCloudinary } from '@/lib/uploadImage'

const PORTRAITS = LIBRARY.find((c) => c.id === 'portraits')
const ALLY_PIONS = LIBRARY.find((c) => c.id === 'pions')

/**
 * Choix du portrait et du pion d'une fiche : un tiroir sur le côté gauche,
 * avec les images de la bibliothèque et l'envoi de sa propre image.
 */
export default function PortraitPicker({
  current,
  currentPion,
  name,
  onPick,
  onPickPion,
  onClose,
}: {
  current?: string
  currentPion?: string
  /** Nom du personnage, pour l'initiale du pion de couleur. */
  name?: string
  /** Adresse du portrait choisi ; une chaîne vide retire le portrait. */
  onPick: (url: string) => void
  /** Adresse du pion choisi ; une chaîne vide revient au pion de couleur. */
  onPickPion: (url: string) => void
  onClose: () => void
}) {
  const t = useT()
  const { lang } = useLanguage()
  const color = useSelf((me) => me.info?.color) ?? '#9ca3af'
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'portrait' | 'pion'>('portrait')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const l = lang === 'fr' ? 'fr' : 'en'

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
      ;(tab === 'pion' ? onPickPion : onPick)(res.deliveryUrl || res.url)
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

        <div className="ui-seg" role="tablist">
          <button role="tab" aria-selected={tab === 'portrait'} onClick={() => setTab('portrait')}>{t('portraitTab')}</button>
          <button role="tab" aria-selected={tab === 'pion'} onClick={() => setTab('pion')}>{t('pionTab')}</button>
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
          {tab === 'portrait' && current && (
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

        {tab === 'pion' ? (
          <>
            <p className="text-xs text-ink/60">{t('pionPickerHint')}</p>
            <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-2 overflow-y-auto">
              <PionTile selected={!currentPion} label={t('pionColor')} title={t('pionColorHint')} onClick={() => onPickPion('')}>
                <span
                  className="flex aspect-square w-3/4 items-center justify-center rounded-full border-2 border-white/80 text-2xl font-bold text-white shadow"
                  style={{ background: color }}
                >
                  {tokenInitial(name)}
                </span>
              </PionTile>
              {currentPion && !currentPion.startsWith('/bibliotheque/') && (
                <PionTile selected label={t('portraitUploadOwn')} onClick={() => onPickPion(currentPion)}>
                  <img src={currentPion} alt="" className="aspect-square w-full rounded-md object-contain" />
                </PionTile>
              )}
              {ALLY_PIONS?.items.map((item) => {
                const url = libraryUrl('pions', item.id)
                return (
                  <PionTile key={item.id} selected={currentPion === url} label={item.label[l]} onClick={() => onPickPion(url)}>
                    <img
                      src={libraryUrl('pions', item.id, true)}
                      alt={item.label[l]}
                      loading="lazy"
                      className="aspect-square w-full rounded-md object-contain"
                    />
                  </PionTile>
                )
              })}
            </div>
          </>
        ) : (
        <div className="grid min-h-0 flex-1 grid-cols-3 content-start gap-2 overflow-y-auto">
          {PORTRAITS?.items.map((item) => {
            const url = libraryUrl('portraits', item.id)
            const label = item.label[l]
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
        )}
      </div>
      {/* Le reste de l'écran ferme le tiroir. */}
      <button className="flex-1 bg-black/40" onClick={onClose} aria-label={t('close')} tabIndex={-1} />
    </div>
  )
}

function PionTile({ selected, label, title, onClick, children }: {
  selected: boolean
  label: string
  title?: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`ui-well group relative flex flex-col items-center justify-center gap-1 p-1.5 transition hover:!border-accent ${selected ? '!border-accent ring-1 ring-accent' : ''}`}
      title={title ?? label}
      aria-pressed={selected}
    >
      {children}
      <span className="w-full truncate text-center text-[11px] text-ink/70 group-hover:text-ink">{label}</span>
      {selected && (
        <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white shadow">
          <Check size={12} />
        </span>
      )}
    </button>
  )
}

'use client'

import { useState, type ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import { useT } from '@/lib/useT'

/** Briques communes aux éditeurs de l'atelier du MJ. */

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="ui-well space-y-3 p-4">
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-ink/60">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="ui-label">{label}</span>
      {children}
      {hint && <span className="text-xs text-ink/50">{hint}</span>}
    </label>
  )
}

/** Bouton discret pour retirer une ligne. */
export function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="ui-btn ui-btn-ghost ui-btn-icon shrink-0" aria-label={label} title={label}>
      <X size={14} />
    </button>
  )
}

/** Champ et bouton pour ajouter une ligne nommée (valeur, ressource, type). */
export function AddRow({ placeholder, onAdd, disabled, max }: { placeholder: string; onAdd: (label: string) => void; disabled?: boolean; max: number }) {
  const t = useT()
  const [label, setLabel] = useState('')
  const add = () => {
    const value = label.trim()
    if (!value || disabled) return
    onAdd(value)
    setLabel('')
  }
  return (
    <div className="flex gap-2">
      <input
        className="ui-input min-w-0 flex-1"
        value={label}
        maxLength={max}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            add()
          }
        }}
      />
      <button type="button" className="ui-btn" onClick={add} disabled={disabled || !label.trim()}>
        <Plus size={14} />
        {t('atelierAdd')}
      </button>
    </div>
  )
}

/** Télécharge une création en fichier JSON, pour la garder ou la donner. */
export function downloadJson(name: string, content: unknown) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `${(name || 'creation').replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 60)}.json`,
  })
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Contenu d'un fichier JSON choisi par le MJ ; `null` s'il ne se lit pas. */
export async function readJsonFile(file: File): Promise<unknown> {
  if (file.size > 1024 * 1024) return null
  try {
    return JSON.parse(await file.text())
  } catch {
    return null
  }
}

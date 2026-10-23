'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CustomSystemData } from './customSystem'
import type { Adventure } from './autoGm/types'

/** Créations rangées sur le compte du MJ (`app/api/creations`). */
export type CreationKind = 'system' | 'campaign'
type DataOf<K extends CreationKind> = K extends 'system' ? CustomSystemData : Adventure
export type Creation<K extends CreationKind = CreationKind> = { id: string; name: string; data: DataOf<K>; shared: boolean }

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init })
  const data = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string }
  if (!res.ok || data.ok === false) throw new Error(data.error || 'Request failed')
  return data
}

export async function listCreations<K extends CreationKind>(kind: K): Promise<Creation<K>[]> {
  const data = await call<{ creations?: Creation<K>[] }>(`/api/creations?kind=${kind}`)
  return Array.isArray(data.creations) ? data.creations : []
}

/** Une création à soi, ou partagée par son auteur (lien de partage). */
export async function readCreation<K extends CreationKind>(kind: K, id: string) {
  const data = await call<{ creation: Creation<K> & { mine: boolean } }>(`/api/creations?kind=${kind}&id=${encodeURIComponent(id)}`)
  return data.creation
}

/** Enregistre ; sans `id`, crée une nouvelle entrée. Renvoie l'identifiant et le contenu remis en forme. */
export async function saveCreation<K extends CreationKind>(kind: K, data: DataOf<K>, shared: boolean, id?: string) {
  return call<{ id: string; data: DataOf<K> }>('/api/creations', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, data, shared, ...(id ? { id } : {}) }),
  })
}

export async function deleteCreation(id: string) {
  await call(`/api/creations?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/** Les créations du compte connecté ; liste vide sans compte ou en cas d'erreur. */
export function useMyCreations<K extends CreationKind>(kind: K, enabled = true) {
  const [items, setItems] = useState<Creation<K>[]>([])
  const [loaded, setLoaded] = useState(false)
  const reload = useCallback(() => {
    listCreations(kind)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoaded(true))
  }, [kind])
  useEffect(() => {
    if (enabled) reload()
  }, [enabled, reload])
  return { items, loaded, reload }
}

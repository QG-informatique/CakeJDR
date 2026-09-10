'use client'

import type { ApiSuccess } from '@/types/api'
import { type Character, normalizeCharacter } from '@/types/character'

/**
 * Fiches de personnage enregistrées sur le compte.
 *
 * Les routes exigent une session : un visiteur reçoit une erreur, qu'on
 * remonte telle quelle à l'appelant.
 */

async function requireOk<T extends { ok?: boolean; error?: string }>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

/** Fiches du compte, les plus récemment modifiées en premier. */
export async function listAccountCharacters(): Promise<Character[]> {
  const res = await fetch('/api/characters', { cache: 'no-store' })
  const data = await requireOk<ApiSuccess<{ characters: unknown[] }>>(res)
  const list = Array.isArray(data.characters) ? data.characters : []
  return list.map((c) => normalizeCharacter(c as Character))
}

/** Enregistre la fiche sur le compte, ou la met à jour si elle y est déjà. */
export async function saveAccountCharacter(character: Character): Promise<void> {
  const res = await fetch('/api/characters', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ character }),
  })
  await requireOk(res)
}

/** Retire la fiche du compte. */
export async function deleteAccountCharacter(id: string): Promise<void> {
  const res = await fetch(`/api/characters?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  await requireOk(res)
}

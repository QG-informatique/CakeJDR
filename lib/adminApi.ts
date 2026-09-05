'use client'

import type { ApiSuccess } from '@/types/api'

async function requireOk<T extends { ok?: boolean; error?: string }>(
  res: Response,
): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

/** État admin de la session courante (affichage uniquement). */
export async function fetchAdminStatus() {
  const res = await fetch('/api/admin/me', { cache: 'no-store' })
  return requireOk<ApiSuccess<{ isAdmin: boolean; configured: boolean }>>(res)
}

export async function adminLogin(password: string) {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return requireOk<ApiSuccess<{ isAdmin: boolean }>>(res)
}

export async function adminLogout() {
  const res = await fetch('/api/admin/login', { method: 'DELETE' })
  return requireOk<ApiSuccess<{ isAdmin: boolean }>>(res)
}

export async function adminDeleteRooms(ids: string[]) {
  const res = await fetch('/api/admin/rooms', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  return requireOk<
    ApiSuccess<{ deleted: string[]; failed: Array<{ id: string; error: string }> }>
  >(res)
}

export async function adminClearPassword(id: string) {
  const res = await fetch('/api/admin/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'clearPassword', id }),
  })
  return requireOk<ApiSuccess<{ id: string }>>(res)
}

export async function adminRenameRoom(id: string, name: string) {
  const res = await fetch('/api/admin/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'rename', id, name }),
  })
  return requireOk<ApiSuccess<{ id: string; name: string }>>(res)
}

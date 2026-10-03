'use client'

import type {
  ApiSuccess,
  RoomInfoResponse,
} from '@/types/api'

async function readJson<T>(res: Response): Promise<T> {
  return (await res.json().catch(() => ({}))) as T
}

async function requireOk<T extends { ok?: boolean; error?: string }>(
  res: Response,
): Promise<T> {
  const data = await readJson<T>(res)
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

export async function fetchRooms(): Promise<RoomInfoResponse[]> {
  const res = await fetch('/api/rooms/list', { cache: 'no-store' })
  const data = await requireOk<ApiSuccess<{ rooms: RoomInfoResponse[] }>>(res)
  return Array.isArray(data.rooms) ? data.rooms : []
}

/** Demande au serveur un jeton d'accès aux données de la table (membres seulement). */
async function requestRoomToken(roomId: string) {
  const res = await fetch('/api/rooms/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: roomId }),
  })
  return requireOk<ApiSuccess<{
    /** Token HMAC signé côté serveur, valide 10 minutes. */
    accessToken: string
    ts: number
  }>>(res)
}

/** Le serveur émet des jetons valables 10 min ; on rafraîchit avant la fin. */
const TOKEN_REFRESH_BEFORE_MS = 9 * 60 * 1000

function readStoredToken(roomId: string): { accessToken: string; ts: number } | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    const accessToken = sessionStorage.getItem(`room_token_${roomId}`)
    const tsRaw = sessionStorage.getItem(`room_token_ts_${roomId}`)
    if (!accessToken || !tsRaw) return null
    const ts = Number(tsRaw)
    if (!Number.isFinite(ts)) return null
    if (Date.now() - ts > TOKEN_REFRESH_BEFORE_MS) return null
    return { accessToken, ts }
  } catch {
    return null
  }
}

function storeToken(roomId: string, accessToken: string, ts: number) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(`room_token_${roomId}`, accessToken)
    sessionStorage.setItem(`room_token_ts_${roomId}`, String(ts))
  } catch {}
}

/**
 * Renvoie un jeton d'accès valide pour la room, en en demandant un au serveur
 * si nécessaire. Renvoie `null` si l'appelant n'est pas membre de la table.
 */
async function ensureRoomToken(
  roomId: string,
): Promise<{ accessToken: string; ts: number } | null> {
  const cached = readStoredToken(roomId)
  if (cached) return cached
  try {
    const result = await requestRoomToken(roomId)
    if (result.accessToken && result.ts != null) {
      storeToken(roomId, result.accessToken, result.ts)
      return { accessToken: result.accessToken, ts: result.ts }
    }
    return null
  } catch {
    // 403 (pas membre), 429, ou réseau indisponible
    return null
  }
}

/** En-têtes d'accès à joindre aux routes de données d'une room. */
export async function roomAuthHeaders(
  roomId: string,
): Promise<Record<string, string> | null> {
  const token = await ensureRoomToken(roomId)
  if (!token) return null
  return {
    'x-room-token': token.accessToken,
    'x-room-token-ts': String(token.ts),
  }
}

export async function createRoom(payload: { name: string }) {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return requireOk<ApiSuccess<{ id: string }>>(res)
}

export async function deleteRoomById(id: string) {
  const res = await fetch('/api/rooms', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
  return requireOk<ApiSuccess<{ id?: string }>>(res)
}

export async function renameRoomById(id: string, name: string) {
  const res = await fetch('/api/rooms', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name }),
  })
  return requireOk<ApiSuccess<{ id?: string }>>(res)
}

/** Rejoint une table à partir de son code d'invitation. */
export async function joinRoomByCode(code: string) {
  const res = await fetch('/api/rooms/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  return requireOk<ApiSuccess<{ id: string; name: string }>>(res)
}

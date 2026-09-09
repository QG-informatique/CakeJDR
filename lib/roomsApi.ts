'use client'

import type {
  ApiSuccess,
  RoomInfoResponse,
} from '@/types/api'

const OWNER_KEY_PREFIX = 'jdr_room_owner_'

/**
 * Secret de propriété d'une room, remis une seule fois par le serveur à la
 * création. Sans lui (et sans session admin) le serveur refuse toute
 * suppression ou renommage.
 */
export function getRoomOwnerSecret(roomId: string): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(OWNER_KEY_PREFIX + roomId)
  } catch {
    return null
  }
}

export function storeRoomOwnerSecret(roomId: string, secret: string) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(OWNER_KEY_PREFIX + roomId, secret)
  } catch {
    // quota / mode privé : la room reste utilisable, seule la gestion est perdue
  }
}

export function forgetRoomOwnerSecret(roomId: string) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(OWNER_KEY_PREFIX + roomId)
  } catch {}
}

/** True si ce navigateur détient le secret de propriété de la room. */
export function ownsRoom(roomId: string): boolean {
  return Boolean(getRoomOwnerSecret(roomId))
}

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

export async function verifyRoomPassword(roomId: string, password: string) {
  const res = await fetch('/api/rooms/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: roomId, password }),
  })
  return requireOk<ApiSuccess<{
    guarded: boolean
    /** Token HMAC signé côté serveur, valide 10 minutes. Présent seulement si guarded=true. */
    accessToken?: string
    ts?: number
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
 * Vérifie le mot de passe puis mémorise le token d'accès en sessionStorage.
 * `Room.tsx` le relit pour authentifier la connexion Liveblocks : sans cette
 * étape, une room protégée renvoie 401 à l'entrée.
 */
export async function verifyAndStoreRoomToken(roomId: string, password: string) {
  const result = await verifyRoomPassword(roomId, password)
  if (result.accessToken && result.ts != null) {
    storeToken(roomId, result.accessToken, result.ts)
  }
  return result
}

/**
 * Renvoie un jeton d'accès valide pour la room, en en demandant un au serveur
 * si nécessaire. Renvoie `null` si la room est protégée et qu'aucun mot de
 * passe n'a encore été validé — à l'appelant d'inviter l'utilisateur à le saisir.
 */
export async function ensureRoomToken(
  roomId: string,
): Promise<{ accessToken: string; ts: number } | null> {
  const cached = readStoredToken(roomId)
  if (cached) return cached
  try {
    const result = await verifyRoomPassword(roomId, '')
    if (result.accessToken && result.ts != null) {
      storeToken(roomId, result.accessToken, result.ts)
      return { accessToken: result.accessToken, ts: result.ts }
    }
    return null
  } catch {
    // 401 (room protégée), 429, ou réseau indisponible
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

export async function createRoom(payload: { name: string; password?: string }) {
  const res = await fetch('/api/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await requireOk<ApiSuccess<{ id: string; ownerSecret?: string }>>(res)
  if (data.ownerSecret) {
    storeRoomOwnerSecret(data.id, data.ownerSecret)
  }
  return data
}

export async function deleteRoomById(id: string) {
  const res = await fetch('/api/rooms', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ownerSecret: getRoomOwnerSecret(id) }),
  })
  const data = await requireOk<ApiSuccess<{ id?: string }>>(res)
  forgetRoomOwnerSecret(id)
  return data
}

export async function renameRoomById(id: string, name: string) {
  const res = await fetch('/api/rooms', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, name, ownerSecret: getRoomOwnerSecret(id) }),
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

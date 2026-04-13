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

export async function verifyRoomPassword(roomId: string, password: string) {
  const res = await fetch('/api/rooms/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: roomId, password }),
  })
  return requireOk<ApiSuccess<{ guarded: boolean }>>(res)
}

export async function createRoom(payload: { name: string; password?: string }) {
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

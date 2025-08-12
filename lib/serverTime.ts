// [FIX #2] synchronize client time with server
let offset = 0

export async function syncServerTime() {
  try {
    const res = await fetch('/api/time')
    if (!res.ok) return
    const data = await res.json()
    offset = data.ts - Date.now()
  } catch {
    // ignore
  }
}

export function serverNow() {
  return Date.now() + offset
}

/** Envoie une action à `/api/check` (demande, annulation ou jet). */
export async function postCheck<T = { id?: string }>(roomId: string, payload: Record<string, unknown>) {
  const res = await fetch('/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomId, ...payload }),
  })
  const data = (await res.json().catch(() => null)) as T | null
  if (!res.ok) throw new Error(`check ${res.status}`)
  return data
}

export const runtime = 'nodejs'

import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rooms } from '@/lib/db/schema'
import { ok } from '@/lib/api-response'

/**
 * Renseigne le client sur la salle de démonstration.
 *
 * Publique et sans authentification : c'est précisément la porte d'entrée
 * proposée aux visiteurs qui n'ont pas encore de compte.
 */
export async function GET() {
  const rows = await db
    .select({ id: rooms.id, name: rooms.name })
    .from(rooms)
    .where(eq(rooms.isDemo, true))
    .limit(1)

  const room = rows[0]
  return ok({ roomId: room?.id ?? null, name: room?.name ?? null })
}

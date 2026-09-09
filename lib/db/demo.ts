import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from './index'
import { rooms } from './schema'
import { restoreSnapshot, type DemoSnapshot } from '../demoRoom'

/**
 * Remet une salle de démonstration à son état de référence si personne n'y est.
 *
 * Déclenché à l'entrée plutôt que sur une minuterie : c'est le seul moment où
 * l'on sait qu'un visiteur arrive, et restaurer une salle occupée effacerait
 * le travail de ceux qui y sont. Deux visiteurs présents en même temps
 * partagent donc la même session, ce qui est le comportement attendu d'une
 * application multijoueur.
 */
export async function resetDemoRoomIfEmpty(roomId: string, usersConnected: number) {
  if (usersConnected > 0) return false

  const rows = await db
    .select({ snapshot: rooms.demoSnapshot })
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.isDemo, true)))
    .limit(1)

  const snapshot = rows[0]?.snapshot
  if (!snapshot) return false

  await restoreSnapshot(roomId, snapshot as DemoSnapshot)
  return true
}

/** True si la salle est une salle de démonstration. */
export async function isDemoRoom(roomId: string) {
  const rows = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.isDemo, true)))
    .limit(1)
  return rows.length > 0
}

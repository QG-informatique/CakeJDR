import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from './index'
import { roomMembers, rooms } from './schema'

/**
 * Enregistre une table en base et inscrit son créateur comme MJ.
 *
 * Liveblocks reste la source de vérité du contenu de la partie ; la base
 * porte ce que Liveblocks ne sait pas dire — qui possède quoi, et qui a le
 * droit d'entrer.
 */
export async function recordRoom(params: {
  id: string
  name: string
  ownerId: string
  passwordHash?: string | null
}) {
  await db
    .insert(rooms)
    .values({
      id: params.id,
      name: params.name,
      ownerId: params.ownerId,
      passwordHash: params.passwordHash ?? null,
    })
    .onConflictDoNothing()

  await db
    .insert(roomMembers)
    .values({ roomId: params.id, userId: params.ownerId, role: 'gm' })
    .onConflictDoNothing()
}

/** True si ce compte est le propriétaire enregistré de la table. */
export async function isRoomOwner(roomId: string, userId: string | null | undefined) {
  if (!userId) return false
  const rows = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.ownerId, userId)))
    .limit(1)
  return rows.length > 0
}

/** Supprime la table de la base. Liveblocks est nettoye separement. */
export async function forgetRoom(roomId: string) {
  await db.delete(rooms).where(eq(rooms.id, roomId))
}

/** Renomme la table en base pour rester coherent avec Liveblocks. */
export async function renameRoomRecord(roomId: string, name: string) {
  await db.update(rooms).set({ name }).where(eq(rooms.id, roomId))
}

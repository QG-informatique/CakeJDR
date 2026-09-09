import 'server-only'
import { randomBytes } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { db } from './index'
import { roomMembers, rooms } from './schema'

/**
 * Code d'invitation : six caractères, sans les lettres et chiffres qu'on
 * confond en les dictant (0/O, 1/I/L).
 */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateJoinCode(length = 6) {
  const bytes = randomBytes(length)
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length]
  }
  return out
}

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
      joinCode: generateJoinCode(),
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

/**
 * Tables visibles par un joueur : uniquement celles dont il est membre.
 *
 * Il n'existe volontairement aucun annuaire public. On ne joue pas au jeu de
 * rôle avec des inconnus qui passent : on invite les gens qu'on veut.
 */
export async function listRoomsForUser(userId: string) {
  return db
    .select({
      id: rooms.id,
      name: rooms.name,
      ownerId: rooms.ownerId,
      joinCode: rooms.joinCode,
      role: roomMembers.role,
      createdAt: rooms.createdAt,
      lastActiveAt: rooms.lastActiveAt,
      hasPassword: rooms.passwordHash,
    })
    .from(roomMembers)
    .innerJoin(rooms, eq(rooms.id, roomMembers.roomId))
    .where(eq(roomMembers.userId, userId))
    .orderBy(desc(rooms.lastActiveAt))
}

/** Retrouve une table par son code d'invitation. */
export async function findRoomByJoinCode(code: string) {
  const rows = await db
    .select()
    .from(rooms)
    .where(eq(rooms.joinCode, code.trim().toUpperCase()))
    .limit(1)
  return rows[0] ?? null
}

/** Inscrit un joueur dans une table. Sans effet s'il y est déjà. */
export async function addMember(roomId: string, userId: string, role = 'player') {
  await db
    .insert(roomMembers)
    .values({ roomId, userId, role })
    .onConflictDoNothing()
}

/** Membres d'une table, pour l'affichage administrateur. */
export async function listMembers(roomId: string) {
  return db
    .select({ userId: roomMembers.userId, role: roomMembers.role, joinedAt: roomMembers.joinedAt })
    .from(roomMembers)
    .where(eq(roomMembers.roomId, roomId))
}

/** True si le joueur est membre de la table. */
export async function isRoomMember(roomId: string, userId: string | null | undefined) {
  if (!userId) return false
  const rows = await db
    .select({ userId: roomMembers.userId })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
    .limit(1)
  return rows.length > 0
}

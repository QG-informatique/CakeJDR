import 'server-only'
import { randomBytes } from 'node:crypto'
import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm'
import { db } from './index'
import { roomMembers, rooms, users } from './schema'

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
}) {
  await db
    .insert(rooms)
    .values({
      id: params.id,
      name: params.name,
      ownerId: params.ownerId,
      joinCode: generateJoinCode(),
    })
    .onConflictDoNothing()

  await db
    .insert(roomMembers)
    .values({ roomId: params.id, userId: params.ownerId, role: 'gm' })
    .onConflictDoNothing()
}

/** Nombre de tables dont ce compte est le MJ. */
export async function countOwnedRooms(userId: string) {
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(rooms)
    .where(eq(rooms.ownerId, userId))
  return rows[0]?.n ?? 0
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
      isDemo: rooms.isDemo,
      role: roomMembers.role,
      createdAt: rooms.createdAt,
      lastActiveAt: rooms.lastActiveAt,
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

/** Rôle du joueur dans la table, ou `null` s'il n'en est pas membre. */
export async function getMemberRole(
  roomId: string,
  userId: string,
): Promise<'gm' | 'player' | null> {
  const rows = await db
    .select({ role: roomMembers.role })
    .from(roomMembers)
    .where(and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId)))
    .limit(1)
  const role = rows[0]?.role
  if (!role) return null
  return role === 'gm' ? 'gm' : 'player'
}

/**
 * Note qu'une table vient d'être ouverte. Une écriture par heure au plus :
 * la date sert au nettoyage des tables abandonnées, pas à la minute près.
 */
export async function touchRoom(roomId: string) {
  await db
    .update(rooms)
    .set({ lastActiveAt: new Date() })
    .where(and(eq(rooms.id, roomId), lt(rooms.lastActiveAt, sql`now() - interval '1 hour'`)))
}

export type RoomMember = { userId: string; pseudo: string; color: string; role: string }

/**
 * Membres de chaque table, MJ d'abord puis joueurs par ordre alphabétique.
 * Sans liste d'identifiants : toutes les tables (vue administrateur).
 */
export async function listRoomMembers(roomIds?: string[]): Promise<Map<string, RoomMember[]>> {
  if (roomIds && roomIds.length === 0) return new Map()
  const rows = await db
    .select({
      roomId: roomMembers.roomId,
      userId: roomMembers.userId,
      role: roomMembers.role,
      pseudo: users.pseudo,
      color: users.color,
    })
    .from(roomMembers)
    .innerJoin(users, eq(users.id, roomMembers.userId))
    .where(roomIds ? inArray(roomMembers.roomId, roomIds) : undefined)

  const byRoom = new Map<string, RoomMember[]>()
  for (const { roomId, ...m } of rows) {
    const list = byRoom.get(roomId) ?? []
    list.push(m)
    byRoom.set(roomId, list)
  }
  for (const list of byRoom.values()) {
    list.sort((a, b) =>
      a.role === b.role ? a.pseudo.localeCompare(b.pseudo) : a.role === 'gm' ? -1 : 1,
    )
  }
  return byRoom
}

export type RoomAccess = {
  joinCode: string
  isDemo: boolean
  lastActiveAt: string
  members: Array<{ pseudo: string; role: string }>
}

/** Qui a accès à chaque table, pour le panneau d'administration. */
export async function listAllRoomAccess(): Promise<Map<string, RoomAccess>> {
  const rows = await db
    .select({
      roomId: rooms.id,
      joinCode: rooms.joinCode,
      isDemo: rooms.isDemo,
      lastActiveAt: rooms.lastActiveAt,
      role: roomMembers.role,
      pseudo: users.pseudo,
    })
    .from(rooms)
    .leftJoin(roomMembers, eq(roomMembers.roomId, rooms.id))
    .leftJoin(users, eq(users.id, roomMembers.userId))

  const byRoom = new Map<string, RoomAccess>()
  for (const r of rows) {
    let entry = byRoom.get(r.roomId)
    if (!entry) {
      entry = {
        joinCode: r.joinCode,
        isDemo: r.isDemo,
        lastActiveAt: r.lastActiveAt.toISOString(),
        members: [],
      }
      byRoom.set(r.roomId, entry)
    }
    if (r.pseudo && r.role) entry.members.push({ pseudo: r.pseudo, role: r.role })
  }
  // Le MJ d'abord, puis les joueurs par ordre alphabétique.
  for (const entry of byRoom.values()) {
    entry.members.sort((a, b) =>
      a.role === b.role ? a.pseudo.localeCompare(b.pseudo) : a.role === 'gm' ? -1 : 1,
    )
  }
  return byRoom
}

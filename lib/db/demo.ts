import 'server-only'
import { and, eq } from 'drizzle-orm'
import { db } from './index'
import { rooms } from './schema'
import { Liveblocks } from '@liveblocks/node'
import { restoreSnapshot, type DemoSnapshot } from '../demoRoom'
import { isDemoCopyId, newDemoCopyId } from '../demoCopy'

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

/** True si la salle est une salle de démonstration, ou la copie d'un visiteur. */
export async function isDemoRoom(roomId: string) {
  if (isDemoCopyId(roomId)) return true
  const rows = await db
    .select({ id: rooms.id })
    .from(rooms)
    .where(and(eq(rooms.id, roomId), eq(rooms.isDemo, true)))
    .limit(1)
  return rows.length > 0
}

/** La salle de démonstration de référence, avec son état de départ. */
export async function mainDemoRoom() {
  const rows = await db
    .select({ id: rooms.id, name: rooms.name, snapshot: rooms.demoSnapshot })
    .from(rooms)
    .where(eq(rooms.isDemo, true))
    .limit(1)
  return rows[0] ?? null
}

/**
 * Salle de démo d'un visiteur : celle qu'il avait déjà si elle existe encore,
 * sinon une copie neuve de l'état de référence. Sans état de référence (ou si
 * Liveblocks refuse, ou `allowNew` faux), le visiteur entre dans la salle de
 * démo partagée.
 */
export async function demoRoomForVisitor(previous: string | null, allowNew = true): Promise<string | null> {
  const main = await mainDemoRoom()
  if (!main) return null
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret || !main.snapshot) return main.id
  const liveblocks = new Liveblocks({ secret })

  if (previous && isDemoCopyId(previous)) {
    const room = await liveblocks.getRoom(previous).catch(() => null)
    if (room) return previous
  }

  const id = allowNew ? newDemoCopyId() : null
  if (!id) return main.id
  try {
    await liveblocks.createRoom(id, { defaultAccesses: [], metadata: { name: main.name, demoOf: main.id } })
    await restoreSnapshot(id, main.snapshot as DemoSnapshot)
    return id
  } catch (e) {
    console.error('demoRoomForVisitor', e)
    await liveblocks.deleteRoom(id).catch(() => {})
    return main.id
  }
}

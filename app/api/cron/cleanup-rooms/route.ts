export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { and, eq, lt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rooms } from '@/lib/db/schema'
import { forgetRoom } from '@/lib/db/rooms'
import { deleteRoom } from '@/lib/liveRooms'
import { isAdminRequest } from '@/lib/adminAuth'
import { ROOM_INACTIVE_DAYS } from '@/lib/roomLifecycle'
import { fail, ok } from '@/lib/api-response'

/**
 * Supprime les tables où personne n'est entré depuis six mois.
 *
 * Le MJ en est prévenu dans le menu un mois avant (`lib/roomLifecycle.ts`) ;
 * entrer dans la table suffit à la garder. Les salles de démonstration ne
 * sont jamais concernées.
 *
 * Appelée chaque jour par la tâche planifiée Vercel. Un administrateur peut
 * l'appeler avec `?dry=1` pour voir ce qui partirait, sans rien supprimer.
 */
async function authorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const header = req.headers.get('authorization')
  if (cronSecret && header === `Bearer ${cronSecret}`) return true
  return isAdminRequest()
}

export async function GET(req: NextRequest) {
  if (!(await authorized(req))) return fail('forbidden', 403)
  const dry = new URL(req.url).searchParams.get('dry') === '1'

  const cutoff = new Date(Date.now() - ROOM_INACTIVE_DAYS * 24 * 60 * 60 * 1000)
  const stale = await db
    .select({ id: rooms.id, name: rooms.name })
    .from(rooms)
    .where(and(eq(rooms.isDemo, false), lt(rooms.lastActiveAt, cutoff)))

  if (dry) return ok({ dry: true, wouldDelete: stale })

  const deleted: string[] = []
  const failed: string[] = []
  for (const room of stale) {
    try {
      await deleteRoom(room.id).catch((e: unknown) => {
        // Déjà absente chez Liveblocks : il reste seulement la base à nettoyer.
        if ((e as { status?: number })?.status !== 404) throw e
      })
      await forgetRoom(room.id)
      deleted.push(room.id)
    } catch (e) {
      console.error('cleanup-rooms', room.id, e)
      failed.push(room.id)
    }
  }
  return ok({ deleted, failed })
}

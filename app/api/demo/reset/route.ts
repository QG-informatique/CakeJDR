export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { rooms } from '@/lib/db/schema'
import { restoreSnapshot, type DemoSnapshot } from '@/lib/demoRoom'
import { isAdminRequest } from '@/lib/adminAuth'
import { fail, ok } from '@/lib/api-response'

/**
 * Remet les salles de démonstration dans leur état de référence.
 *
 * Appelée par la tâche planifiée Vercel, et manuellement par un
 * administrateur. Deux clés d'entrée : l'en-tête de la tâche planifiée, ou
 * une session administrateur.
 */
async function authorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const header = req.headers.get('authorization')
  if (cronSecret && header === `Bearer ${cronSecret}`) return true
  return isAdminRequest()
}

export async function POST(req: NextRequest) {
  if (!(await authorized(req))) return fail('forbidden', 403)

  const demoRooms = await db
    .select({ id: rooms.id, snapshot: rooms.demoSnapshot })
    .from(rooms)
    .where(eq(rooms.isDemo, true))

  const restored: string[] = []
  const skipped: string[] = []

  for (const room of demoRooms) {
    if (!room.snapshot) {
      // Pas encore de reference capturee : rien a restaurer.
      skipped.push(room.id)
      continue
    }
    try {
      await restoreSnapshot(room.id, room.snapshot as DemoSnapshot)
      restored.push(room.id)
    } catch (e) {
      console.error('demo reset', room.id, e)
      skipped.push(room.id)
    }
  }

  return ok({ restored, skipped })
}

/** Vercel appelle les taches planifiees en GET. */
export async function GET(req: NextRequest) {
  return POST(req)
}

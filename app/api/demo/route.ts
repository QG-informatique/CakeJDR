export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { demoRoomForVisitor, isDemoRoom, mainDemoRoom } from '@/lib/db/demo'
import { clientIp, rateLimit } from '@/lib/rateLimit'
import { fail, ok } from '@/lib/api-response'

/**
 * Renseigne le client sur la salle de démonstration.
 *
 * Publique et sans authentification : c'est précisément la porte d'entrée
 * proposée aux visiteurs qui n'ont pas encore de compte. Avec `?room=`, dit en
 * plus si cette salle est une salle de démo (la référence ou une copie).
 */
export async function GET(req: NextRequest) {
  const main = await mainDemoRoom()
  const room = req.nextUrl.searchParams.get('room')
  const isDemo = room ? await isDemoRoom(room).catch(() => false) : false
  return ok({ roomId: main?.id ?? null, name: main?.name ?? null, isDemo })
}

/** Copies créées par adresse IP : de quoi revenir plusieurs fois, pas de quoi remplir Liveblocks. */
const VISIT_LIMIT = 10
const VISIT_WINDOW_MS = 60 * 60 * 1000

/**
 * Donne au visiteur sa propre salle de démo. `previous` est celle qu'il avait
 * reçue la dernière fois (gardée par son navigateur) : il la retrouve telle
 * qu'il l'a laissée tant qu'elle n'a pas été nettoyée.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { previous?: unknown }
  const previous = typeof body.previous === 'string' ? body.previous : null

  // Au-delà du quota, plus de copie neuve : sa copie s'il en a une, sinon la
  // salle de démo partagée.
  const limit = rateLimit(`demo-visit:${clientIp(req)}`, VISIT_LIMIT, VISIT_WINDOW_MS)

  try {
    return ok({ roomId: await demoRoomForVisitor(previous, limit.allowed) })
  } catch (e) {
    console.error('demo visit', e)
    return fail('demo unavailable', 500)
  }
}

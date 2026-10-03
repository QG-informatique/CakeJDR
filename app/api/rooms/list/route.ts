export const runtime = 'nodejs'

import { listRooms } from '@/lib/liveRooms'
import { listRoomsForUser } from '@/lib/db/rooms'
import { currentUserId } from '@/lib/db/users'
import { isAdminRequest } from '@/lib/adminAuth'
import { debug } from '@/lib/debug'
import { fail, ok } from '@/lib/api-response'

/**
 * Tables visibles par l'appelant.
 *
 * Il n'y a pas d'annuaire public : un joueur ne voit que les tables dont il
 * est membre, c'est-à-dire celles qu'il a créées ou rejointes avec un code
 * d'invitation. Un administrateur voit tout, pour pouvoir modérer.
 */
export async function GET() {
  try {
    if (await isAdminRequest()) {
      const all = await listRooms()
      debug('rooms list (admin)', all.length)
      return ok({ rooms: all, scope: 'admin' })
    }

    const userId = await currentUserId()
    if (!userId) {
      // Visiteur non connecté : rien à montrer, et c'est voulu.
      return ok({ rooms: [], scope: 'anonymous' })
    }

    const mine = await listRoomsForUser(userId)
    debug('rooms list (user)', mine.length)
    return ok({
      rooms: mine.map((r) => ({
        id: r.id,
        name: r.name,
        hasPassword: Boolean(r.hasPassword),
        hasOwner: true,
        role: r.role,
        // Le code n'est montré qu'au MJ : c'est lui qui invite.
        joinCode: r.role === 'gm' ? r.joinCode : undefined,
        createdAt: r.createdAt?.toISOString(),
        updatedAt: r.lastActiveAt?.toISOString(),
        usersConnected: 0,
      })),
      scope: 'member',
    })
  } catch (e) {
    console.error('rooms/list', e)
    return fail('Failed to list rooms', 500)
  }
}

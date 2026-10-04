export const runtime = 'nodejs'

import { activeUserIds, listRooms } from '@/lib/liveRooms'
import { listAllRoomAccess, listRoomMembers, listRoomsForUser, type RoomMember } from '@/lib/db/rooms'
import { currentUserId } from '@/lib/db/users'
import { isAdminRequest } from '@/lib/adminAuth'
import { debug } from '@/lib/debug'
import { fail, ok } from '@/lib/api-response'

/**
 * Membres de la table avec, pour chacun, s'il y est en ce moment. Les
 * identifiants de compte ne quittent pas le serveur. `guestsOnline` compte
 * les présents qui ne sont pas membres : visiteurs de la démo, admin.
 */
async function presence(roomId: string, members: RoomMember[]) {
  const ids = (await activeUserIds(roomId)) ?? new Set<string>()
  const memberIds = new Set(members.map((m) => m.userId))
  return {
    usersConnected: ids.size,
    guestsOnline: [...ids].filter((id) => !memberIds.has(id)).length,
    members: members.map(({ pseudo, color, role, userId }) => ({
      pseudo,
      color,
      role,
      online: ids.has(userId),
    })),
  }
}

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
      const [all, access, members, me] = await Promise.all([
        listRooms({ withCounts: false }),
        listAllRoomAccess(),
        listRoomMembers(),
        currentUserId(),
      ])
      debug('rooms list (admin)', all.length)
      return ok({
        rooms: await Promise.all(all.map(async (r) => {
          const a = access.get(r.id)
          const list = members.get(r.id) ?? []
          return {
            ...r,
            // Une table sans enregistrement en base n'a ni propriétaire ni
            // membres : seul l'admin peut encore la voir.
            hasOwner: Boolean(a),
            role: list.find((m) => m.userId === me)?.role,
            joinCode: a?.joinCode,
            isDemo: a?.isDemo ?? false,
            lastActiveAt: a?.lastActiveAt,
            ...(await presence(r.id, list)),
          }
        })),
        scope: 'admin',
      })
    }

    const userId = await currentUserId()
    if (!userId) {
      // Visiteur non connecté : rien à montrer, et c'est voulu.
      return ok({ rooms: [], scope: 'anonymous' })
    }

    const mine = await listRoomsForUser(userId)
    debug('rooms list (user)', mine.length)
    const members = await listRoomMembers(mine.map((r) => r.id))
    return ok({
      rooms: await Promise.all(mine.map(async (r) => ({
        id: r.id,
        name: r.name,
        hasOwner: true,
        isDemo: r.isDemo,
        role: r.role,
        // Le code n'est montré qu'au MJ : c'est lui qui invite.
        joinCode: r.role === 'gm' ? r.joinCode : undefined,
        createdAt: r.createdAt?.toISOString(),
        updatedAt: r.lastActiveAt?.toISOString(),
        ...(await presence(r.id, members.get(r.id) ?? [])),
      }))),
      scope: 'member',
    })
  } catch (e) {
    console.error('rooms/list', e)
    return fail('Failed to list rooms', 500)
  }
}

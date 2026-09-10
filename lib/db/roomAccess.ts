import 'server-only'
import type { AppUser } from './users'
import { getMemberRole } from './rooms'
import { isDemoRoom } from './demo'

export type RoomRole = 'gm' | 'player'

export type RoomAccess =
  | { allowed: true; role: RoomRole }
  | { allowed: false; reason: 'sign-in-required' | 'not-a-member' }

/**
 * Qui peut entrer dans une table, et avec quel rôle.
 *
 * - l'administrateur : partout, avec les outils du MJ, pour pouvoir modérer ;
 * - la salle de démonstration : tout le monde, avec ou sans compte, avec les
 *   outils du MJ — elle sert à tout essayer, et elle est remise à zéro ;
 * - toute autre table : uniquement ses membres, c'est-à-dire son créateur et
 *   ceux qui l'ont rejointe avec son code d'invitation.
 *
 * Connaître l'adresse d'une table ne suffit donc plus pour y entrer. Et le
 * rôle de MJ vient de l'inscription dans la table, décidée côté serveur, et
 * non plus d'une case que chacun pouvait cocher.
 */
export async function resolveRoomAccess(
  roomId: string,
  account: AppUser | null,
): Promise<RoomAccess> {
  if (account?.isAdmin) return { allowed: true, role: 'gm' }
  if (await isDemoRoom(roomId)) return { allowed: true, role: 'gm' }
  if (!account) return { allowed: false, reason: 'sign-in-required' }

  const role = await getMemberRole(roomId, account.id)
  if (!role) return { allowed: false, reason: 'not-a-member' }
  return { allowed: true, role }
}

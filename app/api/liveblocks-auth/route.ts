export const runtime = 'nodejs'

import { Liveblocks } from '@liveblocks/node'
import { randomUUID } from 'node:crypto'
import { roomHasPassword, verifyRoomToken } from '@/lib/roomAuth'
import { syncCurrentUser } from '@/lib/db/users'
import { resolveRoomAccess } from '@/lib/db/roomAccess'
import { touchRoom } from '@/lib/db/rooms'

const secret = process.env.LIVEBLOCKS_SECRET_KEY

if (!secret) {
  console.warn('LIVEBLOCKS_SECRET_KEY is not set. Liveblocks auth endpoint will return 500.')
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    room?: string
    accessToken?: string
    ts?: string
  }

  const { room, accessToken, ts } = body

  if (!room || typeof room !== 'string') {
    return new Response('Missing room id', { status: 400 })
  }
  if (!secret) {
    return new Response('Liveblocks secret key not configured', { status: 500 })
  }

  const liveblocks = new Liveblocks({ secret })

  const roomData = await liveblocks.getRoom(room).catch(() => null)
  if (!roomData) {
    return new Response('Room not found', { status: 404 })
  }

  // Identité : le compte connecté s'il y en a un, sinon un visiteur anonyme.
  const account = await syncCurrentUser().catch(() => null)

  // Connaître l'adresse d'une table ne suffit pas pour y entrer : il faut en
  // être membre (créateur, ou invité avec son code d'invitation), sauf pour la
  // salle de démonstration et pour l'administrateur.
  const access = await resolveRoomAccess(room, account)
  if (!access.allowed) {
    const message =
      access.reason === 'sign-in-required'
        ? 'Sign in to join this table'
        : 'Not a member of this table — ask for its invitation code'
    return new Response(message, { status: 403 })
  }

  // Date de dernière visite, pour repérer les tables abandonnées. Un échec ici
  // ne doit pas empêcher d'entrer.
  await touchRoom(room).catch((e) => console.error('touchRoom', e))

  const meta = (roomData.metadata ?? {}) as Record<string, unknown>

  // Le prédicat est partagé avec /api/rooms/verify. Cette route ne testait
  // auparavant qu'un drapeau, si bien qu'une room protégée créée avant
  // l'introduction de ce drapeau laissait entrer sans mot de passe.
  if (roomHasPassword(meta)) {
    if (!verifyRoomToken(room, accessToken, ts, secret)) {
      return new Response('Password required — invalid or expired access token', {
        status: 401,
      })
    }
  }

  // Pseudo, couleur et rôle sont posés ici, côté serveur : un joueur ne peut
  // ni se faire passer pour un autre, ni se déclarer MJ.
  const userId = account?.id ?? `guest_${randomUUID()}`
  const userInfo = account
    ? { pseudo: account.pseudo, color: account.color, signedIn: true, role: access.role }
    : { pseudo: 'Visiteur', color: '#9ca3af', signedIn: false, role: access.role }

  const session = liveblocks.prepareSession(userId, { userInfo })
  session.allow(room, session.FULL_ACCESS)
  const { body: liveblocksBody, status } = await session.authorize()
  return new Response(liveblocksBody, { status })
}

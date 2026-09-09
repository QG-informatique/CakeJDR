export const runtime = 'nodejs'

import { Liveblocks } from '@liveblocks/node'
import { randomUUID } from 'node:crypto'
import { roomHasPassword, verifyRoomToken } from '@/lib/roomAuth'
import { syncCurrentUser } from '@/lib/db/users'

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

  // Identité : le compte Clerk s'il y en a un, sinon un visiteur anonyme.
  // Le pseudo et la couleur sont posés ici, côté serveur, et non plus tirés
  // du localStorage : un joueur ne peut donc plus se faire passer pour un autre.
  const account = await syncCurrentUser().catch(() => null)

  const userId = account?.id ?? `guest_${randomUUID()}`
  const userInfo = account
    ? { pseudo: account.pseudo, color: account.color, signedIn: true }
    : { pseudo: 'Visiteur', color: '#9ca3af', signedIn: false }

  const session = liveblocks.prepareSession(userId, { userInfo })
  session.allow(room, session.FULL_ACCESS)
  const { body: liveblocksBody, status } = await session.authorize()
  return new Response(liveblocksBody, { status })
}

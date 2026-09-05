export const runtime = 'nodejs'

import { Liveblocks } from '@liveblocks/node'
import { randomUUID } from 'node:crypto'
import { roomHasPassword, verifyRoomToken } from '@/lib/roomAuth'

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
  // auparavant que le drapeau `hasPassword`, si bien qu'une room protégée par
  // un `password`/`passwordHash` sans ce drapeau — le cas des rooms créées
  // avant son introduction — laissait entrer sans mot de passe.
  if (roomHasPassword(meta)) {
    if (!verifyRoomToken(room, accessToken, ts, secret)) {
      return new Response('Password required — invalid or expired access token', {
        status: 401,
      })
    }
  }

  // Accès accordé : émettre le token Liveblocks.
  // Note : userId aléatoire car l'app n'a pas encore d'authentification.
  // La phase 1 le remplacera par l'identifiant du compte connecté.
  const userId = randomUUID()
  const session = liveblocks.prepareSession(userId)
  session.allow(room, session.FULL_ACCESS)
  const { body: liveblocksBody, status } = await session.authorize()
  return new Response(liveblocksBody, { status })
}

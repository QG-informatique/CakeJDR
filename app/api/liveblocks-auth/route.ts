export const runtime = "nodejs";

import { Liveblocks } from '@liveblocks/node';
import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';

const secret = process.env.LIVEBLOCKS_SECRET_KEY;

if (!secret) {
  console.warn('LIVEBLOCKS_SECRET_KEY is not set. Liveblocks auth endpoint will return 500.');
}

/** Vérifie un token d'accès HMAC généré par /api/rooms/verify. */
function verifyAccessToken(
  roomId: string,
  accessToken: string,
  ts: string,
  secret: string,
): boolean {
  const tsNum = Number(ts)
  if (!Number.isFinite(tsNum)) return false
  // Token valide pendant 10 minutes
  const age = Date.now() - tsNum
  if (age < 0 || age > 600_000) return false

  const expected = createHmac('sha256', secret)
    .update(`${roomId}:${ts}`)
    .digest('hex')

  // Comparaison en temps constant pour éviter les timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(accessToken, 'hex'),
    )
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as {
    room?: string
    accessToken?: string
    ts?: string
  }

  const { room, accessToken, ts } = body

  if (!room || typeof room !== 'string') {
    return new Response('Missing room id', { status: 400 });
  }
  if (!secret) {
    return new Response('Liveblocks secret key not configured', { status: 500 });
  }

  const liveblocks = new Liveblocks({ secret });

  // Récupère les métadonnées de la room pour savoir si elle est protégée par MDP
  const roomData = await liveblocks.getRoom(room).catch(() => null)
  if (!roomData) {
    return new Response('Room not found', { status: 404 })
  }

  const meta = (roomData.metadata ?? {}) as Record<string, string>
  const hasPassword = meta.hasPassword === '1'

  if (hasPassword) {
    // La room exige un MDP → valider le token HMAC signé par /api/rooms/verify
    if (!accessToken || !ts) {
      return new Response('Password required — missing access token', { status: 401 })
    }
    if (!verifyAccessToken(room, accessToken, ts, secret)) {
      return new Response('Invalid or expired access token', { status: 401 })
    }
  }

  // Accès accordé : émettre le token Liveblocks
  // Note : userId aléatoire car l'app n'a pas encore d'authentification utilisateur.
  // TODO : remplacer par un vrai userId stable dès qu'une auth est en place.
  const userId = randomUUID();
  const session = liveblocks.prepareSession(userId);
  session.allow(room, session.FULL_ACCESS);
  const { body: liveblocksBody, status } = await session.authorize();
  return new Response(liveblocksBody, { status });
}

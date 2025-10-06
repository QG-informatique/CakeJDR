export const runtime = "nodejs";

import { Liveblocks } from '@liveblocks/node';
import { randomUUID } from 'node:crypto';

const secret = process.env.LIVEBLOCKS_SECRET_KEY;

if (!secret) {
  console.warn('LIVEBLOCKS_SECRET_KEY is not set. Liveblocks auth endpoint will return 500.');
}

export async function POST(request: Request) {
  const { room } = await request.json();
  if (!room) {
    return new Response('Missing room id', { status: 400 });
  }
  if (!secret) {
    return new Response('Liveblocks secret key not configured', { status: 500 });
  }

  const liveblocks = new Liveblocks({ secret });
  const userId = randomUUID();
  const session = liveblocks.prepareSession(userId);
  session.allow(room, session.FULL_ACCESS);
  const { body, status } = await session.authorize();
  return new Response(body, { status });
}

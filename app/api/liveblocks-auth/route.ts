export const runtime = "nodejs";

import { Liveblocks } from '@liveblocks/node';
import { randomUUID } from 'node:crypto';

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  const { room } = await request.json();
  if (!room) {
    return new Response('Missing room id', { status: 400 });
  }
  const userId = randomUUID();
  const session = liveblocks.prepareSession(userId);
  session.allow(room, session.FULL_ACCESS);
  const { body, status } = await session.authorize();
  return new Response(body, { status });
}

import type { NextApiRequest, NextApiResponse } from 'next'
import { Liveblocks, type GetRoomsOptions } from '@liveblocks/node'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) {
    res.status(500).json({ error: 'Liveblocks secret missing' })
    return
  }
  const client = new Liveblocks({ secret })
  try {
    if (req.method === 'GET') {
      const result = await client.getRooms({ limit: 100 })
      const rooms = result.data
        .map(r => {
          const meta = r.metadata as Record<string, string | string[]> | undefined
          const roomName = typeof meta?.name === 'string' ? meta.name : undefined
          return { id: r.id, name: roomName }
        })
        .filter(r => r.name)
      res.status(200).json({ rooms })
      return
    }
    if (req.method === 'POST') {
      const { name, password } =
        typeof req.body === 'string'
          ? (JSON.parse(req.body) as { name?: string; password?: string })
          : (req.body as { name?: string; password?: string })
      if (!name) {
        res.status(400).json({ error: 'name missing' })
        return
      }
      // Optional: prevent duplicate names
      const existingOpts: GetRoomsOptions = { limit: 100, query: { metadata: { name } } }
      const existing = await client.getRooms(existingOpts)
      if (existing.data.find(r => {
        const meta = r.metadata as Record<string, string | string[]> | undefined
        return meta?.name === name
      })) {
        res.status(400).json({ error: 'Room already exists' })
        return
      }
      const id = `room-${Date.now()}`
      const room = await client.createRoom(id, {
        defaultAccesses: ['room:write'],
        metadata: password ? { name, password } : { name },
      })
      res.status(200).json({ id: room.id })
      return
    }
    res.setHeader('Allow', 'GET, POST')
    res.status(405).end('Method Not Allowed')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
}

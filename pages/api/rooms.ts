import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@liveblocks/node'
import crypto from 'crypto'

const secret = process.env.LIVEBLOCKS_SECRET_KEY
const client = secret ? createClient({ secret }) : null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!client) {
    res.status(500).json({ error: 'Liveblocks key missing' })
    return
  }

  if (req.method === 'GET') {
    try {
      const rooms: { id: string; name: string }[] = []
      for await (const room of client.iterRooms({})) {
        const name = typeof room.metadata?.name === 'string' ? room.metadata.name : room.id
        rooms.push({ id: room.id, name })
      }
      res.status(200).json({ rooms })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to list rooms' })
    }
    return
  }

  if (req.method === 'POST') {
    try {
      const { name, password } = req.body as { name?: string; password?: string }
      if (!name) {
        res.status(400).json({ error: 'name missing' })
        return
      }
      const existing = await client.getRooms({ query: { metadata: { name } }, limit: 1 })
      if (existing.data.length > 0) {
        res.status(400).json({ error: 'name taken' })
        return
      }
      const roomId = crypto.randomUUID()
      const metadata: Record<string, string> = { name }
      if (password) metadata.password = password
      await client.createRoom(roomId, { defaultAccesses: ['room:write'], metadata })
      res.status(200).json({ id: roomId })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to create room' })
    }
    return
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end('Method Not Allowed')
}

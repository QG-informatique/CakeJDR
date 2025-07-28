import type { NextApiRequest, NextApiResponse } from 'next'
import { Liveblocks } from '@liveblocks/node'
import crypto from 'crypto'

const secret = process.env.LIVEBLOCKS_SECRET_KEY
const client = secret ? new Liveblocks({ secret }) : null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!client) {
    res.status(500).json({ error: 'Liveblocks key missing' })
    return
  }

  if (req.method === 'GET') {
    try {
      const rooms: { id: string; name: string }[] = []
      let cursor: string | null | undefined
      do {
        const page = await client.getRooms({ limit: 100, startingAfter: cursor || undefined })
        for (const room of page.data) {
          const name = typeof room.metadata?.name === 'string' ? room.metadata.name : room.id
          rooms.push({ id: room.id, name })
        }
        cursor = page.nextCursor
      } while (cursor)
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
      let cursor: string | null | undefined
      do {
        const page = await client.getRooms({ limit: 100, startingAfter: cursor || undefined })
        if (page.data.some(r => typeof r.metadata?.name === 'string' && r.metadata.name === name)) {
          res.status(400).json({ error: 'name taken' })
          return
        }
        cursor = page.nextCursor
      } while (cursor)
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

  if (req.method === 'DELETE') {
    try {
      const { id } = req.body as { id?: string }
      if (!id) {
        res.status(400).json({ error: 'id missing' })
        return
      }
      await client.deleteRoom(id)
      res.status(200).json({ ok: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Failed to delete room' })
    }
    return
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE'])
  res.status(405).end('Method Not Allowed')
}

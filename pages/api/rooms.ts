import type { NextApiRequest, NextApiResponse } from 'next'
import { listRooms, createRoom, deleteRoom } from '@/lib/liveRooms'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const rooms = await listRooms()
      res.status(200).json({ rooms })
    } else if (req.method === 'POST') {
      const { name, password } = req.body
      if (!name || typeof name !== 'string') {
        res.status(400).json({ error: 'missing name' })
        return
      }
      const id = await createRoom(name, typeof password === 'string' ? password : undefined)
      res.status(200).json({ id })
    } else if (req.method === 'DELETE') {
      const { id } = req.body
      if (!id || typeof id !== 'string') {
        res.status(400).json({ error: 'missing id' })
        return
      }
      await deleteRoom(id)
      res.status(200).json({ ok: true })
    } else {
      res.setHeader('Allow', 'GET,POST,DELETE')
      res.status(405).end('Method Not Allowed')
    }
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'name_exists') {
      res.status(400).json({ error: 'name already used' })
    } else if (msg === 'Liveblocks key missing') {
      res.status(500).json({ error: 'Liveblocks key missing' })
    } else {
      console.error(e)
      res.status(500).json({ error: 'Server error' })
    }
  }
}

export const config = {
  api: { bodyParser: true },
}

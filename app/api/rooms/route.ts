export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { listRooms, createRoom, deleteRoom, renameRoom } from '@/lib/liveRooms'
import { debug } from '@/lib/debug'
import { fail, ok } from '@/lib/api-response'

export async function GET() {
  try {
    const rooms = await listRooms()
    debug('rooms list', rooms.length)
    return ok({ rooms })
  } catch (e) {
    console.error(e)
    return fail('Failed to list rooms', 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, password } = await req.json()
    if (!name || typeof name !== 'string') {
      return fail('missing name', 400)
    }
    const id = await createRoom(name, typeof password === 'string' ? password : undefined)
    debug('room created', name, id)
    return ok({ id })
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'name_exists') {
      return fail('name already used', 400)
    }
    if (msg === 'Liveblocks key missing') {
      return fail(msg, 500)
    }
    console.error(e)
    return fail('Failed to create room', 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id || typeof id !== 'string') {
      return fail('missing id', 400)
    }
    await deleteRoom(id)
    debug('room deleted', id)
    return ok()
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'Liveblocks key missing') {
      return fail(msg, 500)
    }
    console.error(e)
    return fail('Failed to delete room', 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, name } = await req.json()
    if (!id || typeof id !== 'string' || !name || typeof name !== 'string') {
      return fail('missing data', 400)
    }
    await renameRoom(id, name)
    debug('room renamed', id, name)
    return ok()
  } catch (e) {
    const msg = (e as Error).message
    if (msg === 'Liveblocks key missing') {
      return fail(msg, 500)
    }
    console.error(e)
    return fail('Failed to rename room', 500)
  }
}

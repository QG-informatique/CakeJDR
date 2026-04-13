export const runtime = 'nodejs'
import { listRooms } from '@/lib/liveRooms'
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

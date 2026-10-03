export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { isAdminRequest } from '@/lib/adminAuth'
import { clearRoomPassword, deleteRoom, renameRoom } from '@/lib/liveRooms'
import { forgetRoom, renameRoomRecord } from '@/lib/db/rooms'
import { debug } from '@/lib/debug'
import { fail, ok } from '@/lib/api-response'

/** Actions réservées à l'admin : suppression en masse, retrait de mot de passe. */

const MAX_BULK = 50

export async function DELETE(req: NextRequest) {
  if (!(await isAdminRequest())) return fail('forbidden', 403)

  const body = (await req.json().catch(() => ({}))) as { ids?: unknown }
  const ids = Array.isArray(body.ids)
    ? body.ids.filter((v): v is string => typeof v === 'string' && v.length > 0)
    : []
  if (!ids.length) return fail('missing ids', 400)
  if (ids.length > MAX_BULK) return fail(`too many ids (max ${MAX_BULK})`, 400)

  const deleted: string[] = []
  const failed: Array<{ id: string; error: string }> = []

  for (const id of ids) {
    try {
      await deleteRoom(id)
      // Sans cela, la table restait listée chez ses joueurs après suppression.
      await forgetRoom(id).catch((e) => console.error('forgetRoom', e))
      deleted.push(id)
    } catch (e) {
      failed.push({ id, error: e instanceof Error ? e.message : 'delete failed' })
    }
  }

  debug('admin bulk delete', deleted.length, 'ok', failed.length, 'failed')
  return ok({ deleted, failed })
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest())) return fail('forbidden', 403)

  const body = (await req.json().catch(() => ({}))) as {
    action?: unknown
    id?: unknown
    name?: unknown
  }
  const action = typeof body.action === 'string' ? body.action : ''
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return fail('missing id', 400)

  try {
    if (action === 'clearPassword') {
      await clearRoomPassword(id)
      debug('admin clear password', id)
      return ok({ id })
    }
    if (action === 'rename') {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (!name) return fail('missing name', 400)
      await renameRoom(id, name)
      await renameRoomRecord(id, name).catch((e) => console.error('renameRoomRecord', e))
      debug('admin rename', id, name)
      return ok({ id, name })
    }
    return fail(`unknown action: ${action || '(empty)'}`, 400)
  } catch (e) {
    console.error(e)
    return fail(e instanceof Error ? e.message : 'admin action failed', 500)
  }
}

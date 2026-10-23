export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { createRoom, deleteRoom, initRoom, renameRoom } from '@/lib/liveRooms'
import { ADVENTURES } from '@/lib/autoGm'
import { DEFAULT_SYSTEM, isGameSystemId } from '@/lib/gameSystems'
import { isAdminRequest } from '@/lib/adminAuth'
import { countOwnedRooms, forgetRoom, isRoomOwner, recordRoom, renameRoomRecord } from '@/lib/db/rooms'
import { currentUserId, syncCurrentUser } from '@/lib/db/users'
import { readCreation } from '@/lib/db/creations'
import { parseCustomSystem } from '@/lib/customSystem'
import { parseCampaign } from '@/lib/autoGm/custom'
import { debug } from '@/lib/debug'
import { fail, ok } from '@/lib/api-response'

/**
 * Une table se renomme ou se supprime par son MJ (son créateur, enregistré
 * en base) ou par l'administrateur.
 *
 * Il n'y a pas de GET : la liste des tables passe par `/api/rooms/list`, qui
 * ne montre à chacun que les tables dont il est membre.
 */
/**
 * Tables qu'un compte peut créer, hors administrateur. Vérifié ici et non
 * plus dans le navigateur, où il suffisait de vider le stockage local pour
 * passer outre.
 */
const MAX_ROOMS_PER_ACCOUNT = 5
const MAX_NAME_LENGTH = 60

async function canMutate(id: string) {
  if (await isAdminRequest()) return true
  return isRoomOwner(id, await currentUserId())
}

export async function POST(req: NextRequest) {
  try {
    // Un compte est requis : la liste des tables passe par l'appartenance, donc
    // une table creee anonymement serait invisible a son propre createur.
    const account = await syncCurrentUser().catch(() => null)
    if (!account) {
      return fail('sign in to create a table', 401)
    }

    const body = await req.json()
    const name = typeof body?.name === 'string' ? body.name.trim().slice(0, MAX_NAME_LENGTH) : ''
    if (!name) {
      return fail('missing name', 400)
    }
    if (!account.isAdmin && (await countOwnedRooms(account.id)) >= MAX_ROOMS_PER_ACCOUNT) {
      return fail('room limit reached', 403)
    }
    // Système et campagne de l'atelier : relus en base, à soi ou partagés.
    const customRow = typeof body?.customSystem === 'string' ? await readCreation(body.customSystem, 'system', account.id) : null
    const customSystem = customRow ? (parseCustomSystem(customRow.data) ?? undefined) : undefined
    const campaignRow = typeof body?.campaign === 'string' ? await readCreation(body.campaign, 'campaign', account.id) : null
    const campaign = campaignRow ? (parseCampaign(campaignRow.data) ?? undefined) : undefined
    const system = customSystem ? customSystem.base : isGameSystemId(body?.system) ? body.system : DEFAULT_SYSTEM
    // « Nouveau héros pour cette aventure » est coché sauf refus explicite.
    const newHeroes = body?.newHeroes !== false
    // Avec le MJ automatique, la campagne choisie démarre dès l'ouverture.
    const adventure =
      body?.gm !== 'auto'
        ? undefined
        : campaign
          ? campaign.id
          : typeof body?.adventure === 'string' && Object.hasOwn(ADVENTURES, body.adventure)
            ? body.adventure
            : undefined
    const { id } = await createRoom(name)
    await initRoom(id, { system, newHeroes, adventure, customSystem, campaign }).catch((e) => console.error('initRoom', e))
    await recordRoom({ id, name, ownerId: account.id }).catch((e) =>
      console.error('recordRoom', e),
    )

    debug('room created', name, id)
    return ok({ id })
  } catch (e) {
    const msg = (e as Error).message
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
    if (!(await canMutate(id))) {
      return fail('forbidden: you are not the owner of this room', 403)
    }
    await deleteRoom(id)
    await forgetRoom(id).catch((e) => console.error('forgetRoom', e))
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
    if (!(await canMutate(id))) {
      return fail('forbidden: you are not the owner of this room', 403)
    }
    await renameRoom(id, name)
    await renameRoomRecord(id, name).catch((e) => console.error('renameRoomRecord', e))
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

import { Liveblocks } from '@liveblocks/node'
import { LiveMap, LiveObject } from '@liveblocks/client'
import type { GameSystemId } from './gameSystems'
import type { CustomSystemData } from './customSystem'
import type { Adventure } from './autoGm/types'
import { ADVENTURES, startState } from './autoGm'
import { randomBytes } from 'crypto'
import { collectRoomImages, deleteCloudinaryImages, storageImageUrls } from './cloudinaryCleanup'
import { DEMO_COPY_PREFIX, DEMO_COPY_TTL_DAYS, isDemoCopyId } from './demoCopy'

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const SAFE_METADATA_KEY = /^[a-zA-Z0-9:_-]{1,64}$/
const BLOCKED_METADATA_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

function isSafeMetadataKey(key: string) {
  return SAFE_METADATA_KEY.test(key) && !BLOCKED_METADATA_KEYS.has(key)
}

function getClient() {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) throw new Error('Liveblocks key missing')
  return new Liveblocks({ secret })
}

export type RoomSummary = {
  id: string
  name: string
  createdAt: string
  updatedAt?: string
  usersConnected: number
}

/**
 * Nombre de personnes présentes dans la table en ce moment. Liveblocks ne
 * renvoie pas ce chiffre avec la liste des tables : il faut le demander table
 * par table. Un même compte ouvert dans deux onglets compte une fois.
 * Renvoie `null` si Liveblocks ne répond pas : à l'appelant de choisir la
 * valeur prudente.
 */
export async function countActiveUsers(id: string): Promise<number | null> {
  const ids = await activeUserIds(id)
  return ids ? ids.size : null
}

/**
 * Identifiants des personnes présentes dans la table en ce moment : le compte
 * pour un joueur connecté, `guest_…` pour un visiteur. `null` si Liveblocks ne
 * répond pas.
 */
export async function activeUserIds(id: string): Promise<Set<string> | null> {
  try {
    const { data } = await getClient().getActiveUsers(id)
    return new Set(data.map((u) => u.id ?? `connection-${u.connectionId}`))
  } catch {
    return null
  }
}

/** `withCounts: false` évite un appel à Liveblocks par table, quand l'appelant compte lui-même. */
export async function listRooms({ withCounts = true } = {}): Promise<RoomSummary[]> {
  const client = getClient()
  const rooms: RoomSummary[] = []
  let cursor: string | undefined
  do {
    const { data, nextCursor } = await client.getRooms({ startingAfter: cursor, limit: 50 })
    for (const r of data) {
      if (r.id === 'rooms-index' || r.metadata?.name === 'rooms-index') continue
      // Copies de la démo des visiteurs : nombreuses, et nettoyées seules.
      if (r.id.startsWith(DEMO_COPY_PREFIX)) continue
      const roomName =
        typeof r.metadata?.name === 'string' && r.metadata.name
          ? r.metadata.name
          : r.id.includes('-')
            ? r.id.substring(0, r.id.lastIndexOf('-'))
            : r.id
      rooms.push({
        id: r.id,
        name: roomName,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.lastConnectionAt ? r.lastConnectionAt.toISOString() : undefined,
        usersConnected: 0,
      })
    }
    cursor = nextCursor ?? undefined
  } while (cursor)
  if (withCounts) {
    await Promise.all(rooms.map(async (r) => { r.usersConnected = (await countActiveUsers(r.id)) ?? 0 }))
  }
  return rooms
}

/**
 * Crée la table chez Liveblocks. L'identifiant reprend le nom pour rester
 * lisible dans l'adresse, suivi d'un suffixe aléatoire : deux MJ peuvent donc
 * donner le même nom à leur table. La propriété est portée par la base
 * (`recordRoom`), pas par Liveblocks.
 */
export async function createRoom(name: string) {
  const client = getClient()
  const id = `${slugify(name).slice(0, 40) || 'table'}-${randomBytes(4).toString('hex')}`
  const room = await client.createRoom(id, {
    defaultAccesses: ['room:write'],
    metadata: { name },
  })
  return { id: room.id }
}

/**
 * Range les choix faits à la création dans la table : système de jeu et
 * « Nouveau héros pour cette aventure » dans les réglages
 * (`lib/roomSettings.ts`), et, avec le MJ automatique, la campagne prête à
 * commencer. Les autres réglages prennent leur valeur par défaut, et le reste
 * du stockage est créé à la première ouverture.
 *
 * Un système ou une campagne de l'atelier du MJ est copié dans la salle :
 * la partie continue même s'il les change ou les supprime ensuite.
 */
export async function initRoom(
  id: string,
  {
    system,
    newHeroes,
    adventure,
    customSystem,
    campaign,
  }: { system: GameSystemId; newHeroes: boolean; adventure?: string; customSystem?: CustomSystemData; campaign?: Adventure },
) {
  const adv = campaign && adventure === campaign.id ? campaign : adventure ? ADVENTURES[adventure] : undefined
  await getClient().mutateStorage(id, ({ root }) => {
    root.set('settings', new LiveObject({ system, newHeroes, ...(customSystem ? { customSystem } : {}) }) as never)
    if (campaign) root.set('customAdventure', campaign as never)
    if (adv) {
      root.set('autoGm', new LiveObject({ ...startState(adv, 'auto'), votes: new LiveMap<string, string>() }) as never)
    }
  })
}

/**
 * Supprime la table chez Liveblocks, puis ses images chez Cloudinary. Un
 * échec côté images n'empêche pas la suppression : au pire, quelques images
 * orphelines restent sur Cloudinary.
 */
export async function deleteRoom(id: string) {
  const client = getClient()
  const images = await collectRoomImages(
    () => client.getStorageDocument(id, 'json') as Promise<{ images?: unknown; library?: unknown }>,
  ).catch((e: unknown) => {
    console.error('deleteRoom: lecture des images impossible', id, e)
    return []
  })
  await client.deleteRoom(id)
  await deleteCloudinaryImages(images).catch((e: unknown) => {
    console.error('deleteRoom: suppression des images Cloudinary impossible', id, e)
  })
}

/**
 * Supprime les copies de la démo où personne n'est revenu depuis
 * `DEMO_COPY_TTL_DAYS` jours, avec les images que leur visiteur y a envoyées.
 */
export async function cleanupDemoCopies({ dry = false } = {}) {
  const client = getClient()
  const cutoff = Date.now() - DEMO_COPY_TTL_DAYS * 24 * 60 * 60 * 1000
  const stale: string[] = []
  let cursor: string | undefined
  do {
    const { data, nextCursor } = await client.getRooms({
      startingAfter: cursor,
      limit: 100,
      query: { roomId: { startsWith: DEMO_COPY_PREFIX } },
    })
    for (const r of data) {
      const last = (r.lastConnectionAt ?? r.createdAt).getTime()
      if (isDemoCopyId(r.id) && last < cutoff) stale.push(r.id)
    }
    cursor = nextCursor ?? undefined
  } while (cursor)
  if (dry) return { stale, deleted: [] as string[] }
  const deleted: string[] = []
  for (const id of stale) {
    await deleteRoom(id)
      .then(() => deleted.push(id))
      .catch((e: unknown) => console.error('cleanupDemoCopies', id, e))
  }
  return { stale, deleted }
}

/** Cette image est-elle encore sur la table ou dans sa bibliothèque ? */
export async function roomShowsImage(id: string, url: string) {
  const storage = (await getClient().getStorageDocument(id, 'json')) as { images?: unknown; library?: unknown }
  return storageImageUrls(storage).includes(url)
}

export async function renameRoom(id: string, name: string) {
  const client = getClient()
  const room = await client.getRoom(id)
  const entries: Array<[string, string | string[]]> = []
  if (typeof room.metadata === 'object' && room.metadata !== null) {
    for (const [k, v] of Object.entries(room.metadata as Record<string, unknown>)) {
      if (!isSafeMetadataKey(k)) continue
      if (typeof v === 'string') entries.push([k, v])
      else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) {
        entries.push([k, v as string[]])
      }
    }
  }
  const metadata = Object.fromEntries(entries) as Record<string, string | string[]>
  await client.updateRoom(id, { metadata: { ...metadata, name } })
}

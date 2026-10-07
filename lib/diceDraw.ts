import 'server-only'
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto'
import type { Liveblocks } from '@liveblocks/node'

/**
 * Tirage d'avance des dés.
 *
 * Quand un joueur attrape le dé, son navigateur demande le tirage au serveur :
 * il connaît ainsi le chiffre avant le lâcher, et l'inscrit dès le départ sur
 * la face qui finira en haut. Rien ne change sous ses yeux pendant que le dé
 * roule.
 *
 * Le tirage attend le jet suivant dans les métadonnées de la table, que seul
 * le serveur peut écrire, et chiffré : le joueur ne peut ni l'effacer pour
 * relancer, ni le lire avant de l'avoir demandé. Un tirage pour une demande
 * du MJ est attaché à cette demande ; les jets libres ont un tirage par
 * joueur. On garde des valeurs entre 0 et 1, pas des chiffres : changer de dé
 * ne refait pas le tirage (un 1 au D20 reste un 1 au D12).
 *
 * La clé est dérivée de `AUTH_SECRET`, comme celle des demandes du MJ.
 */

/** Au-delà, les tirages les plus anciens laissent la place (50 métadonnées au plus par table). */
const MAX_DRAWS = 36
const PREFIX = /^draw[fc]_/

let cachedKey: Buffer | null = null
function key() {
  if (cachedKey) return cachedKey
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  cachedKey = createHmac('sha256', secret).update('cakejdr-draw-v1').digest()
  return cachedKey
}

const short = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 24)

/** Tirage des jets libres d'un compte. */
export const freeDrawKey = (accountId: string) => `drawf_${short(accountId)}`
/** Tirage d'une demande du MJ. */
export const checkDrawKey = (checkId: string) => `drawc_${short(checkId)}`

function seal(roomId: string, slot: string, values: number[]) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  cipher.setAAD(Buffer.from(`${roomId}|${slot}`))
  const raw = Buffer.alloc(values.length * 4)
  values.forEach((v, i) => raw.writeUInt32BE(v >>> 0, i * 4))
  const data = Buffer.concat([cipher.update(raw), cipher.final()])
  return `${Date.now().toString(36)}.${Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url')}`
}

function unseal(roomId: string, slot: string, value: unknown): number[] | null {
  if (typeof value !== 'string') return null
  try {
    const raw = Buffer.from(value.slice(value.indexOf('.') + 1), 'base64url')
    const decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12))
    decipher.setAAD(Buffer.from(`${roomId}|${slot}`))
    decipher.setAuthTag(raw.subarray(12, 28))
    const data = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()])
    return Array.from({ length: Math.floor(data.length / 4) }, (_, i) => data.readUInt32BE(i * 4))
  } catch {
    return null
  }
}

const age = (value: unknown) => (typeof value === 'string' ? parseInt(value.split('.')[0] ?? '', 36) || 0 : 0)

export type Draw = { values: number[]; stored: boolean; metadata: Record<string, unknown> }

/** Tirage en attente pour ce jet, complété au besoin : `count` valeurs au moins. */
export async function readDraw(lb: Liveblocks, roomId: string, slot: string, count: number): Promise<Draw> {
  const room = await lb.getRoom(roomId).catch(() => null)
  const stored = unseal(roomId, slot, room?.metadata?.[slot])
  const values = [...(stored ?? [])]
  while (values.length < count) values.push(randomBytes(4).readUInt32BE(0))
  return { values, stored: stored !== null && stored.length >= count, metadata: room?.metadata ?? {} }
}

/** Range le tirage pour le jet suivant. */
export async function saveDraw(lb: Liveblocks, roomId: string, slot: string, draw: Draw) {
  const others = Object.entries(draw.metadata)
    .filter(([k]) => PREFIX.test(k) && k !== slot)
    .sort((a, b) => age(a[1]) - age(b[1]))
  const dropped = others.slice(0, Math.max(0, others.length - (MAX_DRAWS - 1)))
  await lb.updateRoom(roomId, {
    metadata: { [slot]: seal(roomId, slot, draw.values), ...Object.fromEntries(dropped.map(([k]) => [k, null])) },
  })
}

/** Le tirage a servi : le jet suivant en aura un nouveau. */
export async function dropDraw(lb: Liveblocks, roomId: string, slot: string) {
  await lb.updateRoom(roomId, { metadata: { [slot]: null } }).catch((e: unknown) => {
    console.error('dice: tirage non effacé', roomId, e)
  })
}

/** Chiffres d'un tirage pour un type de dé. */
export const drawFaces = (values: number[], dice: number, count: number) =>
  values.slice(0, count).map((v) => 1 + Math.floor((v / 2 ** 32) * dice))

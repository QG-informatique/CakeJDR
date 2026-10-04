import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from './db'
import { rooms } from './db/schema'

/**
 * Suppression chez Cloudinary des images d'une table qu'on supprime.
 *
 * Les images ne sont rattachées à aucun compte : la seule trace de leur
 * propriétaire est la table où elles ont été posées. Supprimer une table
 * (par son MJ, avec son compte, ou par le ménage des tables abandonnées)
 * supprime donc aussi les images qu'elle contient.
 *
 * Garde-fous : seules les images du dossier `cakejdr/` de notre compte
 * Cloudinary sont visées, et jamais celles qu'utilise une salle de
 * démonstration (son état de référence pourrait reprendre une image venue
 * d'une autre table).
 */

const FOLDER = 'cakejdr'

function resolveConfig() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  let apiKey = process.env.CLOUDINARY_API_KEY
  let apiSecret = process.env.CLOUDINARY_API_SECRET
  if (process.env.CLOUDINARY_URL) {
    try {
      const parsed = new URL(process.env.CLOUDINARY_URL)
      if (!cloudName) cloudName = parsed.hostname
      if (!apiKey) apiKey = decodeURIComponent(parsed.username)
      if (!apiSecret) apiSecret = decodeURIComponent(parsed.password)
    } catch {
      // CLOUDINARY_URL illisible : on s'en tient aux variables séparées.
    }
  }
  return { cloudName, apiKey, apiSecret }
}

/**
 * Identifiant Cloudinary d'une adresse d'image, ou `null` si l'image n'est pas
 * à nous. Accepte l'adresse brute (`.../upload/v123/cakejdr/abc.png`) comme
 * celle avec transformations (`.../upload/f_auto,q_auto/cakejdr/abc`).
 */
export function cloudinaryPublicId(url: string, cloudName: string): string | null {
  const prefix = `https://res.cloudinary.com/${cloudName}/image/upload/`
  if (!url.startsWith(prefix)) return null
  const parts = url.slice(prefix.length).split(/[?#]/)[0]!.split('/')
  const start = parts.indexOf(FOLDER)
  const rest = parts.slice(start + 1)
  if (start === -1 || rest.length === 0 || rest.some((p) => !p)) return null
  const id = parts.slice(start).join('/')
  return decodeURIComponent(id.replace(/\.[a-z0-9]+$/i, ''))
}

/** Adresses des images d'un contenu de table (`images` est rangé par identifiant). */
export function imageUrls(images: unknown): string[] {
  if (!images || typeof images !== 'object') return []
  return Object.values(images as Record<string, unknown>)
    .map((img) => (img && typeof img === 'object' ? (img as { url?: unknown }).url : null))
    .filter((url): url is string => typeof url === 'string')
}

/** Images posées sur le plateau et images envoyées dans la bibliothèque. */
export function storageImageUrls(storage: { images?: unknown; library?: unknown } | null | undefined): string[] {
  return [...imageUrls(storage?.images), ...imageUrls(storage?.library)]
}

async function demoPublicIds(cloudName: string): Promise<Set<string>> {
  const rows = await db
    .select({ snapshot: rooms.demoSnapshot })
    .from(rooms)
    .where(eq(rooms.isDemo, true))
  const ids = new Set<string>()
  for (const row of rows) {
    const snapshot = row.snapshot as { images?: unknown; library?: unknown } | null
    for (const url of storageImageUrls(snapshot)) {
      const id = cloudinaryPublicId(url, cloudName)
      if (id) ids.add(id)
    }
  }
  return ids
}

/**
 * Liste les images Cloudinary d'une table, à appeler AVANT de la supprimer
 * chez Liveblocks (après, son contenu n'existe plus). Renvoie une liste vide
 * si Cloudinary n'est pas configuré ou si le contenu est illisible.
 */
export async function collectRoomImages(
  getStorage: () => Promise<{ images?: unknown; library?: unknown }>,
): Promise<string[]> {
  const { cloudName, apiKey, apiSecret } = resolveConfig()
  if (!cloudName || !apiKey || !apiSecret) return []
  const storage = await getStorage()
  const ids = new Set<string>()
  for (const url of storageImageUrls(storage)) {
    const id = cloudinaryPublicId(url, cloudName)
    if (id) ids.add(id)
  }
  if (ids.size === 0) return []
  const protectedIds = await demoPublicIds(cloudName)
  return [...ids].filter((id) => !protectedIds.has(id))
}

/**
 * Identifiant Cloudinary d'une image qu'on vient de retirer d'une table, ou
 * `null` si elle n'est pas à nous, si Cloudinary n'est pas configuré, ou si
 * une salle de démonstration s'en sert.
 */
export async function removableImageId(url: string): Promise<string | null> {
  const { cloudName, apiKey, apiSecret } = resolveConfig()
  if (!cloudName || !apiKey || !apiSecret) return null
  const id = cloudinaryPublicId(url, cloudName)
  if (!id) return null
  return (await demoPublicIds(cloudName)).has(id) ? null : id
}

/** Supprime ces images chez Cloudinary, par paquets de 100 (limite de l'API). */
export async function deleteCloudinaryImages(publicIds: string[]) {
  const { cloudName, apiKey, apiSecret } = resolveConfig()
  if (!cloudName || !apiKey || !apiSecret || publicIds.length === 0) return
  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')
  for (let i = 0; i < publicIds.length; i += 100) {
    const query = new URLSearchParams()
    for (const id of publicIds.slice(i, i + 100)) query.append('public_ids[]', id)
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${query}`,
      { method: 'DELETE', headers: { Authorization: `Basic ${auth}` } },
    )
    if (!res.ok) throw new Error(`Cloudinary delete failed: ${res.status}`)
  }
}

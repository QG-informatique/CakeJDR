import 'server-only'
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto'
import type { CheckStat } from './checks'

/**
 * Scellé d'une demande de test.
 *
 * La demande attend dans la liste partagée de la table, que tous les
 * navigateurs peuvent lire et modifier. Le serveur y range donc une copie
 * chiffrée : la difficulté cachée reste illisible, et au moment du jet c'est
 * cette copie qui fait foi, pas les champs en clair.
 *
 * La clé est dérivée de `AUTH_SECRET`, comme celle des dés.
 */
export type SealedCheck = {
  type?: 'check'
  id: string
  targetId: string
  targetName: string
  stat: CheckStat
  mod: number
  dc: number
  showDc: boolean
  reason?: string
}

export type SealedRolls = {
  type: 'rolls'
  id: string
  targetId: string
  targetName: string
  dice: number
  count: number
  levelUp: boolean
  reason?: string
}

export type SealedRequest = SealedCheck | SealedRolls

let cachedKey: Buffer | null = null
function key() {
  if (cachedKey) return cachedKey
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  cachedKey = createHmac('sha256', secret).update('cakejdr-check-v1').digest()
  return cachedKey
}

export function sealCheck(roomId: string, check: SealedRequest): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  cipher.setAAD(Buffer.from(roomId))
  const data = Buffer.concat([cipher.update(JSON.stringify(check), 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64url')
}

/** La demande d'origine, ou null si le scellé a été modifié ou vient d'une autre table. */
export function unsealCheck(roomId: string, seal: string): SealedRequest | null {
  try {
    const raw = Buffer.from(seal, 'base64url')
    const decipher = createDecipheriv('aes-256-gcm', key(), raw.subarray(0, 12))
    decipher.setAAD(Buffer.from(roomId))
    decipher.setAuthTag(raw.subarray(12, 28))
    const text = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8')
    return JSON.parse(text) as SealedRequest
  } catch {
    return null
  }
}

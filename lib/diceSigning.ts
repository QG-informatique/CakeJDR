import 'server-only'
import { createHmac, createPrivateKey, createPublicKey, sign, type KeyObject } from 'node:crypto'
import { diceSignedPayload, type SignedDiceRoll } from './dicePayload'

/**
 * Signature des lancers de dés.
 *
 * Le serveur tire le dé et signe le résultat ; chaque navigateur vérifie la
 * signature avec la clé publique (`/api/dice/key`). Un joueur qui écrirait un
 * faux lancer dans la liste partagée ne peut pas le signer : son lancer
 * s'affiche « non vérifié ».
 *
 * La clé est dérivée de `AUTH_SECRET` plutôt que d'une variable de plus à
 * régler sur Vercel. Changer `AUTH_SECRET` change la clé : les anciens lancers
 * s'afficheront alors « non vérifiés ».
 */

// En-tête DER d'une clé privée Ed25519 au format PKCS8, suivi des 32 octets de la graine.
const PKCS8_ED25519_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex')

let cached: { privateKey: KeyObject; publicKey: string } | null = null

function keys() {
  if (cached) return cached
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  const seed = createHmac('sha256', secret).update('cakejdr-dice-v1').digest()
  const privateKey = createPrivateKey({
    key: Buffer.concat([PKCS8_ED25519_PREFIX, seed]),
    format: 'der',
    type: 'pkcs8',
  })
  const jwk = createPublicKey(privateKey).export({ format: 'jwk' })
  cached = { privateKey, publicKey: String(jwk.x) }
  return cached
}

/** Clé publique brute, en base64url. */
export function dicePublicKey() {
  return keys().publicKey
}

export function signDiceRoll(roomId: string, roll: Omit<SignedDiceRoll, 'sig'>): string {
  const data = Buffer.from(diceSignedPayload(roomId, roll))
  return sign(null, data, keys().privateKey).toString('base64url')
}

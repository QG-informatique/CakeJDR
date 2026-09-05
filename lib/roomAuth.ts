import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto'

/**
 * Contrôle d'accès aux rooms : hachage des mots de passe et jetons d'accès.
 *
 * Ce module est la source unique de vérité pour trois questions qui étaient
 * auparavant traitées différemment selon les routes :
 *   - une room est-elle protégée par mot de passe ?
 *   - ce mot de passe est-il le bon ?
 *   - cet appelant a-t-il prouvé qu'il avait accès à la room ?
 *
 * Note d'étape : le jeton ci-dessous prouve l'accès à une *room*, pas
 * l'identité d'un *utilisateur*. C'est volontaire tant qu'il n'y a pas de
 * comptes ; la phase 1 le remplacera par une session utilisateur.
 */

/* ------------------------------------------------------------------ */
/* Mots de passe                                                       */
/* ------------------------------------------------------------------ */

const SCRYPT_KEYLEN = 64
const SCRYPT_PREFIX = 'scrypt'

/** Hache un mot de passe de room avec scrypt et un sel aléatoire. */
export function hashRoomPassword(password: string): string {
  const salt = randomBytes(16)
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN)
  return `${SCRYPT_PREFIX}$${salt.toString('hex')}$${derived.toString('hex')}`
}

function safeEqualHex(a: string, b: string): boolean {
  let bufA: Buffer
  let bufB: Buffer
  try {
    bufA = Buffer.from(a, 'hex')
    bufB = Buffer.from(b, 'hex')
  } catch {
    return false
  }
  if (bufA.length === 0 || bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/** Ancien format : SHA-256 nu, non salé. Conservé pour la migration. */
const legacySha256 = (s: string) => createHash('sha256').update(s).digest('hex')

export type PasswordCheck = {
  valid: boolean
  /**
   * Rempli quand le mot de passe était stocké dans un ancien format et vient
   * d'être vérifié avec succès : l'appelant doit réécrire cette valeur dans
   * les métadonnées pour achever la migration.
   */
  upgradedHash?: string
}

/**
 * Vérifie un mot de passe contre la valeur stockée, quel que soit son format.
 *
 * Trois formats cohabitent le temps de la migration :
 *   - `scrypt$sel$clé`  — le format courant
 *   - 64 caractères hex — l'ancien SHA-256 non salé
 *   - n'importe quoi d'autre — un mot de passe stocké en clair (le plus ancien)
 */
export function checkRoomPassword(
  password: string,
  storedHash: string | null,
  storedPlain: string | null,
): PasswordCheck {
  if (storedHash && storedHash.startsWith(`${SCRYPT_PREFIX}$`)) {
    const parts = storedHash.split('$')
    if (parts.length !== 3) return { valid: false }
    const [, saltHex, keyHex] = parts as [string, string, string]
    let derived: Buffer
    try {
      derived = scryptSync(password, Buffer.from(saltHex, 'hex'), SCRYPT_KEYLEN)
    } catch {
      return { valid: false }
    }
    return { valid: safeEqualHex(derived.toString('hex'), keyHex) }
  }

  if (storedHash && /^[0-9a-f]{64}$/i.test(storedHash)) {
    const valid = safeEqualHex(legacySha256(password), storedHash)
    return valid ? { valid, upgradedHash: hashRoomPassword(password) } : { valid }
  }

  if (storedPlain) {
    const a = Buffer.from(password, 'utf8')
    const b = Buffer.from(storedPlain, 'utf8')
    const valid = a.length === b.length && timingSafeEqual(a, b)
    return valid ? { valid, upgradedHash: hashRoomPassword(password) } : { valid }
  }

  return { valid: false }
}

/* ------------------------------------------------------------------ */
/* Métadonnées                                                         */
/* ------------------------------------------------------------------ */

/**
 * Une room est-elle protégée ?
 *
 * Prédicat unique, utilisé par `/api/rooms/verify`, `/api/liveblocks-auth` et
 * `lib/liveRooms`. Ils divergeaient : `liveblocks-auth` ne regardait que le
 * drapeau `hasPassword`, si bien qu'une room créée avant ce drapeau — avec un
 * `password` ou un `passwordHash` mais rien d'autre — était traitée comme
 * ouverte et laissait entrer sans mot de passe.
 */
export function roomHasPassword(meta: Record<string, unknown>): boolean {
  const plain = typeof meta.password === 'string' && meta.password.length > 0
  const hashed = typeof meta.passwordHash === 'string' && meta.passwordHash.length > 0
  const flag =
    meta.hasPassword === true ||
    meta.hasPassword === '1' ||
    (typeof meta.hasPassword === 'string' && meta.hasPassword.toLowerCase() === 'true')
  return plain || hashed || flag
}

/* ------------------------------------------------------------------ */
/* Jetons d'accès à une room                                           */
/* ------------------------------------------------------------------ */

/** Durée de validité d'un jeton d'accès. */
export const ROOM_TOKEN_TTL_MS = 10 * 60 * 1000

/**
 * Émet un jeton prouvant que l'appelant a le droit d'accéder à cette room.
 *
 * Émis pour *toutes* les rooms, protégées ou non : sans cela, une room ouverte
 * ne fournirait aucune preuve d'accès et les routes de données ne pourraient
 * rien vérifier.
 */
export function issueRoomToken(
  roomId: string,
  secret: string,
): { accessToken: string; ts: number } {
  const ts = Date.now()
  const accessToken = createHmac('sha256', secret)
    .update(`${roomId}:${ts}`)
    .digest('hex')
  return { accessToken, ts }
}

/** Vérifie un jeton émis par `issueRoomToken`. */
export function verifyRoomToken(
  roomId: string,
  accessToken: string | null | undefined,
  ts: string | number | null | undefined,
  secret: string,
): boolean {
  if (!accessToken || ts === null || ts === undefined) return false

  const tsNum = Number(ts)
  if (!Number.isFinite(tsNum)) return false

  const age = Date.now() - tsNum
  if (age < 0 || age > ROOM_TOKEN_TTL_MS) return false

  const expected = createHmac('sha256', secret)
    .update(`${roomId}:${tsNum}`)
    .digest('hex')
  return safeEqualHex(expected, String(accessToken))
}

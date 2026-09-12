import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

/**
 * Authentification admin mono-utilisateur.
 *
 * Pas de base de données ni de comptes : un mot de passe unique en variable
 * d'environnement est échangé contre un cookie httpOnly signé HMAC.
 * Le cookie porte sa propre date d'expiration, elle-même couverte par la
 * signature — il n'y a donc aucun état à stocker côté serveur.
 */

export const ADMIN_COOKIE = 'cakejdr_admin'

/** Durée de validité d'une session admin. */
const TTL_MS = 8 * 60 * 60 * 1000

function sign(payload: string, secret: string) {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/** Comparaison en temps constant, tolérante aux longueurs différentes. */
function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/** True si les deux variables d'env nécessaires sont présentes. */
export function isAdminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.ADMIN_SESSION_SECRET)
}

export function checkAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return safeEqual(password, expected)
}

/** Construit le cookie de session à poser après un login réussi. */
export function buildAdminCookie() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET missing')
  const exp = Date.now() + TTL_MS
  const nonce = randomBytes(8).toString('hex')
  const payload = `${exp}.${nonce}`
  return {
    name: ADMIN_COOKIE,
    value: `${payload}.${sign(payload, secret)}`,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.floor(TTL_MS / 1000),
  }
}

/** Cookie vide et immédiatement expiré, pour la déconnexion. */
export function buildAdminLogoutCookie() {
  return {
    name: ADMIN_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  }
}

/**
 * Vérifie le cookie admin de la requête.
 * Seule source de vérité : ne jamais se fier à un état client.
 */
export function isAdmin(req: NextRequest) {
  const secret = process.env.ADMIN_SESSION_SECRET
  const raw = req.cookies.get(ADMIN_COOKIE)?.value
  if (!secret || !raw) return false

  const parts = raw.split('.')
  if (parts.length !== 3) return false
  const [expStr, nonce, signature] = parts as [string, string, string]

  const exp = Number(expStr)
  if (!Number.isFinite(exp) || Date.now() > exp) return false

  return safeEqual(signature, sign(`${expStr}.${nonce}`, secret))
}

/**
 * Variante asynchrone : accepte le cookie admin **ou** un compte marqué
 * administrateur en base.
 *
 * Le mot de passe admin reste utilisable en secours, notamment avant qu'un
 * compte existe. Il disparaîtra une fois l'identité par compte bien installée.
 */
export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  if (isAdmin(req)) return true
  try {
    const { syncCurrentUser } = await import('@/lib/db/users')
    const account = await syncCurrentUser()
    return account?.isAdmin === true
  } catch {
    return false
  }
}

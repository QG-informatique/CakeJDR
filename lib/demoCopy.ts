import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/**
 * Copies de la salle de démonstration : une par visiteur.
 *
 * Chaque visiteur reçoit sa propre salle Liveblocks, remplie depuis l'état de
 * référence de la démo : il joue l'aventure à son rythme, sans tomber sur la
 * partie d'un inconnu. Ces copies n'ont pas de ligne en base ; on les
 * reconnaît à leur identifiant, signé par le serveur pour qu'on ne puisse pas
 * en inventer (chaque salle créée compte dans le quota gratuit de Liveblocks).
 */

export const DEMO_COPY_PREFIX = 'demo-v-'

/** Une copie où personne n'est revenu depuis ce délai est supprimée la nuit. */
export const DEMO_COPY_TTL_DAYS = 7

function signature(nonce: string) {
  const secret = process.env.LIVEBLOCKS_SECRET_KEY
  if (!secret) return null
  return createHmac('sha256', secret).update(`demo-copy:${nonce}`).digest('hex').slice(0, 16)
}

/** Nouvel identifiant de copie, ou `null` si le serveur n'a pas sa clé. */
export function newDemoCopyId(): string | null {
  const nonce = randomBytes(6).toString('hex')
  const sig = signature(nonce)
  return sig ? `${DEMO_COPY_PREFIX}${nonce}-${sig}` : null
}

/** Vrai si l'identifiant a été émis par `newDemoCopyId`. */
export function isDemoCopyId(id: string): boolean {
  const m = /^demo-v-([0-9a-f]{12})-([0-9a-f]{16})$/.exec(id)
  if (!m) return false
  const expected = signature(m[1]!)
  if (!expected) return false
  return timingSafeEqual(Buffer.from(m[2]!, 'hex'), Buffer.from(expected, 'hex'))
}

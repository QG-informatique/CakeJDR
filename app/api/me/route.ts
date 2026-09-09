export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { syncCurrentUser } from '@/lib/db/users'
import { fail, ok } from '@/lib/api-response'

/**
 * Profil du compte connecté.
 *
 * Renvoie `user: null` pour un visiteur — ce n'est pas une erreur, c'est un
 * état normal de l'application, qui reste utilisable sans compte.
 */
export async function GET() {
  const account = await syncCurrentUser().catch(() => null)
  if (!account) return ok({ user: null })

  return ok({
    user: {
      id: account.id,
      pseudo: account.pseudo,
      color: account.color,
      isAdmin: account.isAdmin,
    },
  })
}

/** Couleur au format hexadecimal, seule forme acceptee. */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

/**
 * Met à jour le pseudo et la couleur du compte.
 *
 * Ces deux champs vivaient dans le navigateur, où chacun pouvait se renommer
 * librement — y compris en empruntant le nom d'un autre joueur. Ils sont
 * désormais validés et stockés côté serveur.
 */
export async function PATCH(req: NextRequest) {
  const account = await syncCurrentUser().catch(() => null)
  if (!account) return fail('sign in first', 401)

  const body = (await req.json().catch(() => ({}))) as {
    pseudo?: unknown
    color?: unknown
  }

  const patch: { pseudo?: string; color?: string } = {}

  if (typeof body.pseudo === 'string') {
    const pseudo = body.pseudo.trim()
    if (pseudo.length < 2 || pseudo.length > 32) {
      return fail('pseudo must be between 2 and 32 characters', 400)
    }
    patch.pseudo = pseudo
  }

  if (typeof body.color === 'string') {
    if (!HEX_COLOR.test(body.color)) return fail('color must be a hex value', 400)
    patch.color = body.color
  }

  if (Object.keys(patch).length === 0) return fail('nothing to update', 400)

  const [updated] = await db
    .update(users)
    .set(patch)
    .where(eq(users.id, account.id))
    .returning()

  return ok({
    user: updated
      ? {
          id: updated.id,
          pseudo: updated.pseudo,
          color: updated.color,
          isAdmin: updated.isAdmin,
        }
      : null,
  })
}

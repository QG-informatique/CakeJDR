export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { normalizePseudo, pseudoProblem, syncCurrentUser } from '@/lib/db/users'
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
      pseudoChosen: account.pseudoChosen,
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

  const patch: { pseudo?: string; color?: string; pseudoChosen?: boolean } = {}

  if (typeof body.pseudo === 'string') {
    const pseudo = normalizePseudo(body.pseudo)
    const problem = await pseudoProblem(pseudo, account.id)
    if (problem === 'taken') return fail('pseudo taken', 409)
    if (problem) return fail(`pseudo ${problem}`, 400)
    patch.pseudo = pseudo
    patch.pseudoChosen = true
  }

  if (typeof body.color === 'string') {
    if (!HEX_COLOR.test(body.color)) return fail('color must be a hex value', 400)
    patch.color = body.color
  }

  if (Object.keys(patch).length === 0) return fail('nothing to update', 400)

  let updated: typeof users.$inferSelect | undefined
  try {
    ;[updated] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, account.id))
      .returning()
  } catch (err) {
    // L'index unique tranche si deux joueurs valident le même pseudo à
    // l'instant près, entre la vérification et l'écriture.
    if (isUniqueViolation(err)) return fail('pseudo taken', 409)
    throw err
  }

  return ok({
    user: updated
      ? {
          id: updated.id,
          pseudo: updated.pseudo,
          color: updated.color,
          isAdmin: updated.isAdmin,
          pseudoChosen: updated.pseudoChosen,
        }
      : null,
  })
}

/** Code Postgres 23505, éventuellement enveloppé par le pilote. */
function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null
  return e?.code === '23505' || e?.cause?.code === '23505'
}

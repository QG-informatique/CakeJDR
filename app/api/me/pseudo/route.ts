export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { normalizePseudo, pseudoProblem, syncCurrentUser } from '@/lib/db/users'
import { fail, ok } from '@/lib/api-response'

/**
 * Disponibilité d'un pseudo, interrogée pendant la frappe : le joueur voit
 * qu'un nom est pris avant de valider, plutôt qu'après un refus.
 *
 * Réservé aux comptes connectés : un visiteur n'a pas de pseudo à choisir.
 */
export async function GET(req: NextRequest) {
  const account = await syncCurrentUser().catch(() => null)
  if (!account) return fail('sign in first', 401)

  const pseudo = normalizePseudo(req.nextUrl.searchParams.get('value') ?? '')
  const problem = await pseudoProblem(pseudo, account.id)
  return ok({ pseudo, available: problem === null, problem })
}

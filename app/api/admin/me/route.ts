export const runtime = 'nodejs'

import { isAdminRequest } from '@/lib/adminAuth'
import { ok } from '@/lib/api-response'

/**
 * Renvoie l'état admin du compte connecté.
 * Sert uniquement à l'affichage : toute action reste revérifiée côté serveur.
 */
export async function GET() {
  return ok({ isAdmin: await isAdminRequest() })
}

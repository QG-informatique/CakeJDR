export const runtime = 'nodejs'

import { NextRequest } from 'next/server'
import { isAdminConfigured, isAdminRequest } from '@/lib/adminAuth'
import { ok } from '@/lib/api-response'

/**
 * Renvoie l'état admin de la session courante.
 * Sert uniquement à l'affichage : toute action reste revérifiée côté serveur.
 */
export async function GET(req: NextRequest) {
  return ok({ isAdmin: await isAdminRequest(req), configured: isAdminConfigured() })
}

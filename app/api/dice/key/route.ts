export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { dicePublicKey } from '@/lib/diceSigning'

/** Clé publique qui permet à chaque navigateur de vérifier les lancers de dés. */
export async function GET() {
  return NextResponse.json(
    { key: dicePublicKey() },
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}

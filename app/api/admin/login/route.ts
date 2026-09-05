export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import {
  buildAdminCookie,
  buildAdminLogoutCookie,
  checkAdminPassword,
  isAdminConfigured,
} from '@/lib/adminAuth'
import { clientIp, rateLimit, resetRateLimit } from '@/lib/rateLimit'
import { fail } from '@/lib/api-response'

/** 5 tentatives par tranche de 15 minutes et par IP. */
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  if (!isAdminConfigured()) {
    return fail('admin not configured on this server', 500)
  }

  const key = `admin-login:${clientIp(req)}`
  const limit = rateLimit(key, MAX_ATTEMPTS, WINDOW_MS)
  if (!limit.allowed) {
    const res = fail('too many attempts', 429)
    res.headers.set('Retry-After', String(limit.retryAfter))
    return res
  }

  const body = (await req.json().catch(() => ({}))) as { password?: unknown }
  const password = typeof body.password === 'string' ? body.password : ''

  if (!password || !checkAdminPassword(password)) {
    // Message volontairement générique : ne pas indiquer si le mot de passe existe.
    return fail('invalid credentials', 401)
  }

  resetRateLimit(key)
  const res = NextResponse.json({ ok: true, isAdmin: true })
  res.cookies.set(buildAdminCookie())
  return res
}

/** Déconnexion : efface le cookie de session. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true, isAdmin: false })
  res.cookies.set(buildAdminLogoutCookie())
  return res
}

/**
 * Limiteur de débit minimaliste, en mémoire.
 *
 * Limite : en serverless (Vercel), chaque instance a son propre compteur, donc
 * le quota réel est « N tentatives par instance ». C'est suffisant pour freiner
 * un abus opportuniste (codes d'invitation essayés en boucle, copies de démo,
 * envois d'images), pas pour un quota strict. Choix d'octobre 2026 : on garde
 * la mémoire plutôt qu'un service Redis, qui ajouterait un compte externe pour
 * un gain faible sur un jeu entre amis. Si un quota strict devient nécessaire,
 * remplacer la Map par une table Neon en gardant exactement la même signature.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/** Purge opportuniste pour éviter que la Map ne grossisse indéfiniment. */
function sweep(now: number) {
  if (buckets.size < 500) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  /** Secondes à attendre avant la prochaine tentative autorisée. */
  retryAfter: number
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, retryAfter: 0 }
  }

  current.count += 1
  if (current.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }
  return { allowed: true, remaining: limit - current.count, retryAfter: 0 }
}

/** Meilleure approximation de l'IP client derrière le proxy Vercel. */
export function clientIp(req: Request) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return req.headers.get('x-real-ip') ?? 'unknown'
}

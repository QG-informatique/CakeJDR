import 'server-only'
import { eq } from 'drizzle-orm'
import { currentUser } from '@clerk/nextjs/server'
import { db } from './index'
import { users } from './schema'

export type AppUser = typeof users.$inferSelect

/**
 * Récupère l'utilisateur en base, en le créant à la volée s'il vient de
 * s'inscrire.
 *
 * Cette synchronisation paresseuse évite les webhooks Clerk, qui exigeraient
 * une URL publique — donc impossibles à faire fonctionner en local. La
 * contrepartie est un appel supplémentaire à la première visite seulement.
 */
export async function syncCurrentUser(): Promise<AppUser | null> {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const existing = await db.select().from(users).where(eq(users.id, clerkUser.id)).limit(1)
  if (existing.length > 0) return existing[0] ?? null

  // Nom affiché : on prend ce que Clerk sait, du plus parlant au plus neutre.
  const pseudo =
    clerkUser.username ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
    clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Joueur'

  const inserted = await db
    .insert(users)
    .values({ id: clerkUser.id, pseudo })
    // Deux onglets ouverts simultanement peuvent inserer en meme temps.
    .onConflictDoNothing()
    .returning()

  if (inserted.length > 0) return inserted[0] ?? null

  const after = await db.select().from(users).where(eq(users.id, clerkUser.id)).limit(1)
  return after[0] ?? null
}

/** Lit l'utilisateur en base sans le créer. */
export async function getUserById(id: string): Promise<AppUser | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return rows[0] ?? null
}

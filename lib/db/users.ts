import 'server-only'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db } from './index'
import { users } from './schema'

export type AppUser = typeof users.$inferSelect

/** Identifiant du compte connecté, ou `null` pour un visiteur. */
export async function currentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

/**
 * Récupère l'utilisateur en base, en le créant à la volée à sa première
 * connexion.
 *
 * Création paresseuse plutôt qu'au moment de la connexion : le compte existe
 * dès le premier appel qui en a besoin, sans dépendre d'une étape qui aurait
 * pu échouer entre-temps.
 */
export async function syncCurrentUser(): Promise<AppUser | null> {
  const session = await auth()
  const id = session?.user?.id
  if (!id) return null

  const existing = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (existing.length > 0) return existing[0] ?? null

  // Nom affiché : celui du compte Google ou Discord, sinon le début de l'email.
  const pseudo =
    (
      session.user?.name?.trim() ||
      session.user?.email?.split('@')[0] ||
      'Joueur'
    ).slice(0, 32)

  const inserted = await db
    .insert(users)
    .values({ id, pseudo })
    // Deux onglets ouverts simultanement peuvent inserer en meme temps.
    .onConflictDoNothing()
    .returning()

  if (inserted.length > 0) return inserted[0] ?? null

  const after = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return after[0] ?? null
}

/** Lit l'utilisateur en base sans le créer. */
export async function getUserById(id: string): Promise<AppUser | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return rows[0] ?? null
}

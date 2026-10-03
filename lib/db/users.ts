import 'server-only'
import { and, eq, ne, sql } from 'drizzle-orm'
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

  // Pseudo proposé : celui du compte Google ou Discord, sinon le début de
  // l'email. Le joueur le valide ou le change à sa première visite du menu
  // (`pseudoChosen`) ; d'ici là, un suffixe le garde unique.
  const wanted =
    normalizePseudo(session.user?.name ?? '') ||
    normalizePseudo(session.user?.email?.split('@')[0] ?? '') ||
    'Joueur'

  // Deux essais : le pseudo libre peut être pris entre la recherche et
  // l'insertion par un autre joueur qui se connecte au même moment.
  for (let attempt = 0; attempt < 2; attempt++) {
    const pseudo = await freePseudo(wanted)
    const inserted = await db
      .insert(users)
      .values({ id, pseudo })
      // Deux onglets ouverts simultanement peuvent inserer en meme temps.
      .onConflictDoNothing()
      .returning()
    if (inserted.length > 0) return inserted[0] ?? null
    const created = await getUserById(id)
    if (created) return created
  }

  const after = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return after[0] ?? null
}

/** Lit l'utilisateur en base sans le créer. */
export async function getUserById(id: string): Promise<AppUser | null> {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1)
  return rows[0] ?? null
}

export const PSEUDO_MIN = 2
export const PSEUDO_MAX = 32

/** Noms réservés : « Visiteur » désigne déjà qui joue sans compte. */
const RESERVED = new Set(['visiteur', 'visitor', 'admin', 'joueur'])

/** Espaces de début et de fin retirés, espaces multiples réduits à un seul. */
export function normalizePseudo(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, PSEUDO_MAX)
}

/** Raison du refus d'un pseudo, ou `null` s'il est utilisable. */
export async function pseudoProblem(
  pseudo: string,
  userId: string,
): Promise<'length' | 'reserved' | 'taken' | null> {
  if (pseudo.length < PSEUDO_MIN || pseudo.length > PSEUDO_MAX) return 'length'
  if (RESERVED.has(pseudo.toLowerCase())) return 'reserved'
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(sql`lower(${users.pseudo}) = lower(${pseudo})`, ne(users.id, userId)))
    .limit(1)
  return rows.length > 0 ? 'taken' : null
}

/** `wanted` s'il est libre, sinon `wanted-2`, `wanted-3`… */
async function freePseudo(wanted: string): Promise<string> {
  const base = wanted.length >= PSEUDO_MIN ? wanted : 'Joueur'
  const rows = await db
    .select({ pseudo: users.pseudo })
    .from(users)
    .where(sql`starts_with(lower(${users.pseudo}), lower(${base.slice(0, PSEUDO_MAX - 4)}))`)
  const taken = new Set(rows.map((r) => r.pseudo.toLowerCase()))
  if (!taken.has(base.toLowerCase()) && !RESERVED.has(base.toLowerCase())) return base
  const stem = base.slice(0, PSEUDO_MAX - 4)
  for (let n = 2; n < 1000; n++) {
    const candidate = `${stem}-${n}`
    if (!taken.has(candidate.toLowerCase())) return candidate
  }
  return `${stem}-${crypto.randomUUID().slice(0, 3)}`
}

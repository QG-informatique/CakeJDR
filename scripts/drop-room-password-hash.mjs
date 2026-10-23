/**
 * Supprime la colonne `rooms.password_hash`, inutile depuis que les tables se
 * rejoignent par code d'invitation (plus de mot de passe de table).
 *
 * Écrit à la main plutôt que par `drizzle-kit push`. Affiche d'abord combien de
 * tables avaient encore un mot de passe ; sans effet si la colonne n'existe plus.
 *
 *   node --env-file=.env.local scripts/drop-room-password-hash.mjs
 */
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)

const cols = await sql`select 1 from information_schema.columns
  where table_name = 'rooms' and column_name = 'password_hash'`
if (cols.length === 0) {
  console.log('Colonne rooms.password_hash déjà absente.')
} else {
  const [{ count }] = await sql`select count(*)::int as count from rooms where password_hash is not null`
  console.log(`${count} table(s) avaient encore un mot de passe.`)
  await sql`alter table rooms drop column password_hash`
  console.log('Colonne rooms.password_hash supprimée.')
}

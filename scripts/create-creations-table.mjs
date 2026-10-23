/**
 * Crée la table `creations` : systèmes de jeu, campagnes et modèles de fiche
 * qu'un MJ fabrique lui-même et réutilise d'une table à l'autre.
 *
 * Écrit à la main plutôt que par `drizzle-kit push`, qui pourrait proposer de
 * supprimer des colonnes encore en place. Sans effet si la table existe déjà.
 *
 *   node --env-file=.env.local scripts/create-creations-table.mjs
 */
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)

await sql`create table if not exists creations (
  id text primary key,
  owner_id text not null references users(id) on delete cascade,
  kind text not null,
  name text not null default '',
  data jsonb not null,
  shared boolean not null default false,
  updated_at timestamptz not null default now()
)`
await sql`create index if not exists creations_owner_kind_idx on creations (owner_id, kind)`

const [{ count }] = await sql`select count(*)::int as count from creations`
console.log(`Table creations prête (${count} ligne(s)).`)

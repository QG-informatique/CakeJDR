import type { Config } from 'drizzle-kit'

/**
 * Les migrations exigent une connexion directe : pgbouncer, utilisé par la
 * connexion poolée, ne supporte pas les instructions DDL en session.
 */
export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '',
  },
} satisfies Config

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

/**
 * Client de base de données.
 *
 * Utilise la connexion poolée : en serverless chaque invocation ouvre sa
 * propre connexion, et sans pooling la base sature vite. Les migrations, elles,
 * passent par `DATABASE_URL_UNPOOLED` (voir `drizzle.config.ts`).
 */
function connectionString() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return url
}

export const db = drizzle(neon(connectionString()), { schema })
export { schema }

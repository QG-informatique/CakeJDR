import 'server-only'
import { and, eq, or } from 'drizzle-orm'
import { db } from '.'
import { creations } from './schema'
import { parseCustomSystem } from '@/lib/customSystem'
import { parseCampaign } from '@/lib/autoGm/custom'

/** Ce qu'un MJ peut ranger sur son compte (`creations.kind`). */
export const CREATION_KINDS = ['system', 'campaign'] as const
export type CreationKind = (typeof CREATION_KINDS)[number]

export const isCreationKind = (v: unknown): v is CreationKind => CREATION_KINDS.includes(v as CreationKind)

/** Contenu remis en forme selon son genre, `null` s'il n'en est pas un. */
export function parseCreation(kind: CreationKind, data: unknown) {
  return kind === 'system' ? parseCustomSystem(data) : parseCampaign(data)
}

/** Une création de ce compte, ou partagée par son auteur ; `null` sinon. */
export async function readCreation(id: string, kind: CreationKind, accountId: string | null) {
  const visible = accountId ? or(eq(creations.ownerId, accountId), eq(creations.shared, true)) : eq(creations.shared, true)
  const [row] = await db
    .select()
    .from(creations)
    .where(and(eq(creations.id, id), eq(creations.kind, kind), visible))
    .limit(1)
  return row ?? null
}

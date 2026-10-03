/**
 * Cycle de vie des tables : une table où personne n'est entré depuis
 * `ROOM_INACTIVE_DAYS` jours est supprimée par la tâche planifiée
 * `/api/cron/cleanup-rooms`. Son MJ est prévenu dans le menu à partir de
 * `ROOM_WARNING_DAYS` jours d'inactivité.
 */
export const ROOM_INACTIVE_DAYS = 180
export const ROOM_WARNING_DAYS = 150

const DAY_MS = 24 * 60 * 60 * 1000

/** Date de suppression prévue, si la table est dans sa période d'avertissement. */
export function roomDeletionDate(lastActiveAt: string | undefined, now = Date.now()) {
  if (!lastActiveAt) return null
  const last = new Date(lastActiveAt).getTime()
  if (Number.isNaN(last) || now - last < ROOM_WARNING_DAYS * DAY_MS) return null
  return new Date(last + ROOM_INACTIVE_DAYS * DAY_MS)
}

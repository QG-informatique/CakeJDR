export type ApiSuccess<T extends object = object> = {
  ok: true
} & T

export type ApiFailure = {
  ok: false
  error: string
}

export type ApiResult<T extends object = object> = ApiSuccess<T> | ApiFailure

export type RoomInfoResponse = {
  id: string
  name: string
  /** True si la room a un propriétaire enregistré (false pour les rooms d'avant l'ownership). */
  hasOwner?: boolean
  /** Rôle de l'appelant dans cette table : `gm` ou `player`. */
  role?: string
  /** Code d'invitation, renvoyé uniquement au MJ de la table. */
  joinCode?: string
  createdAt?: string
  updatedAt?: string
  usersConnected?: number
  /** Réservé à l'admin : salle de démonstration. */
  isDemo?: boolean
  /** Réservé à l'admin : dernière ouverture de la table par un joueur. */
  lastActiveAt?: string
  /** Qui a accès à la table, MJ en premier, et qui y est en ce moment. */
  members?: Array<{ pseudo: string; role: string; color?: string; online?: boolean }>
  /** Présents qui ne sont pas membres : visiteurs de la démo, admin. */
  guestsOnline?: number
}

export type RoomsListResponse = ApiResult<{
  rooms: RoomInfoResponse[]
}>

export type RoomMutationResponse = ApiResult<{
  id?: string
}>

export type RoomCreateResponse = ApiResult<{
  id: string
}>

export type AdminStatusResponse = ApiResult<{
  isAdmin: boolean
  configured: boolean
}>

export type AdminBulkDeleteResponse = ApiResult<{
  deleted: string[]
  failed: Array<{ id: string; error: string }>
}>

export type RoomStorageResponse<T> = ApiResult<{
  characters: Record<string, T>
}>

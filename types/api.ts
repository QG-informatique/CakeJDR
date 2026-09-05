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
  hasPassword?: boolean
  /** True si la room a un propriétaire enregistré (false pour les rooms d'avant l'ownership). */
  hasOwner?: boolean
  createdAt?: string
  updatedAt?: string
  usersConnected?: number
}

export type RoomsListResponse = ApiResult<{
  rooms: RoomInfoResponse[]
}>

export type RoomMutationResponse = ApiResult<{
  id?: string
}>

export type RoomCreateResponse = ApiResult<{
  id: string
  /** Secret de propriété, renvoyé une seule fois à la création. */
  ownerSecret?: string
}>

export type RoomVerifyResponse = ApiResult<{
  guarded: boolean
  /** Token HMAC signé, valide 10 minutes. Présent seulement si guarded=true. */
  accessToken?: string
  ts?: number
}>

export type AdminStatusResponse = ApiResult<{
  isAdmin: boolean
  configured: boolean
}>

export type AdminBulkDeleteResponse = ApiResult<{
  deleted: string[]
  failed: Array<{ id: string; error: string }>
}>

export type BlobListEntry = {
  pathname: string
  size?: number
  uploadedAt?: string
  downloadUrl?: string
  url?: string
}

export type BlobListResponse = ApiResult<{
  files: {
    blobs: BlobListEntry[]
  }
}>

export type RoomStorageResponse<T> = ApiResult<{
  characters: Record<string, T>
}>

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

export type RoomVerifyResponse = ApiResult<{
  guarded: boolean
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

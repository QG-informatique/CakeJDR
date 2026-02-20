'use client'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
])
const API_ENDPOINT = '/api/cloudinary'
const SIGNATURE_ENDPOINT = '/api/cloudinary/signature'
const BASE_TRANSFORM = 'f_auto,q_auto,c_limit,w_2048,h_2048'
const THUMB_TRANSFORM = `${BASE_TRANSFORM}/e_blur:1000,w_256,h_256`

export type UploadStep =
  | 'VALIDATION_FICHIER'
  | 'PREPARATION_FORMDATA'
  | 'SIGNATURE_REQUEST'
  | 'ENVOI_RESEAU'
  | 'REPONSE_SERVEUR'
  | 'CLOUDINARY_RESULT'
  | 'POST_UPLOAD'
  | 'UPLOAD_DIRECT'

export type UploadErrorCode =
  | 'FILE_MISSING'
  | 'IMAGE_EMPTY'
  | 'IMAGE_INVALID_TYPE'
  | 'IMAGE_TOO_LARGE'
  | 'FORMDATA_FAILED'
  | 'SIGNATURE_FETCH_FAILED'
  | 'SIGNATURE_INVALID'
  | 'NETWORK_ERROR'
  | 'API_HTTP_4XX'
  | 'API_HTTP_5XX'
  | 'CLOUDINARY_UPLOAD_FAILED'
  | 'CLOUDINARY_MISSING_URL'
  | 'RESPONSE_PARSE_ERROR'
  | 'POST_UPLOAD_FAILED'
  | 'UNKNOWN_UPLOAD_ERROR'

export type CloudinaryResult = {
  url: string
  deliveryUrl?: string
  thumbUrl?: string
  publicId: string
  width?: number
  height?: number
  bytes?: number
  format?: string
  rawResponse?: Record<string, unknown>
}

export type UploadErrorDetails = Record<string, unknown>

type CloudinarySignature = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder?: string
}

export class UploadError extends Error {
  code: UploadErrorCode

  step: UploadStep

  userMessage: string

  details?: UploadErrorDetails

  constructor(params: {
    code: UploadErrorCode
    step: UploadStep
    userMessage: string
    details?: UploadErrorDetails
  }) {
    super(params.userMessage)
    this.name = 'UploadError'
    this.code = params.code
    this.step = params.step
    this.userMessage = params.userMessage
    this.details = params.details
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined

const readNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const buildUploadError = (
  code: UploadErrorCode,
  step: UploadStep,
  userMessage: string,
  details?: UploadErrorDetails,
) => new UploadError({ code, step, userMessage, details })

const buildDeliveryUrl = (cloudName: string, publicId: string, transform: string) =>
  `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`

const validateFile = (file: File): void => {
  if (!file) {
    throw buildUploadError(
      'FILE_MISSING',
      'VALIDATION_FICHIER',
      "Aucun fichier n'a été fourni.",
    )
  }
  if (file.size <= 0) {
    throw buildUploadError(
      'IMAGE_EMPTY',
      'VALIDATION_FICHIER',
      "Le fichier d'image est vide.",
      { size: file.size },
    )
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw buildUploadError(
      'IMAGE_INVALID_TYPE',
      'VALIDATION_FICHIER',
      "Format d'image non pris en charge.",
      { type: file.type },
    )
  }
  if (file.size > MAX_BYTES) {
    throw buildUploadError(
      'IMAGE_TOO_LARGE',
      'VALIDATION_FICHIER',
      `Image trop lourde (max ${Math.floor(MAX_BYTES / (1024 * 1024))} Mo).`,
      { size: file.size },
    )
  }
}

const prepareFormData = (file: File): FormData => {
  try {
    const form = new FormData()
    form.append('file', file)
    return form
  } catch (error) {
    const message = error instanceof Error ? error.message : 'FormData error'
    throw buildUploadError(
      'FORMDATA_FAILED',
      'PREPARATION_FORMDATA',
      "Impossible de préparer l'upload de l'image.",
      { message },
    )
  }
}

const parseResponse = async (res: Response): Promise<Record<string, unknown>> => {
  let text = ''
  try {
    text = await res.text()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid response payload'
    throw buildUploadError(
      'RESPONSE_PARSE_ERROR',
      'REPONSE_SERVEUR',
      'Reponse serveur illisible.',
      { status: res.status, message },
    )
  }

  if (!text) return {}

  try {
    const json = JSON.parse(text)
    if (!isRecord(json)) {
      throw new Error('Payload is not an object')
    }
    return json
  } catch (error) {
    if (!res.ok) {
      return { _rawText: text }
    }
    const message = error instanceof Error ? error.message : 'Invalid JSON payload'
    throw buildUploadError(
      'RESPONSE_PARSE_ERROR',
      'REPONSE_SERVEUR',
      'Reponse serveur illisible.',
      { status: res.status, message, text: text.slice(0, 400) },
    )
  }
}

const normalizeResult = (body: Record<string, unknown>): CloudinaryResult => {
  const deliveryUrl = readString(body.deliveryUrl)
  const thumbUrl = readString(body.thumbUrl)
  const secureUrl = readString(body.secure_url)
  const url = readString(body.url)
  const publicId = readString(body.public_id) ?? readString(body.publicId)

  if (!publicId) {
    throw buildUploadError(
      'CLOUDINARY_UPLOAD_FAILED',
      'CLOUDINARY_RESULT',
      'Réponse Cloudinary incomplète (public_id manquant).',
      { body },
    )
  }

  const finalUrl = deliveryUrl ?? secureUrl ?? url
  if (!finalUrl) {
    throw buildUploadError(
      'CLOUDINARY_MISSING_URL',
      'CLOUDINARY_RESULT',
      "Cloudinary n'a pas fourni d'URL exploitable.",
      { body },
    )
  }

  return {
    url: finalUrl,
    deliveryUrl: deliveryUrl ?? secureUrl ?? url,
    thumbUrl,
    publicId,
    width: readNumber(body.width),
    height: readNumber(body.height),
    bytes: readNumber(body.bytes),
    format: readString(body.format),
    rawResponse: body,
  }
}

const readServerErrorMessage = (body: Record<string, unknown>): string | undefined => {
  const rawError = body.error
  if (typeof rawError === 'string' && rawError.trim().length > 0) {
    return rawError
  }
  if (isRecord(rawError) && typeof rawError.message === 'string' && rawError.message.trim().length > 0) {
    return rawError.message
  }
  const rawText = readString(body._rawText)
  if (rawText) {
    const trimmed = rawText.trim()
    if (!trimmed.startsWith('<')) {
      return trimmed.slice(0, 200)
    }
  }
  return undefined
}

const mapHttpError = (status: number, body: Record<string, unknown>): UploadError => {
  if (status === 413) {
    return buildUploadError(
      'IMAGE_TOO_LARGE',
      'REPONSE_SERVEUR',
      'Image trop lourde (limite serveur).',
      { status, body },
    )
  }
  const code: UploadErrorCode = status >= 500 ? 'API_HTTP_5XX' : 'API_HTTP_4XX'
  const baseMessage =
    status >= 500
      ? 'Le serveur Cloudinary a rencontré une erreur.'
      : "La requête d'upload a été refusée."
  const serverMessage = readServerErrorMessage(body)
  const userMessage = serverMessage ? `${baseMessage} (${serverMessage})` : baseMessage
  const details: UploadErrorDetails = serverMessage
    ? { status, body, serverMessage }
    : { status, body }
  return buildUploadError(code, 'REPONSE_SERVEUR', userMessage, details)
}

const parseSignaturePayload = (body: Record<string, unknown>): CloudinarySignature => {
  const cloudName = readString(body.cloudName)
  const apiKey = readString(body.apiKey)
  const signature = readString(body.signature)
  const timestamp = readNumber(body.timestamp)
  const folder = readString(body.folder)

  if (!cloudName || !apiKey || !signature || !timestamp) {
    throw buildUploadError(
      'SIGNATURE_INVALID',
      'SIGNATURE_REQUEST',
      'Signature upload invalide.',
      { body },
    )
  }

  return { cloudName, apiKey, signature, timestamp, folder }
}

const tryFetchSignature = async (): Promise<CloudinarySignature | null> => {
  let res: Response
  try {
    res = await fetch(SIGNATURE_ENDPOINT, { method: 'POST', cache: 'no-store' })
  } catch {
    return null
  }

  const body = await parseResponse(res)
  if (!res.ok) {
    return null
  }

  try {
    return parseSignaturePayload(body)
  } catch {
    return null
  }
}

const uploadDirectToCloudinary = async (
  file: File,
  signature: CloudinarySignature,
): Promise<CloudinaryResult> => {
  const form = new FormData()
  form.append('file', file)
  form.append('api_key', signature.apiKey)
  form.append('timestamp', String(signature.timestamp))
  form.append('signature', signature.signature)
  if (signature.folder) form.append('folder', signature.folder)

  let res: Response
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
      { method: 'POST', body: form },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error'
    throw buildUploadError(
      'NETWORK_ERROR',
      'UPLOAD_DIRECT',
      'Impossible de contacter le service upload.',
      { message },
    )
  }

  const body = await parseResponse(res)
  if (!res.ok) {
    throw mapHttpError(res.status, body)
  }

  const publicId = readString(body.public_id) ?? readString(body.publicId)
  const deliveryUrl = publicId
    ? buildDeliveryUrl(signature.cloudName, publicId, BASE_TRANSFORM)
    : undefined
  const thumbUrl = publicId
    ? buildDeliveryUrl(signature.cloudName, publicId, THUMB_TRANSFORM)
    : undefined

  const enrichedBody = publicId
    ? { ...body, deliveryUrl, thumbUrl }
    : body
  return normalizeResult(enrichedBody)
}

const uploadViaApi = async (file: File): Promise<CloudinaryResult> => {
  const form = prepareFormData(file)
  let res: Response
  try {
    res = await fetch(API_ENDPOINT, { method: 'POST', body: form, cache: 'no-store' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error'
    throw buildUploadError(
      'NETWORK_ERROR',
      'ENVOI_RESEAU',
      'Impossible de contacter le service upload.',
      { message },
    )
  }

  const body = await parseResponse(res)
  if (!res.ok) {
    throw mapHttpError(res.status, body)
  }
  return normalizeResult(body)
}

export const uploadImageToCloudinary = async (
  file: File,
): Promise<CloudinaryResult> => {
  try {
    validateFile(file)
    const signature = await tryFetchSignature()
    if (signature) {
      return await uploadDirectToCloudinary(file, signature)
    }
    return await uploadViaApi(file)
  } catch (error) {
    if (error instanceof UploadError) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    throw buildUploadError(
      'UNKNOWN_UPLOAD_ERROR',
      'CLOUDINARY_RESULT',
      "Échec inattendu de l'upload.",
      { message },
    )
  }
}

export const extractUploadErrorInfo = (
  error: unknown,
): {
  userMessage: string
  code?: UploadErrorCode
  step?: UploadStep
  details?: UploadErrorDetails
} => {
  if (error instanceof UploadError) {
    return {
      userMessage: `Échec upload (${error.code}) : ${error.userMessage}`,
      code: error.code,
      step: error.step,
      details: error.details,
    }
  }
  const message = error instanceof Error ? error.message : 'Erreur inconnue'
  return {
    userMessage: `Échec upload (UNKNOWN_UPLOAD_ERROR) : ${message}`,
    code: 'UNKNOWN_UPLOAD_ERROR',
    step: 'CLOUDINARY_RESULT',
    details: typeof error === 'object' && error ? { error } : undefined,
  }
}



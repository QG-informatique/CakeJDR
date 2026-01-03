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

export type UploadStep =
  | 'VALIDATION_FICHIER'
  | 'PREPARATION_FORMDATA'
  | 'ENVOI_RESEAU'
  | 'REPONSE_SERVEUR'
  | 'CLOUDINARY_RESULT'
  | 'POST_UPLOAD'

export type UploadErrorCode =
  | 'FILE_MISSING'
  | 'IMAGE_EMPTY'
  | 'IMAGE_INVALID_TYPE'
  | 'IMAGE_TOO_LARGE'
  | 'FORMDATA_FAILED'
  | 'NETWORK_ERROR'
  | 'API_HTTP_4XX'
  | 'API_HTTP_5XX'
  | 'CLOUDINARY_UPLOAD_FAILED'
  | 'CLOUDINARY_MISSING_URL'
  | 'RESPONSE_PARSE_ERROR'
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
  try {
    const json = await res.json()
    if (!isRecord(json)) {
      throw new Error('Payload is not an object')
    }
    return json
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON payload'
    throw buildUploadError(
      'RESPONSE_PARSE_ERROR',
      'REPONSE_SERVEUR',
      'Réponse Cloudinary illisible.',
      { status: res.status, message },
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

const mapHttpError = (status: number, body: Record<string, unknown>): UploadError => {
  const code: UploadErrorCode = status >= 500 ? 'API_HTTP_5XX' : 'API_HTTP_4XX'
  const userMessage =
    status >= 500
      ? 'Le serveur Cloudinary a rencontré une erreur.'
      : "La requête d'upload a été refusée."
  return buildUploadError(code, 'REPONSE_SERVEUR', userMessage, { status, body })
}

export const uploadImageToCloudinary = async (
  file: File,
): Promise<CloudinaryResult> => {
  try {
    validateFile(file)
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
  } catch (error) {
    if (error instanceof UploadError) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    throw buildUploadError(
      'UNKNOWN_UPLOAD_ERROR',
      'CLOUDINARY_RESULT',
      'Échec inattendu de l’upload.',
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

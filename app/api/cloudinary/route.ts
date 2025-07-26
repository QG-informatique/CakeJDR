import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Ensure FormData is available in this Node runtime

// Configure Cloudinary.
// The environment variables are only checked when the route is invoked so
// builds won't fail if they are missing. A runtime error is still returned
// when configuration is incomplete.
function configureCloudinary(): boolean {
  const { CLOUDINARY_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY } = process.env

  if (CLOUDINARY_URL) {
    cloudinary.config({ secure: true })
    return true
  }

  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY) {
    cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, secure: true })
    return true
  }

  console.error('Missing Cloudinary configuration')
  return false
}

// L’upload POST (multipart/form-data)
export async function POST(req: NextRequest) {
  if (!configureCloudinary()) {
    return NextResponse.json(
      { error: 'Cloudinary configuration incomplete' },
      { status: 500 }
    )
  }

  const incoming = await req.formData()
  const file = incoming.get('file') as File | null
  const preset =
    (incoming.get('upload_preset') as string | null) ??
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ??
    'cakejdr-images'

  if (!file) {
    return NextResponse.json({ error: 'No file received' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const data = new FormData()
  data.append('file', new Blob([buffer], { type: file.type }), file.name)
  data.append('upload_preset', preset)
  data.append('folder', 'cakejdr')

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  const resCloud = await fetch(url, { method: 'POST', body: data })
  const text = await resCloud.text()

  if (!resCloud.ok) {
    console.error('Cloudinary error:', text)
    return NextResponse.json({ error: 'Upload failed', details: text }, { status: 500 })
  }

  try {
    const json = JSON.parse(text)
    return NextResponse.json({ url: json.secure_url })
  } catch (e) {
    console.error('Cloudinary parsing error:', e)
    return NextResponse.json({ error: 'Invalid response from Cloudinary' }, { status: 500 })
  }
}

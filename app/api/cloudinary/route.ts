import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary.
// The environment variables are only checked when the route is invoked so
// builds won't fail if they are missing. A runtime error is still returned
// when configuration is incomplete.
function configureCloudinary(): boolean {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_KEY, CLOUDINARY_API_SECRET } =
    process.env

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_KEY || !CLOUDINARY_API_SECRET) {
    console.error('Missing Cloudinary configuration environment variables')
    return false
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  })
  return true
}

// L’upload POST (multipart/form-data)
export async function POST(req: NextRequest) {
  if (!configureCloudinary()) {
    return NextResponse.json(
      { error: 'Cloudinary configuration incomplete' },
      { status: 500 }
    )
  }
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file received' }, { status: 400 })
  }

  // Transformer le fichier en buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'cakejdr' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    })

    return NextResponse.json({ url: uploadResult.secure_url })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

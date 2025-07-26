import type { NextApiRequest, NextApiResponse } from 'next'
import { v2 as cloudinary } from 'cloudinary'
import formidable, { File } from 'formidable'
import fs from 'fs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const form = formidable()

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Formidable error:', err)
      return res.status(500).json({ error: 'Form parsing failed' })
    }

    const uploaded = files.file as File | File[] | undefined
    const file = Array.isArray(uploaded) ? uploaded[0] : uploaded
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    try {
      const result = await cloudinary.uploader.unsigned_upload(
        file.filepath,
        'cakejdr-image',
        {
          use_filename: true,
          unique_filename: false,
          overwrite: true,
        },
      )
      fs.unlinkSync(file.filepath)
      return res.status(200).json({ url: result.secure_url })
    } catch (uploadError: unknown) {
      console.error('Cloudinary upload error:', uploadError)
      const message = uploadError instanceof Error ? uploadError.message : 'Unknown error'
      return res.status(500).json({ error: 'Upload failed', details: message })
    }
  })
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { put, del, list } from '@vercel/blob'
import { NextResponse } from 'next/server'

// Handler POST (upload)
export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  if (!filename) return NextResponse.json({ error: 'filename missing' }, { status: 400 })

  try {
    const body = request.body as any
    const blob = await put(filename, body, { access: 'public' })
    return NextResponse.json(blob)
  } catch {
    return NextResponse.json({ error: 'upload failed' }, { status: 500 })
  }
}

// Handler DELETE (suppression d'un fichier)
export async function DELETE(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  if (!filename) return NextResponse.json({ error: 'filename missing' }, { status: 400 })

  try {
    await del(filename)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }
}

// Handler GET (liste tous les fichiers avec un prefix)
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const prefix = searchParams.get('prefix') || 'FichePerso/'
  try {
    const files = await list({ prefix })
    return NextResponse.json({ files })
  } catch {
    return NextResponse.json({ error: 'list failed' }, { status: 500 })
  }
}

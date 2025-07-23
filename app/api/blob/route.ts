/* eslint-disable @typescript-eslint/no-explicit-any */
import { put, del, list } from '@vercel/blob'
import { NextResponse } from 'next/server'

// Handler POST (upload)
export async function POST(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  if (!filename) return NextResponse.json({ error: 'filename missing' }, { status: 400 })

  const body = request.body as any
  const blob = await put(filename, body, { access: 'public' })
  return NextResponse.json(blob)
}

// Handler DELETE (suppression d'un fichier)
export async function DELETE(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get('filename')
  if (!filename) return NextResponse.json({ error: 'filename missing' }, { status: 400 })

  await del(filename)
  return NextResponse.json({ success: true })
}

// Handler GET (liste tous les fichiers avec un prefix)
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const prefix = searchParams.get('prefix') || 'FichePerso/'
  const files = await list({ prefix })
  return NextResponse.json({ files })
}

export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { debug } from '@/lib/debug'

export async function GET() {
  return NextResponse.json({ error: 'method not allowed' }, { status: 405 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filename = searchParams.get('filename')
  if (!filename) {
    return NextResponse.json({ error: 'filename missing' }, { status: 400 })
  }
  try {
    await del(filename)
    debug('blop delete', filename)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }
}

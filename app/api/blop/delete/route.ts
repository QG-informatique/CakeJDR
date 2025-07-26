import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filename = searchParams.get('filename')
  if (!filename) {
    return NextResponse.json({ error: 'filename missing' }, { status: 400 })
  }
  try {
    await del(filename)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'delete failed' }, { status: 500 })
  }
}

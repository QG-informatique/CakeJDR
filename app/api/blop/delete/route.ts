export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { del } from '@vercel/blob'
import { debug } from '@/lib/debug'
import { fail, ok } from '@/lib/api-response'

export async function GET() {
  return fail('method not allowed', 405)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filename = searchParams.get('filename')
  if (!filename) {
    return fail('filename missing', 400)
  }
  try {
    await del(filename)
    debug('blop delete', filename)
    const res = ok({ success: true })
    res.headers.set('X-CakeJDR-Legacy-Route', '/api/blop/delete is deprecated; use /api/blob')
    return res
  } catch {
    return fail('delete failed', 500)
  }
}

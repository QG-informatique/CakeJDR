import { NextResponse } from 'next/server'

export function ok<T extends object>(data?: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...(data ?? {}) }, init)
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}

import { NextResponse } from 'next/server'

// [FIX #2] endpoint to provide server timestamp
export async function GET() {
  return NextResponse.json({ ts: Date.now() })
}

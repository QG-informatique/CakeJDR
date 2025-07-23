/* eslint-disable @typescript-eslint/no-explicit-any */
import { put, list } from '@vercel/blob'
import { NextResponse } from 'next/server'

const FILE = 'rooms.json'

async function readRooms(): Promise<any[]> {
  const { blobs } = await list({ prefix: FILE })
  if (blobs.length === 0) return []
  const url = blobs[0].downloadUrl || blobs[0].url
  const res = await fetch(url)
  const data = await res.json().catch(() => [])
  return Array.isArray(data) ? data : []
}

export async function GET() {
  const rooms = await readRooms()
  return NextResponse.json({ rooms })
}

export async function POST(req: Request) {
  const { name, password } = await req.json()
  const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`
  const rooms = await readRooms()
  rooms.push({ id, name, password })
  await put(FILE, JSON.stringify(rooms), { access: 'public', addRandomSuffix: false, allowOverwrite: true })
  return NextResponse.json({ id })
}

// src/app/api/rooms/verify/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Liveblocks } from "@liveblocks/node";
import crypto from "node:crypto";

const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    const password = String(body?.password || "");

    if (!id) return bad("Missing id");
    const secret = process.env.LIVEBLOCKS_SECRET_KEY;
    if (!secret) return bad("Server misconfigured", 500);

    const lb = new Liveblocks({ secret });
    const room = await lb.getRoom(id).catch(() => null);
    if (!room) return bad("Room not found", 404);

    const meta = (room as { metadata?: Record<string, unknown> }).metadata ?? {};
    const storedPlain = typeof meta.password === "string" ? meta.password : null;
    const storedHash  = typeof meta.passwordHash === "string" ? meta.passwordHash : null;
    const hasPassword = !!storedPlain || !!storedHash || meta.hasPassword === true;

    // Pas de mot de passe → accès OK
    if (!hasPassword) return NextResponse.json({ ok: true, guarded: false });

    // Vérif (plain OU hash)
    const ok =
      (storedPlain && password && password === storedPlain) ||
      (storedHash && password && sha256(password) === storedHash);

    if (!ok) return bad("Invalid password", 401);

    return NextResponse.json({ ok: true, guarded: true });
  } catch (e: unknown) {
    return bad(e instanceof Error ? e.message : "verify failed", 500);
  }
}

export const runtime = "nodejs";

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/rateLimit";

const CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const FOLDER = "cakejdr";

/**
 * Cette route délivre de quoi téléverser directement chez Cloudinary. Sans
 * limite, elle offrait un droit d'upload illimité sur le compte à qui la
 * demandait. La limite de débit ci-dessous est le contrôle sûr et vérifiable ;
 * restreindre en plus les paramètres signés (formats, taille) suppose de
 * confirmer leur comportement dans la doc Cloudinary — noté au TODO.
 */
const SIGN_LIMIT = 20;
const SIGN_WINDOW_MS = 10 * 60 * 1000;

function bad(msg: string, code = 500) {
  return NextResponse.json({ error: msg }, { status: code });
}

function resolveCloudinaryConfig() {
  let cloudName = CLOUD_NAME;
  let apiKey = API_KEY;
  let apiSecret = API_SECRET;

  if (CLOUDINARY_URL) {
    try {
      const parsed = new URL(CLOUDINARY_URL);
      if (!cloudName) cloudName = parsed.hostname;
      if (!apiKey) apiKey = decodeURIComponent(parsed.username);
      if (!apiSecret) apiSecret = decodeURIComponent(parsed.password);
    } catch {
      // ignore invalid CLOUDINARY_URL
    }
  }

  return { cloudName, apiKey, apiSecret };
}

function signUpload(
  params: Record<string, string | number>,
  apiSecret: string,
) {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(`cloudinary-sign:${clientIp(req)}`, SIGN_LIMIT, SIGN_WINDOW_MS);
  if (!limit.allowed) {
    const res = NextResponse.json({ error: "too many requests" }, { status: 429 });
    res.headers.set("Retry-After", String(limit.retryAfter));
    return res;
  }

  const { cloudName, apiKey, apiSecret } = resolveCloudinaryConfig();
  if (!cloudName) return bad("Missing CLOUDINARY_CLOUD_NAME env", 500);
  if (!apiKey || !apiSecret) {
    return bad("Missing CLOUDINARY_API_KEY/SECRET env", 500);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signUpload({ folder: FOLDER, timestamp }, apiSecret);

  return NextResponse.json({
    ok: true,
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: FOLDER,
  });
}

export const runtime = "nodejs";

import crypto from "crypto";
import { NextResponse } from "next/server";

const CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME ||
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

const FOLDER = "cakejdr";

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

export async function POST() {
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

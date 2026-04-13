export const runtime = 'nodejs';
import { ok } from '@/lib/api-response'

let last = 0;

export async function GET() {
  const now = Date.now();
  if (now <= last) {
    last += 1;
  } else {
    last = now;
  }
  return ok({ ts: last });
}

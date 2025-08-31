export const runtime = 'nodejs';

let last = 0;

export async function GET() {
  const now = Date.now();
  if (now <= last) {
    last += 1;
  } else {
    last = now;
  }
  return Response.json({ ts: last });
}

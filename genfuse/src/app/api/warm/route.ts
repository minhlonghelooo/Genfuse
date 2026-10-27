import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/** The page calls this the moment it opens, so the server and the database are already awake when the first real request comes. */
export async function GET(req: Request) {
  if (!rateLimit(`warm:${clientIp(req)}`, 30, 60_000)) return NextResponse.json({ ok: true });
  try {
    await supabaseAdmin().from('families').select('id', { head: true, count: 'exact' }).limit(1);
  } catch {
    /* warming is best effort */
  }
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}

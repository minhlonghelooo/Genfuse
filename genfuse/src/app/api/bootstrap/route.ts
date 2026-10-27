import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { normCode } from '@/lib/family';
import { userFrom } from '@/lib/auth';
import { loadStorySummary } from '@/lib/stories';
import { IDLE_MEMORY } from '@/lib/memory-game';
import { IDLE_WHEEL } from '@/lib/wheel';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { route } from '@/lib/route';

export const dynamic = 'force-dynamic';

/**
 * Everything the home screen needs, in ONE request (it used to be three, one after the other):
 * the family (with its free-use counter), members, the tree counts, reminders and, on the first call,
 * the current state of both shared games. All reads run at the same time.
 */
export const GET = route(async (req: Request) => {
  const p = new URL(req.url).searchParams;
  const code = normCode(p.get('code'));
  if (!code) return NextResponse.json({ error: 'invalid_code' }, { status: 400 });
  if (!rateLimit(`boot:${clientIp(req)}`, 120, 60_000)) return NextResponse.json({ error: 'slow_down' }, { status: 429 });

  const sb = supabaseAdmin();
  const withGames = p.get('games') === '1';
  const hasToken = !!req.headers.get('authorization');

  const [fam, members, summary, reminders, games, user] = await Promise.all([
    sb.from('families').select('*').eq('family_code', code).maybeSingle(),
    sb.from('members').select('*').eq('family_code', code).order('created_at', { ascending: true }),
    loadStorySummary(sb, code).catch(() => null),
    sb.from('reminders').select('*').eq('family_code', code),
    withGames ? sb.from('family_games').select('game,state,version').eq('family_code', code) : Promise.resolve(null),
    hasToken ? userFrom(req) : Promise.resolve(null),
  ]);

  if (fam.error) return NextResponse.json({ error: 'server', detail: fam.error.message }, { status: 500 });
  if (!fam.data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { owner_id, ...family } = fam.data; // never send the owner's user id to the browser
  const serverNow = Date.now();

  let gameStates: Record<string, { state: unknown; version: number; serverNow: number }> | undefined;
  if (withGames) {
    const byName = new Map((games?.data ?? []).map((g: any) => [g.game, g]));
    const pick = (name: 'memory' | 'wheel', idle: unknown) => {
      const row: any = byName.get(name);
      return { state: row?.state ?? idle, version: row?.version ?? 0, serverNow };
    };
    gameStates = { memory: pick('memory', IDLE_MEMORY), wheel: pick('wheel', IDLE_WHEEL) };
  }

  return NextResponse.json({
    family,
    members: members.data ?? [],
    owned: !!owner_id,
    isOwner: !!owner_id && user?.id === owner_id,
    summary,
    reminders: reminders.error ? [] : reminders.data ?? [],
    ...(gameStates ? { games: gameStates } : {}),
    serverNow,
  });
});

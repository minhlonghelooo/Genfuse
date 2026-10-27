import { NextResponse } from 'next/server';
import { supabaseAdmin } from './supabase/server';
import type { UsagePayload } from './types';

/** What the browser needs to draw the banner. Everything in it is the server's truth, stamped with `rev`. */
export type UsageInfo = UsagePayload;
type Result = { ok: true; usage: UsageInfo } | { ok: false; res: NextResponse };

function toUsage(d: any): UsageInfo {
  return {
    used: Math.max(0, Number(d?.usage_count ?? 0)),
    limit: Number(d?.limit ?? 5),
    premium: !!d?.premium,
    is_premium: !!d?.is_premium,
    plan_type: d?.plan_type ?? 'free',
    premium_expires_at: d?.premium_expires_at ?? null,
    rev: Number.isFinite(Number(d?.rev)) ? Number(d.rev) : 0, // 0 = database not upgraded yet (see /api/health)
  };
}

/** Spend one free operation (PRO families pass straight through). Atomic in Postgres. */
export async function consumeUsage(code: string): Promise<Result> {
  const { data, error } = await supabaseAdmin().rpc('consume_usage', { p_code: code });
  if (error || !data) {
    return { ok: false, res: NextResponse.json({ error: 'server', detail: error?.message ?? 'consume_usage failed. Run supabase/schema.sql' }, { status: 500 }) };
  }
  if (data.reason === 'not_found') return { ok: false, res: NextResponse.json({ error: 'not_found' }, { status: 404 }) };
  const usage = toUsage(data);
  if (!data.allowed) return { ok: false, res: NextResponse.json({ error: 'paywall', usage }, { status: 402 }) };
  return { ok: true, usage };
}

/** Give the use back. Returns the new numbers so the browser can show them. */
export async function refundUsage(code: string): Promise<UsageInfo | null> {
  const { data, error } = await supabaseAdmin().rpc('refund_usage', { p_code: code });
  return error || !data ? null : toUsage(data);
}

/** Refund, then answer with an error that still carries the corrected usage. */
export async function failWith(code: string, body: Record<string, unknown>, status: number) {
  const usage = await refundUsage(code);
  return NextResponse.json(usage ? { ...body, usage } : body, { status });
}

/** JSON response that also carries the new usage, so the banner updates from every action. */
export const withUsage = (body: Record<string, unknown>, usage: UsageInfo, init?: ResponseInit) =>
  NextResponse.json({ ...body, usage }, init);

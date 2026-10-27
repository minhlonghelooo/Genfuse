import type { Family, UsagePayload } from './types';

/**
 * The family's "entitlement" (free uses spent, PRO plan) is changed by the server only, and every change
 * raises `rev` (a database trigger does it). The browser keeps whichever copy has the HIGHER rev, so a slow
 * or old answer that arrives late can never move the counter backwards (this was the 3 -> 5 -> 4 bug).
 * A copy without a rev (an old cache) counts as -1 and is always replaced.
 */
export const revOf = (x?: { rev?: number | null } | null): number => (typeof x?.rev === 'number' ? x.rev : -1);

/** Whole family row from a GET. Replaces the stored one unless the stored one is newer. */
export function mergeFamily(cur: Family | null, incoming: Family): Family {
  if (typeof incoming.rev !== 'number') return incoming; // a database that is not upgraded yet has no rev: nothing to compare
  if (cur && cur.family_code === incoming.family_code && revOf(incoming) < revOf(cur)) return cur;
  return incoming;
}

/** The small "usage" object every action answers with. Returns the same object when nothing changes. */
export function mergeUsage(cur: Family | null, u: UsagePayload): Family | null {
  if (!cur) return cur;
  if (typeof u.rev === 'number' && u.rev < revOf(cur)) return cur;
  return {
    ...cur,
    usage_count: Math.max(0, Math.floor(Number(u.used) || 0)),
    is_premium: typeof u.is_premium === 'boolean' ? u.is_premium : cur.is_premium,
    plan_type: u.plan_type ?? cur.plan_type,
    premium_expires_at: u.premium_expires_at === undefined ? cur.premium_expires_at : u.premium_expires_at,
    rev: typeof u.rev === 'number' ? u.rev : cur.rev,
  };
}

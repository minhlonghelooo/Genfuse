import type { SupabaseClient } from '@supabase/supabase-js';
import type { StorySummary } from './types';

/** Counts per year and per author: one tiny query, so the tree never downloads the stories themselves. */
export async function loadStorySummary(sb: SupabaseClient, code: string): Promise<StorySummary> {
  const { data, error } = await sb.rpc('story_summary', { p_code: code });
  if (!error && data) return data as StorySummary;
  // Fallback while supabase/schema.sql has not been re-run yet (PostgREST caps a response at 1000 rows).
  const { data: rows, error: e2 } = await sb.from('stories').select('year,author_name').eq('family_code', code).range(0, 999);
  if (e2) throw new Error(e2.message);
  const years = new Map<number, number>();
  const authors: Record<string, number> = {};
  (rows ?? []).forEach((r) => {
    years.set(r.year, (years.get(r.year) ?? 0) + 1);
    authors[r.author_name] = (authors[r.author_name] ?? 0) + 1;
  });
  return { years: [...years].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count })), authors };
}

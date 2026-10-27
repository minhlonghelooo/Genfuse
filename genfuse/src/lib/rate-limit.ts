/** Tiny per-instance limiter (best effort on serverless). Stops a runaway loop, not a determined attacker. */
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return false; }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return true;
}

/** Best-effort caller address (Vercel sets x-forwarded-for). Only used to slow down abuse. */
export function clientIp(req: Request): string {
  const f = req.headers.get('x-forwarded-for');
  return (f ? f.split(',')[0].trim() : req.headers.get('x-real-ip')) || 'unknown';
}

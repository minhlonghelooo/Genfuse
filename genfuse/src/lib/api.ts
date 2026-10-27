'use client';
import { useApp } from './store';
import { supabaseBrowser } from './supabase/client';
import type { UsagePayload } from './types';

export class PaywallError extends Error {
  constructor() {
    super('paywall');
  }
}

/** `message` is the short error code from the server; `detail` is a human-readable reason when there is one. */
export class ApiError extends Error {
  constructor(code: string, public detail?: string, public status?: number, public body?: any) {
    super(code);
  }
}

// The owner's login token is kept in a variable, so a request never waits for the auth library after the first one.
let token: string | null = null;
let authReady: Promise<void> | null = null;
function initAuth(): Promise<void> {
  if (authReady) return authReady;
  const sb = supabaseBrowser();
  sb.auth.onAuthStateChange((_e, session) => { token = session?.access_token ?? null; });
  const ready: Promise<void> = sb.auth
    .getSession()
    .then(({ data }) => { token = data.session?.access_token ?? null; })
    .catch(() => {});
  authReady = ready;
  return ready;
}

/** Wakes the server and the database while the person is still choosing a profile (a cold start is the slowest step). */
let warmed = false;
// Each API route can be its own serverless function with its own cold start. An OPTIONS call starts that function
// without running any logic and without spending a free use, so the chat and the games answer fast on the first tap.
const WARM_PATHS = ['/api/ai/chat', '/api/games/memory', '/api/games/wheel', '/api/stories', '/api/reminders'];
export function warmUp() {
  if (warmed || typeof window === 'undefined') return;
  warmed = true;
  void initAuth();
  fetch('/api/warm', { cache: 'no-store', keepalive: true }).catch(() => {});
  setTimeout(() => {
    for (const p of WARM_PATHS) fetch(p, { method: 'OPTIONS', cache: 'no-store' }).catch(() => {});
  }, 1200); // after the first real request, so it never competes with it
}

const isUsage = (u: any): u is UsagePayload => !!u && typeof u === 'object' && typeof u.used === 'number';
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * JSON fetch helper. Adds the owner's login token when signed in. A 402 opens the paywall.
 * Every answer that carries `usage` (even an error answer: a refund) updates the banner through the rev guard.
 * A read (GET) that fails on a cold start or a network blip is retried once.
 */
export async function api<T = any>(url: string, init?: RequestInit): Promise<T> {
  await initAuth();
  const isGet = !init?.method || init.method.toUpperCase() === 'GET';
  const send = () =>
    fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
    });

  let r: Response;
  try {
    r = await send();
    if (isGet && [502, 503, 504].includes(r.status)) { await wait(700); r = await send(); }
  } catch {
    if (!isGet) throw new ApiError('network', 'offline');
    await wait(700);
    try { r = await send(); } catch { throw new ApiError('network', 'offline'); }
  }

  const j = await r.json().catch(() => ({}));
  if (j && typeof j === 'object' && isUsage(j.usage)) useApp.getState().applyUsage(j.usage);
  if (r.status === 402) {
    useApp.getState().setPaywall(true);
    throw new PaywallError();
  }
  if (!r.ok) throw new ApiError(j.error || `http_${r.status}`, j.detail, r.status, j);
  return j as T;
}

export const post = <T = any>(url: string, body: unknown) =>
  api<T>(url, { method: 'POST', body: JSON.stringify(body) });

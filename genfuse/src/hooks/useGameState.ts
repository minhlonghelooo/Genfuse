'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useApp } from '@/lib/store';
import { supabaseBrowser } from '@/lib/supabase/client';

export interface GameReply<T> { state: T; version?: number; serverNow: number; at?: number }

/**
 * Live state of a shared family game. The server broadcasts after every move, so all devices update together.
 * Every state carries the server's `version`; an older answer (a slow poll that lands after a newer move)
 * is dropped, which is what used to flip the board back and cause "not your turn".
 * `now()` is the server's clock, so animations start at the same moment everywhere.
 * The first state is already in the store (loaded together with the family), so the game is ready on the first paint.
 */
export function useGameState<T>(game: 'memory' | 'wheel', initial: T) {
  const code = useApp((s) => s.code);
  const seed = useRef(useApp.getState().games[game] as GameReply<T> | undefined).current;
  const [state, setState] = useState<T>(seed ? seed.state : initial);
  const skew = useRef(seed ? seed.serverNow - (seed.at ?? Date.now()) : 0); // server time minus this device's time
  const version = useRef(typeof seed?.version === 'number' ? seed.version : -1);

  const apply = useCallback((r: GameReply<T>) => {
    if (typeof r.version === 'number') {
      if (r.version < version.current) return; // stale
      version.current = r.version;
    }
    skew.current = r.serverNow - Date.now();
    setState(r.state);
  }, []);

  /** Show a move at once (before the server answers). The server's reply replaces it. */
  const optimistic = useCallback((next: T) => setState(next), []);

  const reload = useCallback(async () => {
    if (!code) return;
    try {
      apply(await api<GameReply<T>>(`/api/games?code=${code}&game=${game}`));
    } catch {
      /* keep the last known state; the next broadcast or poll retries */
    }
  }, [code, game, apply]);

  useEffect(() => {
    void reload();
    const sb = supabaseBrowser();
    const ch = sb.channel(`family:${code}:games`).on('broadcast', { event: game }, () => void reload()).subscribe();
    const poll = setInterval(() => { if (document.visibilityState === 'visible') void reload(); }, 6000); // safety net if a broadcast is missed
    return () => {
      clearInterval(poll);
      sb.removeChannel(ch);
    };
  }, [code, game, reload]);

  const now = useCallback(() => Date.now() + skew.current, []);
  return { state, apply, optimistic, now, reload };
}

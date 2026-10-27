'use client';
import { useCallback, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { makeLatest } from '@/lib/latest';
import { useApp } from '@/lib/store';
import { supabaseBrowser } from '@/lib/supabase/client';
import type { Family, Member, Reminder, StorySummary } from '@/lib/types';

interface Bootstrap {
  family: Family;
  members: Member[];
  owned: boolean;
  isOwner: boolean;
  summary: StorySummary | null;
  reminders: Reminder[];
  games?: Record<'memory' | 'wheel', { state: unknown; version: number; serverNow: number }>;
}

/**
 * Loads the household with ONE request and keeps it live: the server broadcasts on `family:<code>` after every
 * story save, member change and payment. A slow poll (only while the page is visible) is the safety net, and
 * coming back to the tab refreshes at once. Only the newest answer is used (an older one that lands late is dropped);
 * the family's free-use counter is additionally protected by its `rev` (see lib/entitlement.ts).
 */
export function useFamilySync(code: string) {
  const latest = useRef(makeLatest()).current;
  const gamesLoaded = useRef(false);
  const { applyFamily, setMembers, setStorySummary, setReminders, setAccess, setGames, logout } = useApp();

  const refresh = useCallback(async () => {
    const mine = latest.start();
    const wantGames = !gamesLoaded.current;
    try {
      const b = await api<Bootstrap>(`/api/bootstrap?code=${code}${wantGames ? '&games=1' : ''}`);
      if (!latest.accept(mine)) return;
      applyFamily(b.family);
      setAccess({ owned: b.owned, isOwner: b.isOwner });
      setMembers(b.members);
      if (b.summary) setStorySummary(b.summary);
      setReminders(b.reminders);
      if (b.games) {
        const at = Date.now();
        setGames({ memory: { ...b.games.memory, at }, wheel: { ...b.games.wheel, at } });
        gamesLoaded.current = true;
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'not_found') logout();
    }
  }, [code, latest, applyFamily, setMembers, setStorySummary, setReminders, setAccess, setGames, logout]);

  useEffect(() => {
    gamesLoaded.current = false;
    void refresh();
    const sb = supabaseBrowser();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const soon = () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 150); }; // several broadcasts in a row = one refresh
    const channel = sb.channel(`family:${code}`).on('broadcast', { event: '*' }, soon).subscribe();
    const visible = () => document.visibilityState === 'visible';
    const poll = setInterval(() => { if (visible()) void refresh(); }, 30000);
    const onShow = () => { if (visible()) void refresh(); };
    document.addEventListener('visibilitychange', onShow);
    window.addEventListener('online', onShow);
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onShow);
      window.removeEventListener('online', onShow);
      sb.removeChannel(channel);
    };
  }, [code, refresh]);

  return refresh;
}

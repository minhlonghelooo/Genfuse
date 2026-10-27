'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Family, Locale, Member, Reminder, StorySummary, ThemeChoice, UsagePayload, YouthFont } from './types';
import { EMPTY_SUMMARY, FREE_LIMIT } from './types';
import { mergeFamily, mergeUsage } from './entitlement';

const ymdNow = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export interface LocalTheme { theme?: ThemeChoice; font?: YouthFont }
export interface GameSeed { state: unknown; version?: number; serverNow: number; at?: number } // `at` = this device's clock when it arrived

const KEY = 'genfuse';
const LEGACY_KEY = 'gia-dinh-so'; // the app's old name: families already on a device must keep working

/** localStorage that never throws (private mode) and adopts the data saved under the old app name. */
const storage = createJSONStorage<any>(() => ({
  getItem: (name: string) => {
    try { return localStorage.getItem(name) ?? localStorage.getItem(LEGACY_KEY); } catch { return null; }
  },
  setItem: (name: string, value: string) => {
    try { localStorage.setItem(name, value); localStorage.removeItem(LEGACY_KEY); } catch { /* ignore */ }
  },
  removeItem: (name: string) => {
    try { localStorage.removeItem(name); } catch { /* ignore */ }
  },
}));

interface AppState {
  code: string | null;
  memberId: string | null;
  locale: Locale;
  family: Family | null;
  limit: number;
  members: Member[];
  storySummary: StorySummary;
  storiesRev: number; // goes up whenever stories change, so an open drawer reloads
  acks: Record<string, true>; // reminders marked done today: `${id}|${date}`
  reminders: Reminder[];
  access: { owned: boolean; isOwner: boolean };
  localThemes: Record<string, LocalTheme>; // saved on this device so a look never snaps back
  games: Partial<Record<'memory' | 'wheel', GameSeed>>; // first state of each shared game, loaded together with the family
  paywall: boolean;
  setCode: (c: string | null) => void;
  setMemberId: (id: string | null) => void;
  setLocale: (l: Locale) => void;
  applyFamily: (f: Family) => void;
  setMembers: (m: Member[]) => void;
  setStorySummary: (s: StorySummary) => void;
  addStoryLocal: (year: number, author: string) => void;
  ackReminder: (id: string | number) => void;
  applyUsage: (u: UsagePayload) => void;
  setReminders: (r: Reminder[]) => void;
  setAccess: (a: { owned: boolean; isOwner: boolean }) => void;
  setGames: (g: AppState['games']) => void;
  setLocalTheme: (memberId: string, t: LocalTheme) => void;
  setPaywall: (open: boolean) => void;
  logout: () => void;
}

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      code: null,
      memberId: null,
      locale: 'vi',
      family: null,
      limit: FREE_LIMIT,
      members: [],
      storySummary: EMPTY_SUMMARY,
      storiesRev: 0,
      acks: {},
      reminders: [],
      access: { owned: false, isOwner: false },
      localThemes: {},
      games: {},
      paywall: false,
      setCode: (code) => set({ code }),
      setMemberId: (memberId) => set({ memberId }),
      setLocale: (locale) => set({ locale }),
      // Both setters below keep the newest copy (higher `rev`): see lib/entitlement.ts.
      applyFamily: (f) => set((s) => { const next = mergeFamily(s.family, f); return next === s.family ? {} : { family: next }; }),
      applyUsage: (u) =>
        set((s) => {
          const next = mergeUsage(s.family, u);
          const limit = Number.isFinite(u.limit) && u.limit > 0 ? u.limit : s.limit;
          return next === s.family && limit === s.limit ? {} : { family: next, limit };
        }),
      setMembers: (members) => set({ members }),
      setStorySummary: (storySummary) =>
        set((s) => (JSON.stringify(s.storySummary) === JSON.stringify(storySummary) ? {} : { storySummary, storiesRev: s.storiesRev + 1 })),
      addStoryLocal: (year, author) =>
        set((s) => {
          const years = s.storySummary.years.some((y) => y.year === year)
            ? s.storySummary.years.map((y) => (y.year === year ? { ...y, count: y.count + 1 } : y))
            : [...s.storySummary.years, { year, count: 1 }].sort((a, b) => a.year - b.year);
          return { storySummary: { years, authors: { ...s.storySummary.authors, [author]: (s.storySummary.authors[author] ?? 0) + 1 } }, storiesRev: s.storiesRev + 1 };
        }),
      ackReminder: (id) =>
        set((s) => {
          const today = ymdNow();
          const keep = Object.fromEntries(Object.entries(s.acks).filter(([k]) => k.endsWith(`|${today}`)));
          return { acks: { ...keep, [`${id}|${today}`]: true } };
        }),
      setReminders: (reminders) => set({ reminders }),
      setAccess: (access) => set({ access }),
      setGames: (games) => set({ games }),
      setLocalTheme: (id, t) => set((s) => ({ localThemes: { ...s.localThemes, [id]: t } })),
      setPaywall: (paywall) => set({ paywall }),
      logout: () => set({ code: null, memberId: null, family: null, members: [], storySummary: EMPTY_SUMMARY, reminders: [], access: { owned: false, isOwner: false }, games: {}, paywall: false }),
    }),
    {
      name: KEY,
      version: 1,
      storage,
      // The old save (no version) has the same shape minus the new cached fields, so it is kept as it is.
      migrate: (persisted: unknown) => persisted as any,
      // The family, members, tree counts and reminders are cached too: the next visit paints everything at once
      // and refreshes in the background. `rev` is NOT cached, so a database that was reset or upgraded is never ignored.
      partialize: (s) => ({
        code: s.code,
        memberId: s.memberId,
        locale: s.locale,
        localThemes: s.localThemes,
        acks: s.acks,
        family: s.family ? { ...s.family, rev: undefined } : null,
        members: s.members,
        storySummary: s.storySummary,
        reminders: s.reminders,
      }),
    },
  ),
);

export const useMe = () => useApp((s) => s.members.find((m) => m.id === s.memberId));

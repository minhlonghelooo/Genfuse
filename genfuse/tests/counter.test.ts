import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeFamily, mergeUsage, revOf } from '../src/lib/entitlement';
import { makeLatest } from '../src/lib/latest';
import type { Family, UsagePayload } from '../src/lib/types';

const fam = (used: number, rev?: number, extra: Partial<Family> = {}): Family => ({
  id: '1', family_code: 'ABC234', usage_count: used, is_premium: false, plan_type: 'free', premium_expires_at: null, rev, ...extra,
});
const use = (used: number, rev: number, extra: Partial<UsagePayload> = {}): UsagePayload => ({
  used, limit: 5, premium: false, is_premium: false, plan_type: 'free', premium_expires_at: null, rev, ...extra,
});

test('the old bug: a late, older answer can never move the counter back (3 -> 5 -> 4)', () => {
  let f: Family | null = fam(0, 1);
  f = mergeUsage(f, use(1, 2));
  f = mergeUsage(f, use(2, 3));
  f = mergeUsage(f, use(3, 4)); // user spent three
  assert.equal(f!.usage_count, 3);
  f = mergeFamily(f, fam(0, 1)); // an old refresh (started before the first use) lands late
  assert.equal(f!.usage_count, 3);
  f = mergeUsage(f, use(2, 3)); // an old action answer lands late
  assert.equal(f!.usage_count, 3);
  f = mergeUsage(f, use(4, 5));
  assert.equal(f!.usage_count, 4);
  f = mergeUsage(f, use(5, 6));
  assert.equal(f!.usage_count, 5);
});

test('answers in any order end at the same number', () => {
  const answers = [use(1, 2), use(2, 3), use(3, 4), use(4, 5), use(5, 6)];
  for (let t = 0; t < 200; t++) {
    const shuffled = [...answers].sort(() => Math.random() - 0.5);
    let f: Family | null = fam(0, 1);
    for (const a of shuffled) f = mergeUsage(f, a);
    assert.equal(f!.usage_count, 5);
  }
});

test('a refund (higher rev, lower number) is accepted', () => {
  let f: Family | null = fam(2, 3);
  f = mergeUsage(f, use(3, 4)); // spend
  f = mergeUsage(f, use(2, 5)); // the AI failed: refunded
  assert.equal(f!.usage_count, 2);
});

test('a cached family without rev is always replaced by a fresh one', () => {
  assert.equal(revOf(fam(3)), -1);
  assert.equal(mergeFamily(fam(3), fam(4, 7)).usage_count, 4);
});

test('payment (PRO) arrives with a higher rev and is not undone by an old refresh', () => {
  let f: Family | null = fam(5, 10);
  f = mergeFamily(f, fam(5, 11, { is_premium: true, plan_type: 'monthly', premium_expires_at: '2099-01-01T00:00:00Z' }));
  assert.equal(f!.is_premium, true);
  f = mergeFamily(f, fam(5, 10)); // older copy
  assert.equal(f!.is_premium, true);
});

test('a database without rev (not upgraded yet) never blocks a fresh family copy', () => {
  let f: Family | null = fam(1, 0); // an action answer carried rev 0
  f = mergeFamily(f, fam(2)); // the family GET has no rev at all
  assert.equal(f!.usage_count, 2);
});

test('usage for a family that is not loaded yet changes nothing', () => {
  assert.equal(mergeUsage(null, use(1, 1)), null);
});

test('only the newest request may update the screen', () => {
  const l = makeLatest();
  const a = l.start();
  const b = l.start();
  assert.equal(l.accept(b), true);
  assert.equal(l.accept(a), false); // older answer arrives last: dropped
  const c = l.start();
  assert.equal(l.accept(c), true);
});

-- Genfuse database. Run this whole file in Supabase > SQL Editor.
-- It is safe to run again at any time: new projects get everything, existing projects are upgraded
-- (missing columns, the exact usage counter, the story summary, the payment function).

create extension if not exists pgcrypto;

-- ============================ TABLES ============================
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  family_code text unique not null check (family_code ~ '^[A-Z0-9]{6}$'),
  usage_count int not null default 0,
  is_premium boolean not null default false,
  plan_type text not null default 'free' check (plan_type in ('free','monthly','yearly')),
  premium_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  family_code text not null references public.families(family_code) on delete cascade,
  name text not null,
  role text not null check (role in ('grandparent','parent','teen','child')),
  avatar text,
  custom_theme jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists members_family_idx on public.members(family_code);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  family_code text not null references public.families(family_code) on delete cascade,
  year integer not null,
  title text not null,
  content text not null default '',
  author_name text not null,
  photo_url text,
  audio_url text,
  created_at timestamptz not null default now()
);
create index if not exists stories_family_year_idx on public.stories(family_code, year);
create index if not exists stories_family_year_created_idx on public.stories(family_code, year, created_at desc);

create table if not exists public.genz_dictionary (
  id uuid primary key default gen_random_uuid(),
  word text unique not null,
  definition text not null,
  solution_for_parents text not null,
  context_example text not null
);

create table if not exists public.payments (
  order_code bigint primary key,
  family_code text not null references public.families(family_code) on delete cascade,
  plan text not null check (plan in ('monthly','yearly')),
  amount integer not null,
  status text not null default 'pending' check (status in ('pending','paid')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists payments_family_idx on public.payments(family_code);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  family_code text not null references public.families(family_code) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,   -- null = the whole family
  text text not null,
  remind_time text not null check (remind_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  repeat text not null default 'daily' check (repeat in ('daily','weekdays','once')),
  once_date date,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists reminders_family_idx on public.reminders(family_code);

create table if not exists public.family_games (
  family_code text not null references public.families(family_code) on delete cascade,
  game text not null check (game in ('memory','wheel')),
  state jsonb not null default '{}'::jsonb,
  version integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (family_code, game)
);

-- ===================== UPGRADE OLDER PROJECTS =====================
alter table public.families add column if not exists family_code text;
alter table public.families add column if not exists usage_count int not null default 0;
alter table public.families add column if not exists is_premium boolean not null default false;
alter table public.families add column if not exists plan_type text not null default 'free';
alter table public.families add column if not exists premium_expires_at timestamptz;
alter table public.families add column if not exists created_at timestamptz not null default now();
alter table public.families add column if not exists owner_id uuid references auth.users(id) on delete set null;
create unique index if not exists families_family_code_uidx on public.families(family_code);
alter table public.members add column if not exists avatar text;
alter table public.members add column if not exists custom_theme jsonb not null default '{}'::jsonb;
alter table public.stories add column if not exists photo_url text;
alter table public.stories add column if not exists audio_url text;

-- Very old databases made usage_count nullable: NULL + 1 stays NULL and the counter never moved. Repair it, then lock it.
update public.families set usage_count = 0 where usage_count is null;
alter table public.families alter column usage_count set default 0;
alter table public.families alter column usage_count set not null;

-- ================= EXACT USAGE COUNTER (rev) =================
-- `rev` goes up by one on EVERY change of a family row (a trigger does it, nothing can forget).
-- The app keeps whichever copy of the family has the higher rev, so a slow or old answer can never
-- push the "uses left" number backwards.
alter table public.families add column if not exists rev bigint not null default 0;

create or replace function public.families_bump_rev()
returns trigger language plpgsql as $$
begin
  new.rev := coalesce(old.rev, 0) + 1;
  return new;
end $$;

drop trigger if exists families_bump_rev on public.families;
create trigger families_bump_rev before update on public.families
  for each row execute function public.families_bump_rev();

-- One JSON shape for every answer about a family's plan and free uses. The free limit (5) lives only here.
create or replace function public.family_entitlement(f public.families)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'usage_count', coalesce(f.usage_count, 0),
    'limit', 5,
    'is_premium', f.is_premium,
    'plan_type', f.plan_type,
    'premium_expires_at', f.premium_expires_at,
    'premium', (f.is_premium and (f.premium_expires_at is null or f.premium_expires_at > now())),
    'rev', f.rev
  );
$$;

-- Atomic: the row is locked, so two devices spending at the same moment can never both get "the last one".
create or replace function public.consume_usage(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare f public.families%rowtype;
begin
  select * into f from public.families where family_code = p_code for update;
  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'not_found');
  end if;
  if f.is_premium and (f.premium_expires_at is null or f.premium_expires_at > now()) then
    return public.family_entitlement(f) || jsonb_build_object('allowed', true, 'reason', 'premium');
  end if;
  if coalesce(f.usage_count, 0) >= 5 then
    return public.family_entitlement(f) || jsonb_build_object('allowed', false, 'reason', 'paywall');
  end if;
  update public.families set usage_count = coalesce(usage_count, 0) + 1 where id = f.id returning * into f;
  return public.family_entitlement(f) || jsonb_build_object('allowed', true, 'reason', 'free');
end $$;

-- Give the free use back when an operation fails after it was counted. (Older versions returned nothing.)
drop function if exists public.refund_usage(text);
create or replace function public.refund_usage(p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare f public.families%rowtype;
begin
  select * into f from public.families where family_code = p_code for update;
  if not found then return null; end if;
  if not (f.is_premium and (f.premium_expires_at is null or f.premium_expires_at > now())) and coalesce(f.usage_count, 0) > 0 then
    update public.families set usage_count = usage_count - 1 where id = f.id returning * into f;
  end if;
  return public.family_entitlement(f);
end $$;

-- ===================== STORY SUMMARY (fast tree) =====================
create or replace function public.story_summary(p_code text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'years', coalesce((select jsonb_agg(jsonb_build_object('year', y.year, 'count', y.c) order by y.year)
                       from (select year, count(*)::int c from public.stories where family_code = p_code group by year) y), '[]'::jsonb),
    'authors', coalesce((select jsonb_object_agg(a.author_name, a.c)
                         from (select author_name, count(*)::int c from public.stories where family_code = p_code group by author_name) a), '{}'::jsonb)
  );
$$;

-- ================= PAYMENT: one atomic "paid -> PRO" step =================
create or replace function public.activate_payment(p_order_code bigint, p_paid_amount integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare pay public.payments%rowtype; fam public.families%rowtype; v_days int; v_base timestamptz; v_expires timestamptz;
begin
  select * into pay from public.payments where order_code = p_order_code for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if pay.status = 'paid' then
    return jsonb_build_object('ok', true, 'already', true, 'family_code', pay.family_code);
  end if;
  if p_paid_amount < pay.amount then
    return jsonb_build_object('ok', false, 'reason', 'amount_mismatch', 'family_code', pay.family_code);
  end if;
  select * into fam from public.families where family_code = pay.family_code for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'family_missing'); end if;
  v_days := case pay.plan when 'yearly' then 365 else 30 end;
  v_base := case when fam.premium_expires_at is not null and fam.premium_expires_at > now() then fam.premium_expires_at else now() end;
  v_expires := v_base + make_interval(days => v_days);
  update public.payments set status = 'paid', paid_at = now() where order_code = p_order_code;
  update public.families set is_premium = true, plan_type = pay.plan, premium_expires_at = v_expires where id = fam.id;
  return jsonb_build_object('ok', true, 'family_code', pay.family_code, 'plan', pay.plan, 'expires_at', v_expires);
end $$;

-- ===================== SECURITY =====================
-- Family data is only reachable through the Next.js API routes (service role), which check the family code.
-- The browser (anon key) can read the dictionary and listen to broadcast channels, nothing else.
alter table public.families enable row level security;
alter table public.members enable row level security;
alter table public.stories enable row level security;
alter table public.payments enable row level security;
alter table public.reminders enable row level security;
alter table public.family_games enable row level security;
alter table public.genz_dictionary enable row level security;

drop policy if exists "dictionary is public" on public.genz_dictionary;
create policy "dictionary is public" on public.genz_dictionary for select using (true);

grant all on public.reminders to service_role;
grant all on public.family_games to service_role;

revoke execute on function public.consume_usage(text) from public, anon, authenticated;
revoke execute on function public.refund_usage(text) from public, anon, authenticated;
revoke execute on function public.story_summary(text) from public, anon, authenticated;
revoke execute on function public.activate_payment(bigint, integer) from public, anon, authenticated;
-- Revoking from PUBLIC can also remove the server's access, so grant it back explicitly.
grant execute on function public.consume_usage(text) to service_role;
grant execute on function public.refund_usage(text) to service_role;
grant execute on function public.story_summary(text) to service_role;
grant execute on function public.activate_payment(bigint, integer) to service_role;

-- ===================== STORAGE (photos and voice notes) =====================
insert into storage.buckets (id, name, public) values ('family-media', 'family-media', true)
on conflict (id) do nothing;

-- Make the new tables and functions visible to the API immediately.
notify pgrst, 'reload schema';

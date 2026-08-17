-- Accounts, subscriptions, and server-enforced daily usage limits.
--
-- Design intent: trial_started_at and subscription status must never be
-- client-writable, since they gate a paid OpenAI-backed endpoint — a
-- malicious client could otherwise just set itself to "active" via a
-- normal authenticated update. So all three new tables below expose
-- SELECT-only policies to the `authenticated` role; every write happens
-- either through a SECURITY DEFINER trigger (account creation) or the
-- service-role key from a trusted Edge Function (subscription sync,
-- usage increments) — never from the client's own session.

-- ---------- accounts ----------
-- Identity + trial tracking, deliberately separate from `profiles`
-- (physical stats — sex/height/weight/goals — which stay in local
-- device storage and are unrelated to billing). Created automatically
-- the instant someone signs up, so trial_started_at is always set
-- server-side at the true moment of account creation.
create table if not exists public.accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  trial_started_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

create policy "Users can view their own account"
  on public.accounts for select
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.accounts (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- subscriptions ----------
-- Mirrors RevenueCat entitlement state. Populated by the
-- revenuecat-webhook Edge Function (service role key) once RevenueCat
-- is configured — see AUTH_BILLING_SETUP.md. Absence of a row, or
-- status other than 'active', means "not currently a paying subscriber."
create table if not exists public.subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'none' check (status in ('none', 'active', 'canceled', 'expired')),
  plan text check (plan in ('weekly', 'monthly', 'yearly')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ---------- usage_log ----------
-- One row per user per UTC day, incremented by analyze-meal on every
-- accepted request. This is the actual rate-limit enforcement point.
create table if not exists public.usage_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  count int not null default 0,
  primary key (user_id, usage_date)
);

alter table public.usage_log enable row level security;

create policy "Users can view their own usage"
  on public.usage_log for select
  using (auth.uid() = user_id);

-- Atomically increments today's count only while it's still under
-- p_cap, returning the new count on success or no row if the cap was
-- already reached. A single statement so two near-simultaneous
-- requests can't both slip through under the cap.
create or replace function public.increment_usage_if_under_cap(p_user_id uuid, p_cap int)
returns int
language sql
security invoker
set search_path = public
as $$
  insert into public.usage_log (user_id, usage_date, count)
  values (p_user_id, (now() at time zone 'utc')::date, 1)
  on conflict (user_id, usage_date) do update
    set count = usage_log.count + 1
    where usage_log.count < p_cap
  returning count;
$$;

revoke execute on function public.increment_usage_if_under_cap(uuid, int) from anon, authenticated;

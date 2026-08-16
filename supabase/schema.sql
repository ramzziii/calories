-- Plateful Supabase schema
-- Historical reference only — supabase/migrations/*.sql (applied via
-- `supabase db push`) is the actual source of truth as of the
-- accounts/subscriptions/usage_log tables below. Assumes auth.users is
-- managed by Supabase Auth.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  sex text not null check (sex in ('male', 'female')),
  age int not null check (age > 0 and age < 120),
  height_cm numeric not null check (height_cm > 0),
  weight_kg numeric not null check (weight_kg > 0),
  goal text not null check (goal in ('lose', 'maintain', 'gain')),
  activity_level text not null check (
    activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')
  ),
  daily_calorie_target int,
  daily_protein_g numeric,
  daily_carbs_g numeric,
  daily_fat_g numeric,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ---------- logged_meals ----------
create table if not exists public.logged_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  photo_url text,
  total_calories numeric not null default 0,
  total_protein_g numeric not null default 0,
  total_carbs_g numeric not null default 0,
  total_fat_g numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.logged_meals enable row level security;

create policy "Users manage their own logged meals"
  on public.logged_meals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists logged_meals_user_date_idx
  on public.logged_meals (user_id, logged_at desc);

-- ---------- custom_meals ----------
create table if not exists public.custom_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  times_used int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.custom_meals enable row level security;

create policy "Users manage their own custom meals"
  on public.custom_meals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- food_items ----------
-- Individual items within a logged meal or a custom meal — this table is
-- what makes ingredient-level editing possible (each item is its own row).
create table if not exists public.food_items (
  id uuid primary key default gen_random_uuid(),
  logged_meal_id uuid references public.logged_meals(id) on delete cascade,
  custom_meal_id uuid references public.custom_meals(id) on delete cascade,
  name text not null,
  quantity numeric not null,
  unit text not null,
  calories numeric not null default 0,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  source text not null check (source in ('ai_vision', 'barcode', 'manual', 'custom_meal')),
  barcode_upc text,
  user_corrected boolean not null default false,
  created_at timestamptz not null default now(),
  constraint food_item_belongs_to_one_parent check (
    (logged_meal_id is not null and custom_meal_id is null) or
    (logged_meal_id is null and custom_meal_id is not null)
  )
);

alter table public.food_items enable row level security;

-- Access is scoped through the parent meal's owner.
create policy "Users manage food items on their own logged meals"
  on public.food_items for all
  using (
    logged_meal_id in (select id from public.logged_meals where user_id = auth.uid())
    or custom_meal_id in (select id from public.custom_meals where user_id = auth.uid())
  )
  with check (
    logged_meal_id in (select id from public.logged_meals where user_id = auth.uid())
    or custom_meal_id in (select id from public.custom_meals where user_id = auth.uid())
  );

-- ---------- weight_entries ----------
create table if not exists public.weight_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  weight_kg numeric not null check (weight_kg > 0),
  created_at timestamptz not null default now()
);

alter table public.weight_entries enable row level security;

create policy "Users manage their own weight entries"
  on public.weight_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists weight_entries_user_date_idx
  on public.weight_entries (user_id, logged_at desc);

-- ---------- functions ----------
-- Atomic increment avoids a read-then-write race if a user somehow
-- triggers two "log this custom meal" taps in quick succession.
create or replace function public.increment_custom_meal_usage(meal_id uuid)
returns void
language sql
security invoker
as $$
  update public.custom_meals
  set times_used = times_used + 1
  where id = meal_id;
$$;

-- ---------- storage ----------
-- Create a "meal-photos" bucket in Supabase Storage (Dashboard > Storage)
-- and add a policy allowing authenticated users to upload/read only their
-- own folder, e.g. path prefix `${auth.uid()}/...`.

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

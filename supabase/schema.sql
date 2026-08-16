-- Plateful Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Assumes auth.users is managed by Supabase Auth.

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

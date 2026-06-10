create extension if not exists "pgcrypto";

create type public.cluster_provider as enum (
  'kubernetes',
  'eks',
  'gke',
  'aks',
  'local'
);

create type public.cluster_environment as enum (
  'development',
  'staging',
  'production'
);

create type public.cluster_status as enum (
  'draft',
  'onboarding',
  'ready',
  'degraded',
  'offline',
  'archived'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  avatar_url text check (char_length(avatar_url) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.saved_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text check (char_length(description) <= 500),
  configuration jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clusters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  provider public.cluster_provider not null,
  environment public.cluster_environment not null,
  status public.cluster_status not null default 'draft',
  connection_metadata jsonb not null default '{}'::jsonb,
  onboarding_step integer not null default 1 check (onboarding_step between 1 and 4),
  last_status_change_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_scenarios_user_updated_idx
  on public.saved_scenarios(user_id, updated_at desc);
create index clusters_user_status_idx
  on public.clusters(user_id, status);
create index clusters_user_updated_idx
  on public.clusters(user_id, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger saved_scenarios_set_updated_at
before update on public.saved_scenarios
for each row execute function public.set_updated_at();

create trigger clusters_set_updated_at
before update on public.clusters
for each row execute function public.set_updated_at();

create or replace function public.set_cluster_status_changed_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    new.last_status_change_at = now();
  end if;
  return new;
end;
$$;

create trigger clusters_set_status_changed_at
before update on public.clusters
for each row execute function public.set_cluster_status_changed_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.saved_scenarios enable row level security;
alter table public.clusters enable row level security;

create policy "profiles_select_own"
on public.profiles for select
using ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "saved_scenarios_select_own"
on public.saved_scenarios for select
using ((select auth.uid()) = user_id);

create policy "saved_scenarios_insert_own"
on public.saved_scenarios for insert
with check ((select auth.uid()) = user_id);

create policy "saved_scenarios_update_own"
on public.saved_scenarios for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "saved_scenarios_delete_own"
on public.saved_scenarios for delete
using ((select auth.uid()) = user_id);

create policy "clusters_select_own"
on public.clusters for select
using ((select auth.uid()) = user_id);

create policy "clusters_insert_own"
on public.clusters for insert
with check ((select auth.uid()) = user_id);

create policy "clusters_update_own"
on public.clusters for update
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "clusters_delete_own"
on public.clusters for delete
using ((select auth.uid()) = user_id);

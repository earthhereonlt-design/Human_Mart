-- ============================================================
-- HUMAN MART — Supabase schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- PROFILES — login info for every registered user
-- (row auto-created by trigger when someone signs up)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email        text,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- PEOPLE — the humans being listed (each gets a unique URL)
-- ------------------------------------------------------------
create table if not exists public.people (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  bio        text,
  photo_url  text,
  created_by uuid references public.profiles(id) on delete set null,
  claimed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- LISTINGS — one specific offering by a person
-- a person can have many listings
-- ------------------------------------------------------------
create table if not exists public.listings (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references public.people(id) on delete cascade,
  title        text not null,
  description  text,
  price        integer not null check (price >= 0),   -- INR
  unit         text not null default 'hour',           -- hour | cup | session | task | …
  category     text not null default 'Other',
  tags         text[] not null default '{}',
  availability text,
  is_active    boolean not null default true,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists listings_person_idx    on public.listings(person_id);
create index if not exists listings_category_idx  on public.listings(category);
create index if not exists listings_active_idx    on public.listings(is_active);
create index if not exists listings_title_trgm    on public.listings using gin (title gin_trgm_ops);
create index if not exists listings_desc_trgm     on public.listings using gin (description gin_trgm_ops);
create index if not exists people_name_trgm       on public.people using gin (name gin_trgm_ops);

-- ------------------------------------------------------------
-- REVIEWS
-- ------------------------------------------------------------
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  unique (listing_id, author_id)
);

create index if not exists reviews_listing_idx on public.reviews(listing_id);

-- ------------------------------------------------------------
-- ORDERS — simulated purchases (no real money)
-- ------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  buyer_id       uuid not null references public.profiles(id) on delete cascade,
  address        jsonb not null,
  items          jsonb not null,   -- snapshot of cart lines at purchase time
  totals         jsonb not null,   -- subtotal / discounts / fees / total
  payment_method text not null,
  status         text not null default 'completed',
  created_at     timestamptz not null default now()
);

create index if not exists orders_buyer_idx on public.orders(buyer_id);

-- ------------------------------------------------------------
-- REPORTS — moderation hooks (claim / report / takedown)
-- ------------------------------------------------------------
create table if not exists public.reports (
  id         uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  person_id  uuid references public.people(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason     text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Auto-create a profile row whenever a user signs up
-- (this is the "login info saved in a table")
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- MARKET VIEW — listings joined with person + rating stats
-- the marketplace reads from this view
-- ------------------------------------------------------------
create or replace view public.market_listings as
select
  l.id,
  l.person_id,
  l.title,
  l.description,
  l.price,
  l.unit,
  l.category,
  l.tags,
  l.availability,
  l.is_active,
  l.created_at,
  p.name     as person_name,
  p.slug     as person_slug,
  p.photo_url as person_photo_url,
  p.claimed_by is not null as person_claimed,
  coalesce(r.avg_rating, 0) as avg_rating,
  coalesce(r.review_count, 0) as review_count
from public.listings l
join public.people p on p.id = l.person_id
left join (
  select listing_id, avg(rating) as avg_rating, count(*) as review_count
  from public.reviews group by listing_id
) r on r.listing_id = l.id;

-- ------------------------------------------------------------
-- SMART SEARCH — synonym-friendly keyword + fuzzy trigram search
-- called with an array of expanded terms (client expands synonyms)
-- ------------------------------------------------------------
create or replace function public.search_listings(terms text[])
returns setof public.market_listings
language sql
stable
as $$
  select ml.*
  from public.market_listings ml
  where ml.is_active
    and exists (
      select 1
      from unnest(terms) t
      where ml.title ilike '%' || t || '%'
         or ml.description ilike '%' || t || '%'
         or ml.person_name ilike '%' || t || '%'
         or ml.category ilike '%' || t || '%'
         or exists (select 1 from unnest(ml.tags) tag where tag ilike '%' || t || '%')
         or similarity(coalesce(ml.title, '') || ' ' || coalesce(ml.description, ''), t) > 0.3
    )
  order by ml.created_at desc;
$$;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- (every policy is dropped-then-recreated so this file can be
--  re-run safely, no matter how far a previous attempt got)
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.people   enable row level security;
alter table public.listings enable row level security;
alter table public.reviews  enable row level security;
alter table public.orders   enable row level security;
alter table public.reports  enable row level security;

-- profiles: readable by all (names show on reviews), editable by owner
drop policy if exists "profiles readable" on public.profiles;
drop policy if exists "profiles self-update" on public.profiles;
create policy "profiles readable" on public.profiles for select using (true);
create policy "profiles self-update" on public.profiles for update using (auth.uid() = id);

-- people: readable by all; created by any logged-in user; editable by creator/claimer
drop policy if exists "people readable" on public.people;
drop policy if exists "people insert" on public.people;
drop policy if exists "people update" on public.people;
create policy "people readable" on public.people for select using (true);
create policy "people insert" on public.people for insert to authenticated with check (auth.uid() = created_by);
create policy "people update" on public.people for update
  using (auth.uid() = created_by or auth.uid() = claimed_by);

-- whoever shelved a human can take them off the shelf (their listings cascade)
drop policy if exists "people owner delete" on public.people;
create policy "people owner delete" on public.people
  for delete using (auth.uid() = created_by);

-- listings: active ones readable by all; CRUD by owner
drop policy if exists "listings readable" on public.listings;
drop policy if exists "listings insert" on public.listings;
drop policy if exists "listings update" on public.listings;
drop policy if exists "listings delete" on public.listings;
create policy "listings readable" on public.listings for select using (true);
create policy "listings insert" on public.listings for insert to authenticated with check (auth.uid() = created_by);
create policy "listings update" on public.listings for update using (auth.uid() = created_by);
create policy "listings delete" on public.listings for delete using (auth.uid() = created_by);

-- reviews: readable by all; insert/delete your own
drop policy if exists "reviews readable" on public.reviews;
drop policy if exists "reviews insert" on public.reviews;
drop policy if exists "reviews delete" on public.reviews;
create policy "reviews readable" on public.reviews for select using (true);
create policy "reviews insert" on public.reviews for insert to authenticated with check (auth.uid() = author_id);
create policy "reviews delete" on public.reviews for delete using (auth.uid() = author_id);

-- orders: strictly private to the buyer
drop policy if exists "orders own" on public.orders;
drop policy if exists "orders insert" on public.orders;
create policy "orders own" on public.orders for select using (auth.uid() = buyer_id);
create policy "orders insert" on public.orders for insert to authenticated with check (auth.uid() = buyer_id);

-- reports: anyone logged in can file; nobody reads them via the API
drop policy if exists "reports insert" on public.reports;
create policy "reports insert" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);

-- ------------------------------------------------------------
-- STORAGE — public bucket for person/listing photos
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos public read" on storage.objects;
drop policy if exists "photos authenticated upload" on storage.objects;
drop policy if exists "photos owner delete" on storage.objects;
create policy "photos public read" on storage.objects
  for select using (bucket_id = 'photos');
create policy "photos authenticated upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos');
create policy "photos owner delete" on storage.objects
  for delete to authenticated using (bucket_id = 'photos' and owner = auth.uid());

-- ============================================================
-- ADMIN + ACCOUNT DELETION + SITE SETTINGS
-- (append-only section — safe to re-run)
-- ============================================================

-- admins
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- bootstrap the first admin (the repo owner's account) if none exists yet
update public.profiles
set is_admin = true
where email = 'earthhereonlt@gmail.com'
  and not exists (select 1 from public.profiles where is_admin);

-- only admins may flip the flag — blocks self-promotion through normal updates
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin
     and not coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false) then
    raise exception 'The admin stamp is granted, never taken';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute procedure public.guard_profile_update();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

-- ------------------------------------------------------------
-- SITE SETTINGS — powers maintenance mode; public read, admin write
-- ------------------------------------------------------------
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "settings readable" on public.site_settings;
drop policy if exists "settings admin insert" on public.site_settings;
drop policy if exists "settings admin update" on public.site_settings;
create policy "settings readable" on public.site_settings for select using (true);
create policy "settings admin insert" on public.site_settings for insert to authenticated with check (public.is_admin());
create policy "settings admin update" on public.site_settings for update to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- ACCOUNT DELETION — a user can erase themselves (cascades cleanly)
-- ------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- ------------------------------------------------------------
-- ADMIN OPERATIONS — each checks the admin stamp server-side
-- ------------------------------------------------------------
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if target = auth.uid() then raise exception 'Use account deletion for yourself'; end if;
  delete from auth.users where id = target;
end;
$$;

create or replace function public.admin_set_listing_active(p_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  update public.listings set is_active = p_active where listings.id = p_id;
end;
$$;

create or replace function public.admin_delete_listing(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  delete from public.listings where listings.id = p_id;
end;
$$;

create or replace function public.admin_delete_person(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  delete from public.people where people.id = p_id;
end;
$$;

create or replace function public.admin_set_admin(target uuid, make_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  if target = auth.uid() and not make_admin then
    raise exception 'Another admin must remove your access — keeps you locked out safely';
  end if;
  update public.profiles set is_admin = make_admin where id = target;
end;
$$;

-- everything the panel needs, in one admin-gated call
create or replace function public.admin_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'listings', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select id, title, price, unit, category, is_active, created_at,
               person_name, person_slug
        from public.market_listings order by created_at desc limit 200) t),
    'people', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select id, name, slug, photo_url, created_at
        from public.people order by created_at desc limit 200) t),
    'users', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select id, display_name, email, is_admin, created_at
        from public.profiles order by created_at desc limit 200) t),
    'orders', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select id, buyer_id, items, totals, payment_method, created_at
        from public.orders order by created_at desc limit 100) t),
    'stats', jsonb_build_object(
        'humans', (select count(*) from public.people),
        'listings', (select count(*) from public.listings),
        'users', (select count(*) from public.profiles),
        'orders', (select count(*) from public.orders),
        'reviews', (select count(*) from public.reviews))
  );
$$;

-- maintenance switch — on: requires minutes (1..30 days); off: clears it
create or replace function public.set_maintenance(on_off boolean, minutes int, note text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing jsonb;
  new_value jsonb;
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;

  select value into existing from public.site_settings where key = 'maintenance';

  if on_off then
    if minutes is null or minutes < 1 or minutes > 43200 then
      raise exception 'Pick a duration between 1 minute and 30 days';
    end if;
    new_value := jsonb_build_object(
      'on', true,
      'ends_at', now() + (minutes || ' minutes')::interval,
      'note', coalesce(nullif(trim(note), ''), 'Restocking the shelves. Back soon!')
    );
  else
    new_value := coalesce(existing, '{}'::jsonb) || jsonb_build_object('on', false, 'ends_at', null);
  end if;

  insert into public.site_settings (key, value, updated_at)
  values ('maintenance', new_value, now())
  on conflict (key) do update set value = excluded.value, updated_at = excluded.updated_at;

  return new_value;
end;
$$;

revoke all on function public.delete_own_account() from anon, public;
revoke all on function public.admin_delete_user(uuid) from anon, public;
revoke all on function public.admin_set_listing_active(uuid, boolean) from anon, public;
revoke all on function public.admin_delete_listing(uuid) from anon, public;
revoke all on function public.admin_delete_person(uuid) from anon, public;
revoke all on function public.admin_set_admin(uuid, boolean) from anon, public;
revoke all on function public.admin_snapshot() from anon, public;
revoke all on function public.set_maintenance(boolean, int, text) from anon, public;
grant execute on function public.delete_own_account() to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_set_listing_active(uuid, boolean) to authenticated;
grant execute on function public.admin_delete_listing(uuid) to authenticated;
grant execute on function public.admin_delete_person(uuid) to authenticated;
grant execute on function public.admin_set_admin(uuid, boolean) to authenticated;
grant execute on function public.admin_snapshot() to authenticated;
grant execute on function public.set_maintenance(boolean, int, text) to authenticated;

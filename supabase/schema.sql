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
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.people   enable row level security;
alter table public.listings enable row level security;
alter table public.reviews  enable row level security;
alter table public.orders   enable row level security;
alter table public.reports  enable row level security;

-- profiles: readable by all (names show on reviews), editable by owner
create policy "profiles readable" on public.profiles for select using (true);
create policy "profiles self-update" on public.profiles for update using (auth.uid() = id);

-- people: readable by all; created by any logged-in user; editable by creator/claimer
create policy "people readable" on public.people for select using (true);
create policy "people insert" on public.people for insert to authenticated with check (auth.uid() = created_by);
create policy "people update" on public.people for update
  using (auth.uid() = created_by or auth.uid() = claimed_by);

-- listings: active ones readable by all; CRUD by owner
create policy "listings readable" on public.listings for select using (true);
create policy "listings insert" on public.listings for insert to authenticated with check (auth.uid() = created_by);
create policy "listings update" on public.listings for update using (auth.uid() = created_by);
create policy "listings delete" on public.listings for delete using (auth.uid() = created_by);

-- reviews: readable by all; insert/delete your own
create policy "reviews readable" on public.reviews for select using (true);
create policy "reviews insert" on public.reviews for insert to authenticated with check (auth.uid() = author_id);
create policy "reviews delete" on public.reviews for delete using (auth.uid() = author_id);

-- orders: strictly private to the buyer
create policy "orders own" on public.orders for select using (auth.uid() = buyer_id);
create policy "orders insert" on public.orders for insert to authenticated with check (auth.uid() = buyer_id);

-- reports: anyone logged in can file; nobody reads them via the API
create policy "reports insert" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);

-- ------------------------------------------------------------
-- STORAGE — public bucket for person/listing photos
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos public read" on storage.objects
  for select using (bucket_id = 'photos');
create policy "photos authenticated upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'photos');
create policy "photos owner delete" on storage.objects
  for delete to authenticated using (bucket_id = 'photos' and owner = auth.uid());

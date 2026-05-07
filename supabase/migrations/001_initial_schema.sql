-- Migration 001: Initial schema
-- Core tables, RLS policies, and profile auto-creation trigger
-- Run: Week 1-2

create table public.workshops (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  slug       text not null unique,
  verified   boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  workshop_id uuid references public.workshops(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table public.listings (
  id           uuid default gen_random_uuid() primary key,
  workshop_id  uuid references public.workshops(id) on delete cascade not null,
  material     text not null,
  finish       text not null,
  length_mm    integer not null,
  width_mm     integer not null,
  thickness_mm integer not null,
  quantity     integer not null default 1,
  price_pence  integer not null,
  description  text,
  status       text not null default 'active',
  created_at   timestamptz not null default now(),
  constraint listings_positive_dimensions check (length_mm > 0 and width_mm > 0 and thickness_mm > 0),
  constraint listings_positive_quantity   check (quantity > 0),
  constraint listings_positive_price      check (price_pence > 0),
  constraint listings_valid_status        check (status in ('active','sold','archived')),
  constraint listings_valid_material      check (material in ('MDF','Plywood','Chipboard','Oak','Birch ply','Pine','Walnut','Beech')),
  constraint listings_valid_finish        check (finish in ('Raw / unfinished','White melamine','Oak veneer','Walnut veneer','Black melamine','Birch faced','Pre-primed','Laminated'))
);

-- Auto-create a profile row for every new sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Back-fill a profile for any existing accounts
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- Row Level Security
alter table public.workshops enable row level security;
alter table public.profiles  enable row level security;
alter table public.listings  enable row level security;

create policy "workshops: authenticated read"
  on public.workshops for select to authenticated using (true);
create policy "workshops: authenticated insert"
  on public.workshops for insert to authenticated with check (true);
create policy "workshops: members can update"
  on public.workshops for update to authenticated
  using (id = (select workshop_id from public.profiles where id = auth.uid()));

create policy "profiles: own row read"
  on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles: own row update"
  on public.profiles for update to authenticated using (id = auth.uid());

create policy "listings: read active or own workshop"
  on public.listings for select to authenticated using (
    status = 'active'
    or workshop_id = (select workshop_id from public.profiles where id = auth.uid())
  );
create policy "listings: insert for own workshop"
  on public.listings for insert to authenticated
  with check (workshop_id = (select workshop_id from public.profiles where id = auth.uid()));
create policy "listings: update own workshop"
  on public.listings for update to authenticated
  using (workshop_id = (select workshop_id from public.profiles where id = auth.uid()));
create policy "listings: delete own workshop"
  on public.listings for delete to authenticated
  using (workshop_id = (select workshop_id from public.profiles where id = auth.uid()));

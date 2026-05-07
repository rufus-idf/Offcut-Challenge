-- Migration 007: Camera app API key authentication
-- Each workshop gets a unique API key the camera app uses to authenticate ingest requests
-- Also makes finish nullable on stock_items — camera doesn't capture finish,
-- the workshop sets it before publishing to the marketplace
-- Run: Camera integration phase

create table public.workshop_api_keys (
  id          uuid default gen_random_uuid() primary key,
  workshop_id uuid references public.workshops(id) on delete cascade not null unique,
  api_key     text not null unique,
  created_at  timestamptz not null default now()
);

alter table public.workshop_api_keys enable row level security;

-- Only the owning workshop can see their own key
create policy "api keys: own workshop read"
  on public.workshop_api_keys for select to authenticated
  using (workshop_id = (select workshop_id from public.profiles where id = auth.uid()));

create policy "api keys: own workshop insert"
  on public.workshop_api_keys for insert to authenticated
  with check (workshop_id = (select workshop_id from public.profiles where id = auth.uid()));

create policy "api keys: own workshop delete"
  on public.workshop_api_keys for delete to authenticated
  using (workshop_id = (select workshop_id from public.profiles where id = auth.uid()));

-- Camera doesn't know the finish of a piece — workshop sets it before publishing
alter table public.stock_items alter column finish drop not null;

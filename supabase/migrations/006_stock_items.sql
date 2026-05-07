-- Migration 006: Stock items table and stock/marketplace split
-- stock_items is the canonical private inventory for each workshop
-- Listings are the public marketplace subset, linked back to a stock_item
-- Schema is camera-ready from day one (vertices_mm, svg_path_data etc.)
-- Manual entries use shape_type=RECT with vertices_mm left null
-- Run: Week 5 (stock/marketplace split)

create table public.stock_items (
  id            uuid default gen_random_uuid() primary key,
  workshop_id   uuid references public.workshops(id) on delete cascade not null,
  source        text not null default 'manual',
  shape_type    text not null default 'RECT',
  category      text not null,
  material      text not null,
  finish        text not null,
  length_mm     integer,
  width_mm      integer,
  thickness_mm  integer not null,
  bbox_w_mm     float,
  bbox_h_mm     float,
  area_mm2      float,
  vertices_mm   jsonb,
  svg_path_data text,
  quantity      integer not null default 1,
  description   text,
  notes         text,
  status        text not null default 'available',
  created_at    timestamptz not null default now(),
  constraint stock_items_valid_status     check (status in ('available','listed','sold','used','archived')),
  constraint stock_items_valid_source     check (source in ('manual','camera')),
  constraint stock_items_valid_shape_type check (shape_type in ('RECT','L','C','POLY'))
);

alter table public.stock_items enable row level security;

create policy "stock: workshop members read own"
  on public.stock_items for select to authenticated
  using (workshop_id = (select workshop_id from public.profiles where id = auth.uid()));

create policy "stock: insert for own workshop"
  on public.stock_items for insert to authenticated
  with check (workshop_id = (select workshop_id from public.profiles where id = auth.uid()));

create policy "stock: update own workshop"
  on public.stock_items for update to authenticated
  using (workshop_id = (select workshop_id from public.profiles where id = auth.uid()));

create policy "stock: delete own workshop"
  on public.stock_items for delete to authenticated
  using (workshop_id = (select workshop_id from public.profiles where id = auth.uid()));

-- Link listings back to the stock item they came from
-- Nullable so pre-migration listings are unaffected
alter table public.listings
  add column stock_item_id uuid references public.stock_items(id) on delete set null;

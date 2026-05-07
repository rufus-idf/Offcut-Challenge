-- Migration 002: Listing images table and Supabase Storage bucket
-- Supports optional photo uploads on listings (JPEG/PNG/WebP, max 5MB)
-- Run: Week 3
-- NOTE: This block was confirmed run (photos work in app) but was not in the
-- user's saved list — reconstructed from what was sent in the conversation.

create table public.listing_images (
  id           uuid default gen_random_uuid() primary key,
  listing_id   uuid references public.listings(id) on delete cascade not null,
  storage_path text not null,
  position     integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.listing_images enable row level security;

create policy "listing images: authenticated read"
  on public.listing_images for select to authenticated using (true);

create policy "listing images: insert for own workshop"
  on public.listing_images for insert to authenticated
  with check (
    listing_id in (
      select id from public.listings
      where workshop_id = (select workshop_id from public.profiles where id = auth.uid())
    )
  );

create policy "listing images: delete for own workshop"
  on public.listing_images for delete to authenticated
  using (
    listing_id in (
      select id from public.listings
      where workshop_id = (select workshop_id from public.profiles where id = auth.uid())
    )
  );

-- Public storage bucket (images must load without auth headers)
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true);

create policy "listing images storage: public read"
  on storage.objects for select using (bucket_id = 'listing-images');

create policy "listing images storage: authenticated upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-images');

create policy "listing images storage: authenticated delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'listing-images');

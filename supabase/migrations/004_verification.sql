-- Migration 004: Workshop verification workflow
-- Replaces the simple verified boolean with a full verification_status workflow
-- Adds Companies House, VAT, and location fields
-- Adds admin RLS policy for rufus@i-designfurniture.com
-- Run: Week 4

alter table public.workshops drop column if exists verified;

alter table public.workshops
  add column companies_house_number text,
  add column companies_house_name    text,
  add column vat_number              text,
  add column town                    text,
  add column county                  text,
  add column postcode                text,
  add column verification_status     text not null default 'unverified',
  add column rejection_reason        text,
  add column verified_at             timestamptz;

alter table public.workshops
  add constraint workshops_valid_verification_status
  check (verification_status in ('unverified','pending','approved','rejected'));

-- Allow admin account to update any workshop's verification status
create policy "workshops: admin can update any"
  on public.workshops for update to authenticated
  using  (auth.email() = 'rufus@i-designfurniture.com')
  with check (auth.email() = 'rufus@i-designfurniture.com');

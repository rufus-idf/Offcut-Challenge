-- Migration 005: Geocoding columns for distance-based browse sorting
-- lat/lng populated from workshop postcode via postcodes.io at verification time
-- Used by the browse page to sort listings nearest-first when user enters their postcode
-- Run: Week 4

alter table public.workshops
  add column lat double precision,
  add column lng double precision;

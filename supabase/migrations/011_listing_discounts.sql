-- 011_listing_discounts.sql
-- Single-tier quantity discount per listing.
-- Seller sets a minimum quantity and a percentage off.
-- Both columns are nullable — null means no discount on that listing.
-- Multi-tier support can be added later via a separate listing_price_tiers table.

ALTER TABLE listings
  ADD COLUMN discount_min_qty integer CHECK (discount_min_qty >= 2),
  ADD COLUMN discount_pct     integer CHECK (discount_pct BETWEEN 1 AND 80);

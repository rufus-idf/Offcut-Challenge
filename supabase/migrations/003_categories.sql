-- Migration 003: Add category system and expand material/finish constraints
-- Adds Wood / Metal / Plastic / Other categories
-- Expands material and finish lists beyond wood-only
-- Run: Week 3

alter table public.listings
  add column category text not null default 'Wood';

alter table public.listings
  add constraint listings_valid_category
  check (category in ('Wood', 'Metal', 'Plastic', 'Other'));

alter table public.listings drop constraint listings_valid_material;
alter table public.listings add constraint listings_valid_material
  check (material in (
    -- Wood
    'MDF','Plywood','Chipboard','Oak','Birch ply','Pine','Walnut','Beech',
    -- Metal
    'Mild steel','Stainless steel','Aluminium','Copper','Brass','Cast iron',
    -- Plastic
    'Acrylic','HDPE','Polypropylene','PVC','Polycarbonate','ABS',
    -- Other
    'Foam','Rubber','Cork','Composite','Carbon fibre','Glass'
  ));

alter table public.listings drop constraint listings_valid_finish;
alter table public.listings add constraint listings_valid_finish
  check (finish in (
    -- Wood
    'Raw / unfinished','White melamine','Oak veneer','Walnut veneer',
    'Black melamine','Birch faced','Pre-primed','Laminated',
    -- Metal
    'Powder coated','Galvanised','Brushed','Anodised','Painted','Polished',
    -- Plastic
    'Natural','Clear','Frosted','Coloured','Textured',
    -- Other
    'Coated','Treated'
  ));

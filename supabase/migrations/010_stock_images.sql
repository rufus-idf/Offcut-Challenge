-- 010_stock_images.sql
-- Photos attached to stock items before they're published to the marketplace.
-- Reuses the existing 'listing-images' storage bucket with a 'stock/' path prefix
-- (e.g. stock/{stock_item_id}/{timestamp}-{random}.jpg).
-- On publish, rows are copied into listing_images so the listing inherits them.

CREATE TABLE stock_images (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_item_id uuid        NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
  storage_path  text        NOT NULL,
  position      integer     NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stock_images ENABLE ROW LEVEL SECURITY;

-- Workshops can only see and manage their own stock images
CREATE POLICY "Workshops can manage their own stock images"
  ON stock_images FOR ALL TO authenticated
  USING (
    stock_item_id IN (
      SELECT id FROM stock_items
      WHERE workshop_id = (
        SELECT workshop_id FROM profiles WHERE id = auth.uid()
      )
    )
  )
  WITH CHECK (
    stock_item_id IN (
      SELECT id FROM stock_items
      WHERE workshop_id = (
        SELECT workshop_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

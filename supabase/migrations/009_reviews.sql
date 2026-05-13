-- 009_reviews.sql
-- Workshop-to-workshop reviews and star ratings.
-- For now: one review per reviewer/reviewed pair (updated in place).
-- Post-Stripe: constraint will be relaxed to one review per completed transaction (listing_id).

CREATE TABLE reviews (
  id                   uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  reviewer_workshop_id uuid        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  reviewed_workshop_id uuid        NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  rating               integer     NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment              text,
  listing_id           uuid        REFERENCES listings(id) ON DELETE SET NULL, -- reserved for Stripe integration
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT no_self_review    CHECK (reviewer_workshop_id <> reviewed_workshop_id),
  CONSTRAINT one_review_per_pair UNIQUE (reviewer_workshop_id, reviewed_workshop_id)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read reviews"
  ON reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "Workshops can insert their own reviews"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_workshop_id IN (
      SELECT workshop_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Workshops can update their own reviews"
  ON reviews FOR UPDATE TO authenticated
  USING (
    reviewer_workshop_id IN (
      SELECT workshop_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Workshops can delete their own reviews"
  ON reviews FOR DELETE TO authenticated
  USING (
    reviewer_workshop_id IN (
      SELECT workshop_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 008_workshop_profile.sql
-- Adds logo and website URL to workshop profiles.
-- Run in Supabase SQL editor.
--
-- Also requires a 'workshop-logos' storage bucket created in the Supabase dashboard:
--   Storage → New bucket → Name: workshop-logos → Public: ON
--
-- Then add these storage policies for the new bucket:
--   SELECT policy: authenticated users can read all logos
--     (bucket_id = 'workshop-logos')
--   INSERT policy: workshop members can upload their own logo
--     (bucket_id = 'workshop-logos' AND (storage.foldername(name))[1] = auth.uid()::text)
--   UPDATE/DELETE policy: same as INSERT

ALTER TABLE workshops
  ADD COLUMN IF NOT EXISTS logo_url   text,
  ADD COLUMN IF NOT EXISTS website_url text;

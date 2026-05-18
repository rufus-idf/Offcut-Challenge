-- Migration 013: Fix recursive profiles RLS policy
-- The "same workshop read" policy added in 012 queries the profiles table from
-- within a profiles policy, causing a recursive loop in PostgreSQL. The policy
-- is unnecessary because all cross-user profile reads in the team feature use
-- the admin (service role) client which bypasses RLS entirely.
-- Run: immediately after deploying the team members feature

DROP POLICY IF EXISTS "profiles: same workshop read" ON public.profiles;

-- Migration 012: Team members
-- Adds multi-user support for workshops: role column on profiles, invitations table, and supporting RLS policies.
-- Run: when team members feature is deployed

-- ── profiles: add role column ─────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN role text NOT NULL DEFAULT 'owner'
  CONSTRAINT profiles_valid_role CHECK (role IN ('owner', 'member'));

-- Allow members of the same workshop to see each other's profiles
-- (needed for the settings Team section to list all members)
CREATE POLICY "profiles: same workshop read"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    workshop_id IS NOT NULL
    AND workshop_id = (SELECT workshop_id FROM public.profiles WHERE id = auth.uid())
  );

-- ── invitations table ─────────────────────────────────────────────────────────

CREATE TABLE public.invitations (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  workshop_id   uuid        REFERENCES public.workshops(id) ON DELETE CASCADE NOT NULL,
  invited_email text        NOT NULL,
  token         text        UNIQUE NOT NULL,
  invited_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  status        text        NOT NULL DEFAULT 'pending'
    CONSTRAINT invitations_valid_status CHECK (status IN ('pending', 'accepted', 'cancelled')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Workshop members can view their workshop's pending/all invitations
CREATE POLICY "invitations: workshop members read"
  ON public.invitations FOR SELECT TO authenticated
  USING (
    workshop_id = (SELECT workshop_id FROM public.profiles WHERE id = auth.uid())
  );

-- Only the workshop owner can send invitations
CREATE POLICY "invitations: owner insert"
  ON public.invitations FOR INSERT TO authenticated
  WITH CHECK (
    workshop_id = (SELECT workshop_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  );

-- Only the workshop owner can cancel invitations
CREATE POLICY "invitations: owner update"
  ON public.invitations FOR UPDATE TO authenticated
  USING (
    workshop_id = (SELECT workshop_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'owner'
  );

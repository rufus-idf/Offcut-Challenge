'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function acceptInvite(token: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?redirect=${encodeURIComponent(`/invite/${token}`)}`)

  // Look up the invitation via admin client (bypasses RLS — token is effectively a secret)
  const { data: invitation } = await admin
    .from('invitations')
    .select('id, workshop_id, status, expires_at, workshops(name)')
    .eq('token', token)
    .maybeSingle()

  if (!invitation) redirect(`/invite/${token}?error=invalid`)
  if (invitation.status !== 'pending') redirect(`/invite/${token}?error=used`)
  if (new Date(invitation.expires_at) < new Date()) redirect(`/invite/${token}?error=expired`)

  // Check this user isn't already in a workshop
  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (profile?.workshop_id) redirect(`/invite/${token}?error=already_member`)

  // Check the workshop hasn't hit the 3-member cap
  const { count } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('workshop_id', invitation.workshop_id)

  if ((count ?? 0) >= 3) redirect(`/invite/${token}?error=full`)

  // Link the user to the workshop as a member
  await admin
    .from('profiles')
    .update({ workshop_id: invitation.workshop_id, role: 'member' })
    .eq('id', user.id)

  // Mark invitation as accepted
  await admin
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  const workshopName = (invitation.workshops as unknown as { name: string } | null)?.name ?? 'the workshop'

  revalidatePath('/dashboard')
  redirect('/dashboard?message=' + encodeURIComponent(`You've joined ${workshopName}!`))
}

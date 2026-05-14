'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendInviteEmail } from '@/lib/resend'

export async function updateWebsiteUrl(workshopId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const websiteUrl = (formData.get('website_url') as string).trim() || null

  const { error } = await supabase
    .from('workshops')
    .update({ website_url: websiteUrl })
    .eq('id', workshopId)

  if (error) redirect('/settings?error=' + encodeURIComponent(error.message))

  revalidatePath('/settings')
  redirect('/settings?message=Profile+updated')
}

export async function uploadLogo(workshopId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const file = formData.get('logo') as File
  if (!file || file.size === 0) redirect('/settings?error=No+file+selected')
  if (file.size > 2 * 1024 * 1024) redirect('/settings?error=Logo+must+be+under+2MB')

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${workshopId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('workshop-logos')
    .upload(storagePath, file, { upsert: true, contentType: file.type })

  if (uploadError) redirect('/settings?error=' + encodeURIComponent(uploadError.message))

  const { error: updateError } = await supabase
    .from('workshops')
    .update({ logo_url: storagePath })
    .eq('id', workshopId)

  if (updateError) redirect('/settings?error=' + encodeURIComponent(updateError.message))

  revalidatePath('/settings')
  revalidatePath(`/workshops`)
  redirect('/settings?message=Logo+updated')
}

export async function removeLogo(workshopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: workshop } = await supabase
    .from('workshops')
    .select('logo_url')
    .eq('id', workshopId)
    .single()

  if (workshop?.logo_url) {
    await supabase.storage.from('workshop-logos').remove([workshop.logo_url])
  }

  await supabase.from('workshops').update({ logo_url: null }).eq('id', workshopId)

  revalidatePath('/settings')
  revalidatePath('/workshops')
  redirect('/settings?message=Logo+removed')
}

// ─── Team management ──────────────────────────────────────────────────────────

export async function sendInvite(workshopId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, workshop_id')
    .eq('id', user.id)
    .single()

  if (!callerProfile || callerProfile.workshop_id !== workshopId || callerProfile.role !== 'owner') {
    redirect('/settings?error=' + encodeURIComponent('Only the workshop owner can invite members'))
  }

  const { data: workshop } = await supabase
    .from('workshops')
    .select('name')
    .eq('id', workshopId)
    .single()

  // Count existing members — max 3 total (owner + 2)
  const { count: memberCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('workshop_id', workshopId)

  if ((memberCount ?? 0) >= 3) {
    redirect('/settings?error=' + encodeURIComponent('Maximum of 3 members per workshop (owner + 2)'))
  }

  const email = (formData.get('email') as string).trim().toLowerCase()

  // Block duplicate pending invites to the same address
  const { data: existing } = await supabase
    .from('invitations')
    .select('id')
    .eq('workshop_id', workshopId)
    .eq('invited_email', email)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) {
    redirect('/settings?error=' + encodeURIComponent('An invite is already pending for that email'))
  }

  const token = crypto.randomUUID()

  const { error } = await supabase
    .from('invitations')
    .insert({ workshop_id: workshopId, invited_email: email, token, invited_by: user.id })

  if (error) redirect('/settings?error=' + encodeURIComponent(error.message))

  await sendInviteEmail({
    invitedEmail: email,
    workshopName: workshop?.name ?? 'your workshop',
    invitedByEmail: user.email!,
    token,
  })

  revalidatePath('/settings')
  redirect('/settings?message=' + encodeURIComponent(`Invite sent to ${email}`))
}

export async function cancelInvite(invitationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await supabase
    .from('invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)

  revalidatePath('/settings')
  redirect('/settings?message=Invite+cancelled')
}

export async function removeMember(profileId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('workshop_id, role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || callerProfile.role !== 'owner') {
    redirect('/settings?error=' + encodeURIComponent('Only the workshop owner can remove members'))
  }

  const { data: targetProfile } = await admin
    .from('profiles')
    .select('workshop_id, role')
    .eq('id', profileId)
    .single()

  if (!targetProfile || targetProfile.workshop_id !== callerProfile.workshop_id) {
    redirect('/settings?error=Not+authorised')
  }

  if (targetProfile.role === 'owner') {
    redirect('/settings?error=' + encodeURIComponent('Cannot remove the workshop owner'))
  }

  await admin
    .from('profiles')
    .update({ workshop_id: null, role: 'owner' })
    .eq('id', profileId)

  revalidatePath('/settings')
  redirect('/settings?message=Member+removed')
}

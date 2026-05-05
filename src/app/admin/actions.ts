'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'rufus@i-designfurniture.com'

export async function approveWorkshop(workshopId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== ADMIN_EMAIL) return

  await supabase
    .from('workshops')
    .update({
      verification_status: 'approved',
      verified_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', workshopId)

  revalidatePath('/admin')
}

export async function rejectWorkshop(workshopId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email !== ADMIN_EMAIL) return

  const reason = (formData.get('reason') as string)?.trim()

  await supabase
    .from('workshops')
    .update({
      verification_status: 'rejected',
      rejection_reason: reason || 'Your application was not approved.',
    })
    .eq('id', workshopId)

  revalidatePath('/admin')
}

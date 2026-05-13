'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const reviewedWorkshopId = formData.get('reviewed_workshop_id') as string
  const slug               = formData.get('slug') as string
  const rating             = parseInt(formData.get('rating') as string, 10)
  const comment            = (formData.get('comment') as string | null)?.trim() || null

  if (!rating || rating < 1 || rating > 5 || !reviewedWorkshopId) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id || profile.workshop_id === reviewedWorkshopId) return

  await supabase
    .from('reviews')
    .upsert(
      {
        reviewer_workshop_id: profile.workshop_id,
        reviewed_workshop_id: reviewedWorkshopId,
        rating,
        comment,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'reviewer_workshop_id,reviewed_workshop_id' },
    )

  revalidatePath(`/workshops/${slug}`)
  redirect(`/workshops/${slug}`)
}

export async function deleteReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const reviewedWorkshopId = formData.get('reviewed_workshop_id') as string
  const slug               = formData.get('slug') as string

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) return

  await supabase
    .from('reviews')
    .delete()
    .eq('reviewer_workshop_id', profile.workshop_id)
    .eq('reviewed_workshop_id', reviewedWorkshopId)

  revalidatePath(`/workshops/${slug}`)
  redirect(`/workshops/${slug}`)
}

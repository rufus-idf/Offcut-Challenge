'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('workshop_id')
    .eq('id', user.id)
    .single()

  if (!profile?.workshop_id) redirect('/onboarding')

  const lengthMm = parseInt(formData.get('length_mm') as string, 10)
  const widthMm  = parseInt(formData.get('width_mm') as string, 10)
  const thickMm  = parseInt(formData.get('thickness_mm') as string, 10)
  const qty      = parseInt(formData.get('quantity') as string, 10)
  const description = (formData.get('description') as string).trim() || null

  // Create stock item only — no listing yet.
  // The workshop reviews their stock and publishes to the marketplace separately.
  const { error } = await supabase
    .from('stock_items')
    .insert({
      workshop_id:  profile.workshop_id,
      source:       'manual',
      shape_type:   'RECT',
      category:     formData.get('category') as string,
      material:     formData.get('material') as string,
      finish:       formData.get('finish') as string,
      length_mm:    lengthMm,
      width_mm:     widthMm,
      thickness_mm: thickMm,
      bbox_w_mm:    lengthMm,
      bbox_h_mm:    widthMm,
      area_mm2:     lengthMm * widthMm,
      quantity:     qty,
      description,
      status:       'available',
    })

  if (error) {
    redirect(`/listings/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

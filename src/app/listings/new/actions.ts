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

  const priceStr = formData.get('price') as string
  // Convert £ input to pence — avoid float arithmetic with rounding
  const pricePence = Math.round(parseFloat(priceStr) * 100)

  const description = (formData.get('description') as string).trim()

  const { data, error } = await supabase.from('listings').insert({
    workshop_id: profile.workshop_id,
    category:     formData.get('category') as string,
    material:     formData.get('material') as string,
    finish:       formData.get('finish') as string,
    length_mm:    parseInt(formData.get('length_mm') as string, 10),
    width_mm:     parseInt(formData.get('width_mm') as string, 10),
    thickness_mm: parseInt(formData.get('thickness_mm') as string, 10),
    quantity:     parseInt(formData.get('quantity') as string, 10),
    price_pence:  pricePence,
    description:  description || null,
  }).select('id').single()

  if (error) {
    redirect(`/listings/new?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard')
  revalidatePath('/listings')
  redirect(`/listings/${data.id}`)
}

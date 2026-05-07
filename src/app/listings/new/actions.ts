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

  const lengthMm  = parseInt(formData.get('length_mm') as string, 10)
  const widthMm   = parseInt(formData.get('width_mm') as string, 10)
  const thickMm   = parseInt(formData.get('thickness_mm') as string, 10)
  const qty       = parseInt(formData.get('quantity') as string, 10)
  const pricePence = Math.round(parseFloat(formData.get('price') as string) * 100)
  const category  = formData.get('category') as string
  const material  = formData.get('material') as string
  const finish    = formData.get('finish') as string
  const description = (formData.get('description') as string).trim() || null

  // 1. Create the stock item — the canonical inventory record
  const { data: stockItem, error: stockError } = await supabase
    .from('stock_items')
    .insert({
      workshop_id:   profile.workshop_id,
      source:        'manual',
      shape_type:    'RECT',
      category,
      material,
      finish,
      length_mm:     lengthMm,
      width_mm:      widthMm,
      thickness_mm:  thickMm,
      bbox_w_mm:     lengthMm,   // same as length for rectangles
      bbox_h_mm:     widthMm,    // same as width for rectangles
      area_mm2:      lengthMm * widthMm,
      quantity:      qty,
      description,
      status:        'listed',   // manual entries auto-publish
    })
    .select('id')
    .single()

  if (stockError) {
    redirect(`/listings/new?error=${encodeURIComponent(stockError.message)}`)
  }

  // 2. Create the marketplace listing linked to the stock item
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .insert({
      workshop_id:   profile.workshop_id,
      stock_item_id: stockItem.id,
      category,
      material,
      finish,
      length_mm:     lengthMm,
      width_mm:      widthMm,
      thickness_mm:  thickMm,
      quantity:      qty,
      price_pence:   pricePence,
      description,
    })
    .select('id')
    .single()

  if (listingError) {
    redirect(`/listings/new?error=${encodeURIComponent(listingError.message)}`)
  }

  revalidatePath('/dashboard')
  revalidatePath('/listings')
  redirect(`/listings/${listing.id}`)
}

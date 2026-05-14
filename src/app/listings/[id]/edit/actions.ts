'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateListing(listingId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const pricePence      = Math.round(parseFloat(formData.get('price') as string) * 100)
  const qty             = parseInt(formData.get('quantity') as string, 10)
  const finish          = (formData.get('finish') as string).trim()
  const description     = (formData.get('description') as string).trim() || null
  const discountEnabled = formData.get('discount_enabled') === '1'
  const discountMinQty  = discountEnabled ? parseInt(formData.get('discount_min_qty') as string, 10) || null : null
  const discountPct     = discountEnabled ? parseInt(formData.get('discount_pct')     as string, 10) || null : null

  // Fetch listing — RLS ensures only the owning workshop can update
  const { data: listing } = await supabase
    .from('listings')
    .select('id, status, stock_item_id')
    .eq('id', listingId)
    .single()

  if (!listing || listing.status !== 'active') {
    redirect(`/listings/${listingId}/edit?error=Only+active+listings+can+be+edited`)
  }

  const { error } = await supabase
    .from('listings')
    .update({ price_pence: pricePence, quantity: qty, finish, description, discount_min_qty: discountMinQty, discount_pct: discountPct })
    .eq('id', listingId)

  if (error) {
    redirect(`/listings/${listingId}/edit?error=${encodeURIComponent(error.message)}`)
  }

  // Keep finish in sync on the stock item too
  if (listing.stock_item_id) {
    await supabase
      .from('stock_items')
      .update({ finish, quantity: qty, description })
      .eq('id', listing.stock_item_id)
  }

  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/listings')
  revalidatePath('/dashboard')
  redirect(`/listings/${listingId}`)
}

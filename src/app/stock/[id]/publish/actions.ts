'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function publishToMarketplace(stockItemId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const pricePence = Math.round(parseFloat(formData.get('price') as string) * 100)

  // Fetch the stock item — RLS ensures this is the workshop's own item
  const { data: item } = await supabase
    .from('stock_items')
    .select('*')
    .eq('id', stockItemId)
    .single()

  if (!item || item.status !== 'available') {
    redirect(`/stock/${stockItemId}/publish?error=Item+is+not+available+to+publish`)
  }

  // Create the public listing
  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      workshop_id:   item.workshop_id,
      stock_item_id: item.id,
      category:      item.category,
      material:      item.material,
      finish:        item.finish,
      length_mm:     item.length_mm,
      width_mm:      item.width_mm,
      thickness_mm:  item.thickness_mm,
      quantity:      item.quantity,
      price_pence:   pricePence,
      description:   item.description,
    })
    .select('id')
    .single()

  if (error) {
    redirect(`/stock/${stockItemId}/publish?error=${encodeURIComponent(error.message)}`)
  }

  // Mark the stock item as listed
  await supabase
    .from('stock_items')
    .update({ status: 'listed' })
    .eq('id', stockItemId)

  revalidatePath('/dashboard')
  revalidatePath('/listings')
  redirect(`/listings/${listing.id}`)
}

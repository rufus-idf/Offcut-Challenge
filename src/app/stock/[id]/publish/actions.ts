'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function publishToMarketplace(stockItemId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const pricePence = Math.round(parseFloat(formData.get('price') as string) * 100)
  const finish   = (formData.get('finish') as string).trim()
  const listQty  = parseInt(formData.get('list_qty') as string, 10)

  // Fetch the stock item — RLS ensures this is the workshop's own item
  const { data: item } = await supabase
    .from('stock_items')
    .select('*')
    .eq('id', stockItemId)
    .single()

  if (!item || item.status !== 'available') {
    redirect(`/stock/${stockItemId}/publish?error=Item+is+not+available+to+publish`)
  }

  // For non-rectangular shapes length_mm/width_mm are null on the stock item.
  // Use the bounding box as the best approximation — the SVG preview shows the real shape.
  const lengthMm = item.length_mm ?? (item.bbox_w_mm ? Math.round(item.bbox_w_mm) : null)
  const widthMm  = item.width_mm  ?? (item.bbox_h_mm ? Math.round(item.bbox_h_mm) : null)

  // Create the public listing
  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      workshop_id:   item.workshop_id,
      stock_item_id: item.id,
      category:      item.category,
      material:      item.material,
      finish,
      length_mm:     lengthMm,
      width_mm:      widthMm,
      thickness_mm:  item.thickness_mm,
      quantity:      Math.min(listQty, item.quantity),
      price_pence:   pricePence,
      description:   item.description,
    })
    .select('id')
    .single()

  if (error) {
    redirect(`/stock/${stockItemId}/publish?error=${encodeURIComponent(error.message)}`)
  }

  // Mark stock item as listed and save the finish back to it
  await supabase
    .from('stock_items')
    .update({ status: 'listed', finish })
    .eq('id', stockItemId)

  revalidatePath('/dashboard')
  revalidatePath('/listings')
  redirect(`/listings/${listing.id}`)
}

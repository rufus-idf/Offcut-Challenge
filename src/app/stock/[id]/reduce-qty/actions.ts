'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function reduceQuantity(stockItemId: string, listingId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const soldQty = parseInt(formData.get('sold_qty') as string, 10)
  if (!soldQty || soldQty < 1) redirect(`/stock/${stockItemId}/reduce-qty?error=Enter+a+valid+quantity`)

  const { data: item } = await supabase
    .from('stock_items')
    .select('quantity')
    .eq('id', stockItemId)
    .single()

  if (!item) redirect('/dashboard')

  const remaining = item.quantity - soldQty

  if (remaining <= 0) {
    // All units sold — close listing and mark stock as sold
    await supabase.from('stock_items').update({ status: 'sold', quantity: 0 }).eq('id', stockItemId)
    await supabase.from('listings').update({ status: 'sold', quantity: 0 }).eq('id', listingId)
    revalidatePath('/dashboard')
    redirect('/dashboard?message=All+units+sold+-+listing+closed')
  } else {
    // Partial sell — reduce quantity on both tables, listing stays active
    await supabase.from('stock_items').update({ quantity: remaining }).eq('id', stockItemId)
    await supabase.from('listings').update({ quantity: remaining }).eq('id', listingId)
    revalidatePath('/dashboard')
    revalidatePath('/listings')
    redirect(`/dashboard?message=${remaining}+unit${remaining === 1 ? '' : 's'}+remaining+-+listing+updated`)
  }
}

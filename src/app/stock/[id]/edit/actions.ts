'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateStockItem(stockItemId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify ownership via RLS
  const { data: item } = await supabase
    .from('stock_items')
    .select('id, status, workshop_id')
    .eq('id', stockItemId)
    .single()

  if (!item || item.status !== 'available') {
    redirect(`/stock/${stockItemId}/edit?error=Only+in-stock+items+can+be+edited`)
  }

  const lengthMm = parseInt(formData.get('length_mm') as string, 10)
  const widthMm  = parseInt(formData.get('width_mm') as string, 10)
  const thickMm  = parseInt(formData.get('thickness_mm') as string, 10)
  const qty      = parseInt(formData.get('quantity') as string, 10)
  const description = (formData.get('description') as string).trim() || null

  const { error } = await supabase
    .from('stock_items')
    .update({
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
    })
    .eq('id', stockItemId)

  if (error) {
    redirect(`/stock/${stockItemId}/edit?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard')
  redirect('/dashboard?message=Stock+item+updated')
}

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

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export async function uploadStockImage(stockItemId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const files = (formData.getAll('photo') as File[]).filter(f => f.size > 0)
  if (!files.length) redirect(`/stock/${stockItemId}/edit?error=No+file+selected`)

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type))
      redirect(`/stock/${stockItemId}/edit?error=Only+JPEG,+PNG,+and+WebP+images+are+accepted`)
    if (file.size > MAX_BYTES)
      redirect(`/stock/${stockItemId}/edit?error=Each+image+must+be+under+5MB`)
  }

  const { count: existingCount } = await supabase
    .from('stock_images')
    .select('id', { count: 'exact', head: true })
    .eq('stock_item_id', stockItemId)

  let position = existingCount ?? 0

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const storagePath = `stock/${stockItemId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('listing-images')
      .upload(storagePath, file, { contentType: file.type })

    if (storageError)
      redirect(`/stock/${stockItemId}/edit?error=${encodeURIComponent(storageError.message)}`)

    await supabase.from('stock_images').insert({
      stock_item_id: stockItemId,
      storage_path: storagePath,
      position: position++,
    })
  }

  revalidatePath(`/stock/${stockItemId}/edit`)
  revalidatePath('/dashboard')
  redirect(`/stock/${stockItemId}/edit`)
}

export async function deleteStockImage(imageId: string, stockItemId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: image } = await supabase
    .from('stock_images')
    .select('storage_path')
    .eq('id', imageId)
    .single()

  if (!image) return

  await supabase.storage.from('listing-images').remove([image.storage_path])
  await supabase.from('stock_images').delete().eq('id', imageId)

  revalidatePath(`/stock/${stockItemId}/edit`)
  revalidatePath('/dashboard')
}

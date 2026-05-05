'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function uploadImage(listingId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const file = formData.get('photo') as File

  if (!file || file.size === 0) {
    redirect(`/listings/${listingId}?error=No+file+selected`)
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    redirect(`/listings/${listingId}?error=Only+JPEG,+PNG,+and+WebP+images+are+accepted`)
  }
  if (file.size > MAX_BYTES) {
    redirect(`/listings/${listingId}?error=Image+must+be+under+5MB`)
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${listingId}/${Date.now()}.${ext}`

  const { error: storageError } = await supabase.storage
    .from('listing-images')
    .upload(storagePath, file, { contentType: file.type })

  if (storageError) {
    redirect(`/listings/${listingId}?error=${encodeURIComponent(storageError.message)}`)
  }

  // Use existing image count as position so new uploads go to the end
  const { count } = await supabase
    .from('listing_images')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)

  await supabase.from('listing_images').insert({
    listing_id: listingId,
    storage_path: storagePath,
    position: count ?? 0,
  })

  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/listings')
  revalidatePath('/dashboard')
  redirect(`/listings/${listingId}`)
}

export async function deleteImage(imageId: string, listingId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: image } = await supabase
    .from('listing_images')
    .select('storage_path')
    .eq('id', imageId)
    .single()

  if (!image) return

  // Delete file first, then the DB row (RLS enforces workshop ownership)
  await supabase.storage.from('listing-images').remove([image.storage_path])
  await supabase.from('listing_images').delete().eq('id', imageId)

  revalidatePath(`/listings/${listingId}`)
  revalidatePath('/listings')
  revalidatePath('/dashboard')
}

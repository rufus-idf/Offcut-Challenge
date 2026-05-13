'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendEnquiryEmail } from '@/lib/resend'

export async function enquireListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const listingId   = formData.get('listing_id') as string
  const requestedQty = parseInt(formData.get('quantity') as string, 10)

  const [{ data: listing }, { data: profile }] = await Promise.all([
    supabase
      .from('listings')
      .select('material, finish, price_pence, quantity, workshops(name)')
      .eq('id', listingId)
      .single(),
    supabase
      .from('profiles')
      .select('workshop_id, workshops(name)')
      .eq('id', user.id)
      .single(),
  ])

  if (!listing || !profile) redirect(`/listings/${listingId}`)

  const sellerName = (listing.workshops as unknown as { name: string }).name
  const buyerName  = (profile.workshops as unknown as { name: string }).name
  const qty = Math.min(Math.max(1, requestedQty), listing.quantity)

  sendEnquiryEmail({
    buyerWorkshop: buyerName,
    sellerWorkshop: sellerName,
    material: listing.material,
    finish: listing.finish,
    pricePence: listing.price_pence,
    requestedQty: qty,
    listingUrl: `https://offcut-challenge.vercel.app/listings/${listingId}`,
  }).catch(() => {})

  redirect(`/listings/${listingId}?enquired=1`)
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function uploadImage(listingId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const files = (formData.getAll('photo') as File[]).filter(f => f.size > 0)
  if (!files.length) redirect(`/listings/${listingId}?error=No+file+selected`)

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      redirect(`/listings/${listingId}?error=Only+JPEG,+PNG,+and+WebP+images+are+accepted`)
    }
    if (file.size > MAX_BYTES) {
      redirect(`/listings/${listingId}?error=Each+image+must+be+under+5MB`)
    }
  }

  // Get current count once so positions are consecutive
  const { count: existingCount } = await supabase
    .from('listing_images')
    .select('id', { count: 'exact', head: true })
    .eq('listing_id', listingId)

  let position = existingCount ?? 0

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    // Random suffix avoids collisions when multiple files share a timestamp
    const storagePath = `${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`

    const { error: storageError } = await supabase.storage
      .from('listing-images')
      .upload(storagePath, file, { contentType: file.type })

    if (storageError) {
      redirect(`/listings/${listingId}?error=${encodeURIComponent(storageError.message)}`)
    }

    await supabase.from('listing_images').insert({
      listing_id: listingId,
      storage_path: storagePath,
      position: position++,
    })
  }

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

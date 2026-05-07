'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markAsSold(stockItemId: string, listingId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // RLS ensures workshops can only update their own rows
  await Promise.all([
    supabase.from('listings').update({ status: 'sold' }).eq('id', listingId),
    supabase.from('stock_items').update({ status: 'sold' }).eq('id', stockItemId),
  ])

  revalidatePath('/dashboard')
  revalidatePath('/listings')
}

export async function archiveItem(stockItemId: string, listingId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await Promise.all([
    supabase.from('listings').update({ status: 'archived' }).eq('id', listingId),
    supabase.from('stock_items').update({ status: 'archived' }).eq('id', stockItemId),
  ])

  revalidatePath('/dashboard')
  revalidatePath('/listings')
}

export async function relistItem(stockItemId: string, listingId: string, _formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await Promise.all([
    supabase.from('listings').update({ status: 'active' }).eq('id', listingId),
    supabase.from('stock_items').update({ status: 'listed' }).eq('id', stockItemId),
  ])

  revalidatePath('/dashboard')
  revalidatePath('/listings')
}

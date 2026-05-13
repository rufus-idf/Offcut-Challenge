'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateWebsiteUrl(workshopId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const websiteUrl = (formData.get('website_url') as string).trim() || null

  const { error } = await supabase
    .from('workshops')
    .update({ website_url: websiteUrl })
    .eq('id', workshopId)

  if (error) redirect('/settings?error=' + encodeURIComponent(error.message))

  revalidatePath('/settings')
  redirect('/settings?message=Profile+updated')
}

export async function uploadLogo(workshopId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const file = formData.get('logo') as File
  if (!file || file.size === 0) redirect('/settings?error=No+file+selected')
  if (file.size > 2 * 1024 * 1024) redirect('/settings?error=Logo+must+be+under+2MB')

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storagePath = `${workshopId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('workshop-logos')
    .upload(storagePath, file, { upsert: true, contentType: file.type })

  if (uploadError) redirect('/settings?error=' + encodeURIComponent(uploadError.message))

  const { error: updateError } = await supabase
    .from('workshops')
    .update({ logo_url: storagePath })
    .eq('id', workshopId)

  if (updateError) redirect('/settings?error=' + encodeURIComponent(updateError.message))

  revalidatePath('/settings')
  revalidatePath(`/workshops`)
  redirect('/settings?message=Logo+updated')
}

export async function removeLogo(workshopId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: workshop } = await supabase
    .from('workshops')
    .select('logo_url')
    .eq('id', workshopId)
    .single()

  if (workshop?.logo_url) {
    await supabase.storage.from('workshop-logos').remove([workshop.logo_url])
  }

  await supabase.from('workshops').update({ logo_url: null }).eq('id', workshopId)

  revalidatePath('/settings')
  revalidatePath('/workshops')
  redirect('/settings?message=Logo+removed')
}

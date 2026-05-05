'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createWorkshop(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const name = (formData.get('name') as string).trim()
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data: workshop, error: workshopError } = await supabase
    .from('workshops')
    .insert({ name, slug })
    .select('id')
    .single()

  if (workshopError) {
    const msg = workshopError.code === '23505'
      ? 'A workshop with that name already exists — try adding your town or county.'
      : workshopError.message
    redirect(`/onboarding?error=${encodeURIComponent(msg)}`)
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ workshop_id: workshop.id })
    .eq('id', user.id)

  if (profileError) {
    redirect(`/onboarding?error=${encodeURIComponent(profileError.message)}`)
  }

  redirect('/dashboard')
}

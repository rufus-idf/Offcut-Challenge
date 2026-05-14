'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function safeRedirect(url: string | null | undefined): string {
  // Only allow relative paths to prevent open-redirect attacks
  if (url && url.startsWith('/') && !url.startsWith('//')) return url
  return '/dashboard'
}

export async function login(formData: FormData) {
  const supabase = await createClient()
  const redirectTo = safeRedirect(formData.get('redirect') as string)

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    const redirectParam = redirectTo !== '/dashboard' ? `&redirect=${encodeURIComponent(redirectTo)}` : ''
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}${redirectParam}`)
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo)
}

export async function signup(formData: FormData) {
  const supabase = await createClient()
  const redirectTo = safeRedirect(formData.get('redirect') as string)

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    const redirectParam = redirectTo !== '/dashboard' ? `&redirect=${encodeURIComponent(redirectTo)}` : ''
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}${redirectParam}`)
  }

  // If a session came back, email confirmation is disabled — go straight to the target
  if (data.session) {
    revalidatePath('/', 'layout')
    redirect(redirectTo)
  }

  // Otherwise Supabase sent a confirmation email — tell the user to check their inbox
  const redirectParam = redirectTo !== '/dashboard' ? `&redirect=${encodeURIComponent(redirectTo)}` : ''
  redirect(`/auth/signup?message=Check+your+email+to+confirm+your+account${redirectParam}`)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}
